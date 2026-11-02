-- Push is a projection of the existing versioned cloud save, not another event source.
begin;
create table public.shadow_push_devices (
 user_id uuid not null references auth.users(id) on delete cascade,
 device_id uuid not null, name text not null check(length(name) between 1 and 80),
 subscription jsonb not null, endpoint text not null unique,
 enabled boolean not null default true, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), last_test_at timestamptz,
 primary key(user_id,device_id)
);
create table public.shadow_push_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_id text not null, version text not null, title text not null, event_date date not null,
 due_at timestamptz not null,event_at timestamptz not null,expires_at timestamptz not null,
 cancelled boolean not null default false, unique(user_id,event_id,version)
);
create table public.shadow_push_deliveries (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.shadow_push_jobs(id) on delete cascade,
 user_id uuid not null,device_id uuid not null, state text not null default 'queued' check(state in ('queued','sending','sent','retry','failed','uncertain','cancelled')),
 attempts int not null default 0, next_attempt timestamptz not null default now(), claimed_at timestamptz,
 claim_token uuid, sent_at timestamptz,error_code text,
 foreign key(user_id,device_id) references public.shadow_push_devices(user_id,device_id) on delete cascade,
 unique(job_id,device_id)
);
create index shadow_push_due on public.shadow_push_jobs(due_at) where not cancelled;
create index shadow_push_retry on public.shadow_push_deliveries(next_attempt) where state in ('queued','retry');
alter table public.shadow_push_devices enable row level security;
alter table public.shadow_push_jobs enable row level security;
alter table public.shadow_push_deliveries enable row level security;
revoke all on public.shadow_push_devices,public.shadow_push_jobs,public.shadow_push_deliveries from anon,authenticated;
grant select on public.shadow_push_devices,public.shadow_push_jobs,public.shadow_push_deliveries to authenticated;
grant all on public.shadow_push_devices,public.shadow_push_jobs,public.shadow_push_deliveries to service_role;
create policy own_push_devices on public.shadow_push_devices for select to authenticated using(user_id=(select auth.uid()));
create policy own_push_jobs on public.shadow_push_jobs for select to authenticated using(user_id=(select auth.uid()));
create policy own_push_deliveries on public.shadow_push_deliveries for select to authenticated using(user_id=(select auth.uid()));

create function public.shadow_push_device(action text, device uuid, device_name text default null, sub jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sub_endpoint text; result jsonb;
begin
 if uid is null then raise exception 'Authentication required';end if;
 if action='register' then
  sub_endpoint:=sub->>'endpoint';
  if device is null or device_name is null or length(device_name) not between 1 and 80
   or sub_endpoint is null or length(sub_endpoint)>2048
   or sub_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-zA-Z0-9-]+\.notify\.windows\.com)/'
   or coalesce(sub#>>'{keys,p256dh}','') !~ '^[A-Za-z0-9_-]{87}=?$'
   or coalesce(sub#>>'{keys,auth}','') !~ '^[A-Za-z0-9_-]{22}==?$' and coalesce(sub#>>'{keys,auth}','') !~ '^[A-Za-z0-9_-]{22}$'
   then raise exception 'Invalid push subscription';end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if (select count(*) from public.shadow_push_devices where user_id=uid and enabled and device_id<>device)>=20 then raise exception 'Device limit reached';end if;
  if exists(select 1 from public.shadow_push_devices where shadow_push_devices.endpoint=sub_endpoint and user_id<>uid) then raise exception 'Subscription belongs to another account; unsubscribe first';end if;
  delete from public.shadow_push_devices where user_id=uid and shadow_push_devices.endpoint=sub_endpoint and device_id<>device;
  insert into public.shadow_push_devices(user_id,device_id,name,subscription,endpoint) values(uid,device,device_name,sub,sub_endpoint)
  on conflict(user_id,device_id) do update set name=excluded.name,subscription=excluded.subscription,endpoint=excluded.endpoint,enabled=true,updated_at=now();
 elsif action='disable' then
  update public.shadow_push_devices set enabled=false,updated_at=now() where user_id=uid and device_id=device;
  update public.shadow_push_deliveries set state='cancelled' where user_id=uid and device_id=device and state in ('queued','retry');
 elsif action='test' then
  update public.shadow_push_devices set last_test_at=now() where user_id=uid and device_id=device and enabled and (last_test_at is null or last_test_at<now()-interval '30 seconds') returning subscription into result;
  if result is null then raise exception 'Register this device first or wait 30 seconds';end if;
  return jsonb_build_object('subscription',result);
 elsif action<>'status' then raise exception 'Unknown action';
 end if;
 select jsonb_build_object('registered',coalesce((select enabled from public.shadow_push_devices where user_id=uid and device_id=device),false),'enabledDevices',(select count(*) from public.shadow_push_devices where user_id=uid and enabled),'pending',(select count(*) from public.shadow_push_jobs where user_id=uid and not cancelled and expires_at>now()),'failed',(select count(*) from public.shadow_push_deliveries where user_id=uid and state in ('failed','uncertain')),'lastDelivery',(select jsonb_build_object('state',state,'attempts',attempts,'sentAt',sent_at,'errorCode',error_code) from public.shadow_push_deliveries where user_id=uid and device_id=device order by claimed_at desc nulls last limit 1)) into result;
 return result;
end $$;
revoke all on function public.shadow_push_device(text,uuid,text,jsonb) from public,anon;
grant execute on function public.shadow_push_device(text,uuid,text,jsonb) to authenticated;

create function public.shadow_push_project() returns trigger language plpgsql security definer set search_path='' as $$
declare doc jsonb; e jsonb; n jsonb; tz text; wall timestamp; moment timestamptz; due timestamptz; minutes int; fingerprint text; accepted text[]:='{}';
begin
 -- Old clients do not erase the schedule when their payload has no calendar field.
 doc:=new.payload::jsonb;
 if not(doc?'calendar') then return new;end if;
 if jsonb_typeof(doc#>'{calendar,events}') is distinct from 'array' then
  update public.shadow_push_jobs set cancelled=true where user_id=new.user_id;return new;
 end if;
 for e in select value from jsonb_array_elements(doc#>'{calendar,events}') loop
  begin
   n:=e->'notification';
   if coalesce((e->>'completed')::boolean,false) or n is null or n='null'::jsonb or n->>'offsetMinutes' is null then continue;end if;
   minutes:=(n->>'offsetMinutes')::int;tz:=n->>'timeZone';
   if minutes not in (0,5,15,30,60,1440) or length(e->>'id') not between 1 and 100 or length(e->>'title') not between 1 and 150 or not exists(select 1 from pg_timezone_names where name=tz) then continue;end if;
   wall:=((e->>'date')||' '||coalesce(nullif(e->>'time',''),n->>'allDayTime'))::timestamp;
   moment:=wall at time zone tz;
   -- Nonexistent spring DST wall times are not silently shifted.
   if moment at time zone tz<>wall then continue;end if;
   due:=moment-make_interval(mins=>minutes);
   fingerprint:=md5(jsonb_build_array(e->>'date',e->>'time',n)::text);
   insert into public.shadow_push_jobs(user_id,event_id,version,title,event_date,due_at,event_at,expires_at)
    values(new.user_id,e->>'id',fingerprint,e->>'title',(e->>'date')::date,due,moment,least(due+interval '10 minutes',moment+interval '5 minutes'))
    on conflict(user_id,event_id,version) do update set title=excluded.title,cancelled=false;
   accepted:=array_append(accepted,(e->>'id')||':'||fingerprint);
  exception when others then
   -- Malformed reminder data must never break an otherwise valid full-save write.
   continue;
  end;
 end loop;
 update public.shadow_push_jobs set cancelled=true where user_id=new.user_id and not((event_id||':'||version)=any(accepted));
 update public.shadow_push_deliveries d set state='cancelled' from public.shadow_push_jobs j where d.job_id=j.id and j.user_id=new.user_id and j.cancelled and d.state in ('queued','retry');
 return new;
end $$;
revoke all on function public.shadow_push_project() from public,anon,authenticated;
create trigger shadow_push_after_save after insert or update of payload on public.shadow_cloud_saves for each row execute function public.shadow_push_project();

create function public.shadow_push_claim(batch_size int default 40) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 delete from public.shadow_push_jobs where expires_at<now()-interval '30 days';
 delete from public.shadow_push_devices where not enabled and updated_at<now()-interval '30 days';
 -- A crash/timeout after dispatch has an unknown outcome: do not automatically resend.
 update public.shadow_push_deliveries set state='uncertain',error_code='dispatch_outcome_unknown' where state='sending' and claimed_at<now()-interval '2 minutes';
 insert into public.shadow_push_deliveries(job_id,user_id,device_id)
 select j.id,j.user_id,d.device_id from public.shadow_push_jobs j join public.shadow_push_devices d on d.user_id=j.user_id and d.enabled and d.created_at<=j.due_at
 where not j.cancelled and j.due_at<=now() and j.expires_at>now() on conflict(job_id,device_id) do nothing;
 with candidates as (
  select d.id from public.shadow_push_deliveries d join public.shadow_push_jobs j on j.id=d.job_id join public.shadow_push_devices p on p.user_id=d.user_id and p.device_id=d.device_id
  where d.state in ('queued','retry') and d.next_attempt<=now() and d.attempts<3 and not j.cancelled and j.expires_at>now() and p.enabled
  order by j.due_at for update of d skip locked limit greatest(1,least(batch_size,100))
 ), claimed as (
  update public.shadow_push_deliveries d set state='sending',claimed_at=now(),attempts=attempts+1,claim_token=gen_random_uuid() where d.id in(select id from candidates) returning d.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'claimToken',d.claim_token,'userId',d.user_id,'eventId',j.event_id,'title',j.title,'date',j.event_date,'eventAt',j.event_at,'expiresAt',j.expires_at,'subscription',p.subscription)), '[]'::jsonb) into result
 from claimed d join public.shadow_push_jobs j on j.id=d.job_id join public.shadow_push_devices p on p.user_id=d.user_id and p.device_id=d.device_id;
 return result;
end $$;
create function public.shadow_push_prepare(delivery uuid, token uuid) returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from public.shadow_push_deliveries d join public.shadow_push_jobs j on j.id=d.job_id join public.shadow_push_devices p on p.user_id=d.user_id and p.device_id=d.device_id where d.id=delivery and d.claim_token=token and d.state='sending' and p.enabled and not j.cancelled and j.expires_at>now());
$$;
create function public.shadow_push_finish(delivery uuid,token uuid,outcome text,code text default null) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;dev uuid;
begin
 if outcome not in('sent','retry','failed','uncertain','cancelled','expired') then raise exception 'Invalid outcome';end if;
 update public.shadow_push_deliveries set state=case when outcome='expired' then 'failed' when outcome='retry' and attempts>=3 then 'failed' else outcome end,
  sent_at=case when outcome='sent' then now() else sent_at end,error_code=left(code,80),next_attempt=now()+interval '60 seconds'
 where id=delivery and claim_token=token and state='sending' returning user_id,device_id into uid,dev;
 if outcome='expired' and uid is not null then update public.shadow_push_devices set enabled=false,subscription='{}'::jsonb,endpoint='expired:'||device_id::text||':'||user_id::text where user_id=uid and device_id=dev;end if;
end $$;
revoke all on function public.shadow_push_claim(int),public.shadow_push_prepare(uuid,uuid),public.shadow_push_finish(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.shadow_push_claim(int),public.shadow_push_prepare(uuid,uuid),public.shadow_push_finish(uuid,uuid,text,text) to service_role;
-- Reconcile any already-synced opt-in reminders without changing revisions.
update public.shadow_cloud_saves set payload=payload;
commit;

