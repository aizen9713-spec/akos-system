begin;
create table public.shadow_cloud_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null check (revision > 0),
 payload text not null check (octet_length(payload) <= 4000000),
 updated_at timestamptz not null default now()
);
alter table public.shadow_cloud_saves enable row level security;
revoke all on public.shadow_cloud_saves from anon, authenticated;
grant select on public.shadow_cloud_saves to authenticated;
create policy own_save on public.shadow_cloud_saves for select to authenticated using ((select auth.uid()) = user_id);
create function public.shadow_cloud_write(expected_revision bigint, new_payload text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); next_revision bigint; doc jsonb;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if expected_revision < 0 or expected_revision is null or new_payload is null or octet_length(new_payload)>4000000 then raise exception 'Invalid input'; end if;
 doc := new_payload::jsonb;
 if jsonb_typeof(doc) <> 'object' or jsonb_typeof(doc->'player') is distinct from 'object' or jsonb_typeof(doc->'quests') is distinct from 'array' then raise exception 'Invalid save'; end if;
 if expected_revision = 0 then
  insert into public.shadow_cloud_saves(user_id,revision,payload) values(uid,1,new_payload) on conflict do nothing returning revision into next_revision;
 else
  update public.shadow_cloud_saves set payload=new_payload,revision=revision+1,updated_at=now() where user_id=uid and revision=expected_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'Cloud conflict; compare again' using errcode='40001'; end if;
 return next_revision;
end $$;
revoke all on function public.shadow_cloud_write(bigint,text) from public, anon;
grant execute on function public.shadow_cloud_write(bigint,text) to authenticated;
commit;
