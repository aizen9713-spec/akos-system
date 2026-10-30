/* Cloud Core 1: explicit enrollment, whole-save CAS, no credentials at rest. */
(function(root){
'use strict';
const decide=(b,l,r)=>b===null?'choose':l===r?'equal':l===b?'pull':r===b?'push':'choose';
function validate(raw){
 if(typeof raw!=='string'||raw.length>4000000)throw Error('Invalid save size');
 const x=JSON.parse(raw);
 if(!x||Array.isArray(x)||!x.player||typeof x.player.name!=='string'||!Array.isArray(x.quests)||!Array.isArray(x.history)||!x.settings||!x.stats||!x.skills||!Array.isArray(x.achievements))throw Error('Invalid system save');
 if(x.training!==undefined)TrainingData.validate(x.training);
 return x;
}
root.CloudLogic={decide,validate};
if(typeof document==='undefined')return;
const key='akos-system-v0.1.0',prefix='shadow-cloud-v1:';
let session=null,config=null,busy=false,baseline=null,preview=null,epoch=0;
const panel=document.createElement('section');panel.className='card';panel.id='cloud-core-panel';
 const style=document.createElement('style');style.textContent='#cloud-core-panel label{display:grid;gap:6px;margin:12px 0}#cloud-core-panel input{width:100%;min-width:0;box-sizing:border-box}#cloud-core-panel button{min-height:44px;margin:6px;white-space:normal}#cloud-core-panel pre{overflow-wrap:anywhere}';document.head.appendChild(style);
panel.innerHTML='<h2>CLOUD CORE · BUILD 1</h2><p>Fejlesztői teszt. Első kapcsolódáskor válassz adatforrást. A megjelenés eszközönként marad.</p><label>Supabase URL<input id="cloud-url" type="url" placeholder="https://project.supabase.co"></label><label>Publishable kulcs<input id="cloud-key" autocomplete="off"></label><label>Email<input id="cloud-email" type="email" autocomplete="username"></label><label>Jelszó<input id="cloud-password" type="password" autocomplete="current-password"></label><button id="cloud-login" type="button">Bejelentkezés</button><button id="cloud-stop" type="button">Kapcsolat leállítása</button><p id="cloud-status" role="status">Kikapcsolva · csak helyi mentés</p><pre id="cloud-preview" style="white-space:pre-wrap"></pre><div id="cloud-choices" hidden><button id="cloud-local" type="button">Ez az eszköz legyen a forrás</button><button id="cloud-remote" type="button">A felhő legyen a forrás</button></div>';
(document.getElementById('page-system')||document.querySelector('main')).appendChild(panel);
const el=id=>document.getElementById('cloud-'+id),status=s=>el('status').textContent=s;
function stop(){epoch++;session=null;baseline=null;preview=null;el('choices').hidden=true;status('Kikapcsolva · helyi adatok megőrizve');}
async function request(path,body,token=true){
 const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'omit',headers:{apikey:config.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+session.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Felhőkérés sikertelen ('+r.status+'). Helyi mentés megőrizve.');
 return r.status===204?null:r.json();
}
async function refresh(){if(Date.now()/1000>session.expires_at-60){const s=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token},false);session={...s,expires_at:Date.now()/1000+s.expires_in};}}
function summary(raw){if(raw===null)return 'Nincs mentés';const x=validate(raw);return JSON.stringify({nev:x.player.name,szint:x.player.level,streak:x.player.streak,quests:x.quests.length,napok:x.history.length,edzesek:x.training?.history.length||0,tervek:x.training?.templates.length||0,utolsoMentes:x.lastSavedAt},null,2);}
function choose(local,remote){preview={local,remote};el('preview').textContent='HELYI\n'+summary(local)+'\nFELHŐ · rev '+(remote?.revision||0)+'\n'+summary(remote?.payload??null);el('choices').hidden=false;el('remote').disabled=!remote;status('Adatforrás-választás szükséges. Nincs automatikus felülírás.');}
function checkpoint(local,remote){localStorage.setItem(prefix+'backup:'+crypto.randomUUID(),JSON.stringify({at:new Date().toISOString(),local,remote}));}
async function push(local,remote){validate(local);checkpoint(local,remote);const revision=await request('/rest/v1/rpc/shadow_cloud_write',{expected_revision:remote?.revision||0,new_payload:local});baseline=local;status('Felhő visszaigazolta · rev '+revision+' · felhasználói teszt még szükséges');}
function pull(local,remote){
 const next=migrateState(validate(remote.payload));
 if(next.training===undefined && state.training)next.training=structuredClone(state.training);
 if(localStorage.getItem(key)!==local)throw Error('A helyi mentés megváltozott; új összehasonlítás szükséges.');
 if(document.activeElement?.matches('input,textarea,select'))throw Error('Aktív szerkesztés: felhőbetöltés szünetel.');
 checkpoint(local,remote);const previous=state;
 try{localStorage.setItem(key,remote.payload);state=next;render();baseline=remote.payload;status('Felhőmentés betöltve · felhasználói teszt szükséges');}
 catch(e){state=previous;localStorage.setItem(key,local);throw e;}
}
async function sync(source){
 if(!session||busy||!navigator.onLine)return;
 busy=true;const generation=epoch;
 try{
  await refresh();const rows=await request('/rest/v1/shadow_cloud_saves?select=revision,payload');
  if(generation!==epoch)return;
  if(rows.length>1)throw Error('Unexpected cloud rows');
  const remote=rows[0]||null,local=localStorage.getItem(key);validate(local);if(remote)validate(remote.payload);
  if(source){
   if(!preview||preview.local!==local||JSON.stringify(preview.remote)!==JSON.stringify(remote)){choose(local,remote);return;}
   if(!confirm(source==='local'?'A helyi mentés váltsa fel a felhőpéldányt? Mindkettőről helyi biztonsági másolat készül.':'A felhőmentés váltsa fel az eszköz mentését? Mindkettőről helyi biztonsági másolat készül.'))return;
   el('choices').hidden=true;preview=null;
   if(source==='local')await push(local,remote);else if(remote)pull(local,remote);
   return;
  }
  if(preview){choose(local,remote);return;}
  const action=decide(baseline,local,remote?.payload??null);
  if(action==='choose')choose(local,remote);
  if(action==='equal'){baseline=local;status('Azonos helyi és felhőmentés · felhasználói teszt még szükséges');}
  if(action==='push')await push(local,remote);
  if(action==='pull')pull(local,remote);
 }catch(e){baseline=null;status(e.message+' Új összehasonlítás szükséges.');}finally{busy=false;}
}
el('login').onclick=async()=>{
 if(busy)return;stop();busy=true;
 try{
  const u=new URL(el('url').value);if(u.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(u.hostname)||u.username||u.password||u.port)throw Error('Érvényes Supabase HTTPS projekt URL szükséges');
  const k=el('key').value.trim();if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(k))throw Error('Kizárólag nyilvános sb_publishable_ kulcs használható');
  config={url:u.origin,key:k};const s=await request('/auth/v1/token?grant_type=password',{email:el('email').value.trim(),password:el('password').value},false);
  session={...s,expires_at:Date.now()/1000+s.expires_in};status('Bejelentkezve · összehasonlítás');
 }catch(e){session=null;status(e.message);}finally{el('password').value='';busy=false;}
 await sync();
};
el('stop').onclick=()=>{if(busy){status('Folyamatban lévő kérés befejezésére várj, majd állítsd le.');return;}stop();};el('local').onclick=()=>sync('local');el('remote').onclick=()=>sync('remote');
setInterval(()=>sync(),5000);window.addEventListener('online',()=>sync());window.addEventListener('offline',()=>status('Offline · helyi mentés megőrizve, szinkronizálás később'));
})(globalThis);
