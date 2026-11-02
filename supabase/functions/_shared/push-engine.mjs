// Runtime-neutral handlers; Deno entrypoints inject environment, fetch and the Web Push transport.
export const allowedOffsets=[0,5,15,30,60,1440];
export function validSubscription(s){
 try{const u=new URL(s?.endpoint),host=u.hostname;
 return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.href.length<=2048&&
 (['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(host)||/^[a-z0-9-]+\.notify\.windows\.com$/.test(host))&&
 /^[A-Za-z0-9_-]{87}=?$/.test(s.keys?.p256dh)&&/^[A-Za-z0-9_-]{22}(?:==?)?$/.test(s.keys?.auth);
 }catch{return false;}
}
export function outcome(error){const code=Number(error?.statusCode);return code===404||code===410?'expired':code===429||code===503?'retry':code>=400&&code<500?'failed':'uncertain';}
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
function response(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});}
async function body(req){const text=await req.text();if(text.length>12000)throw Error('request_too_large');return JSON.parse(text);}
function backend(env,fetch){const url=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)throw Error('backend_not_configured');return async(name,args,access)=>{const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:access?env('SUPABASE_ANON_KEY'):key,Authorization:'Bearer '+(access||key),'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(r.status===404?'backend_not_installed':'backend_rejected');return r.status===204?null:r.json();};}
function vapid(env){const publicKey=env('PUSH_VAPID_PUBLIC_KEY'),privateKey=env('PUSH_VAPID_PRIVATE_KEY'),subject=env('PUSH_VAPID_SUBJECT');if(!publicKey||!privateKey||!subject||! /^(mailto:|https:)/.test(subject))throw Error('push_not_configured');return {subject,publicKey,privateKey};}
export function createUserHandler({env,fetch,send}){return async req=>{
 const origin=req.headers.get('origin'),origins=(env('PUSH_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);
 const cors={'Access-Control-Allow-Origin':origin||'null','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 if(!origin||!origins.includes(origin))return response({error:'origin_not_allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return response({error:'method_not_allowed'},405,cors);
 try{
  const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return response({error:'authentication_required'},401,cors);
  const userResponse=await fetch(env('SUPABASE_URL')+'/auth/v1/user',{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:auth},signal:AbortSignal.timeout(15000)});
  if(!userResponse.ok)return response({error:'authentication_required'},401,cors);const user=await userResponse.json();if(!uuid(user.id))return response({error:'authentication_required'},401,cors);
  const b=await body(req),keys=vapid(env),rpc=backend(env,fetch),access=auth.slice(7);
  if(!['status','register','disable','test','config'].includes(b.action))return response({error:'invalid_action'},400,cors);
  if(b.action==='config')return response({publicKey:keys.publicKey,version:1},200,cors);
  if(!uuid(b.deviceId))return response({error:'invalid_device'},400,cors);
  if(b.action==='register'&&(!validSubscription(b.subscription)||typeof b.name!=='string'||!b.name.trim()||b.name.length>80))return response({error:'invalid_subscription'},400,cors);
  const result=await rpc('shadow_push_device',{action:b.action,device:b.deviceId,device_name:b.name||null,sub:b.subscription||null},access);
  if(b.action==='test'){
   if(!validSubscription(result.subscription))throw Error('invalid_subscription');
   try{await send(result.subscription,JSON.stringify({v:1,userId:user.id,deliveryId:crypto.randomUUID(),title:'SHADOW OS',body:'Push notifications are working on this device.',test:true}),{vapidDetails:keys,TTL:120,timeout:10000,urgency:'normal'});}
   catch(e){if(outcome(e)==='expired')await rpc('shadow_push_device',{action:'disable',device:b.deviceId},access);return response({error:'test_delivery_failed'},502,cors);}
   return response({accepted:true},200,cors);
  }
  return response(result,200,cors);
 }catch(e){const safe=['backend_not_configured','backend_not_installed','push_not_configured','backend_rejected','invalid_subscription'].includes(e.message)?e.message:'push_request_failed';return response({error:safe},503,cors);}
};}
function secretEqual(a,b){if(!a||!b||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export function createDispatchHandler({env,fetch,send}){return async req=>{
 if(req.method!=='POST')return response({error:'method_not_allowed'},405);
 if(!secretEqual(req.headers.get('x-shadow-cron-secret'),env('PUSH_CRON_SECRET')))return response({error:'unauthorized'},401);
 try{const rpc=backend(env,fetch),keys=vapid(env),jobs=await rpc('shadow_push_claim',{batch_size:32});let sent=0,skipped=0;
 let cursor=0;async function deliver(){while(cursor<jobs.length){const j=jobs[cursor++];
  if(!await rpc('shadow_push_prepare',{delivery:j.id,token:j.claimToken})){await rpc('shadow_push_finish',{delivery:j.id,token:j.claimToken,outcome:'cancelled',code:'cancelled_before_send'});skipped++;continue;}
  let result='sent',code=null;
  try{if(!validSubscription(j.subscription))throw {statusCode:400};const TTL=Math.max(1,Math.min(600,Math.floor((Date.parse(j.expiresAt)-Date.now())/1000)));if(Date.parse(j.expiresAt)<=Date.now()){result='cancelled';code='expired_reminder';}else{await send(j.subscription,JSON.stringify({v:1,userId:j.userId,deliveryId:j.id,eventId:j.eventId,date:j.date,title:'SHADOW OS · Calendar',body:j.title,eventAt:j.eventAt,expiresAt:j.expiresAt}),{vapidDetails:keys,TTL,timeout:10000,urgency:'normal'});sent++;}}
  catch(e){result=outcome(e);code=Number.isFinite(Number(e?.statusCode))?'push_'+Number(e.statusCode):'dispatch_outcome_unknown';}
  await rpc('shadow_push_finish',{delivery:j.id,token:j.claimToken,outcome:result,code});
 }
 }
 const results=await Promise.allSettled(Array.from({length:Math.min(8,jobs.length)},()=>deliver()));
 const errors=results.filter(r=>r.status==='rejected').length;
 return response({claimed:jobs.length,sent,skipped,errors},errors?503:200);
 }catch{return response({error:'dispatch_failed'},503);}
};}
