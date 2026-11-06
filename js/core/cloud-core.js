/* Cloud Core 2.0: durable recovery, remembered enrollment and whole-save CAS. */
(function(root){
'use strict';
const decide=(b,l,r)=>l===r?'equal':b===null?'choose':l===b?'pull':r===b?'push':'choose';
function validate(raw){
 if(typeof raw!=='string'||raw.length>4000000)throw Error('Invalid save size');
 const x=JSON.parse(raw);
 if(!x||Array.isArray(x)||!x.player||typeof x.player.name!=='string'||!Array.isArray(x.quests)||!Array.isArray(x.history)||!x.settings||!x.stats||!x.skills||!Array.isArray(x.achievements))throw Error('Invalid system save');
 if(x.calendar!==undefined)CalendarData.validate(x.calendar);
 if(x.training!==undefined)TrainingData.validate(x.training);
 return x;
}
root.CloudLogic={decide,validate};
if(typeof document==='undefined')return;
const key='akos-system-v0.1.0',prefix='shadow-cloud-v1:';
let session=null,config=null,busy=false,baseline=null,preview=null,epoch=0;
let accountId=null, storageError=null, booting=true;
const connectionKey=prefix+'connection',preferencesKey=prefix+'preferences';
const editingFields=new WeakSet();
let observedRevision=null,lastRead=null,lastWrite=null,lastApply=null,lastError=null;
const panel=document.createElement('section');panel.className='card';panel.id='cloud-core-panel';
 const style=document.createElement('style');style.textContent='#cloud-core-panel label,#cloud-relogin label{display:grid;gap:6px;margin:12px 0}#cloud-core-panel input,#cloud-relogin input{width:100%;min-width:0;box-sizing:border-box}#cloud-core-panel button,#cloud-relogin button{min-height:44px;margin:6px;white-space:normal}#cloud-core-panel pre{overflow-wrap:anywhere;white-space:pre-wrap}#cloud-relogin{width:min(30rem,calc(100% - 2rem));box-sizing:border-box;padding:clamp(1rem,5vw,2rem);background:linear-gradient(150deg,var(--panel-2),var(--bg));border:1px solid var(--accent);border-radius:12px;color:var(--text);box-shadow:0 1rem 3rem #000a}#cloud-relogin::backdrop{background:#000b}#cloud-relogin h2{margin:.5rem 0 1rem}#cloud-relogin button{margin:6px 4px 0 0}';document.head.appendChild(style);
panel.innerHTML='<h2>CLOUD CORE · V2.0</h2><details id="cloud-details"><summary>Sync Status · Részletek / Diagnosztika</summary><p>Fejlesztői teszt. Első kapcsolódáskor az eltérő mentéseket egyeztesd. Utána a kapcsolat automatikusan folytatódik. A megjelenés eszközönként marad.</p><p>Csak külön Supabase tesztprojekttel használd. Éles adatokat ne kapcsolj hozzá.</p></details><details id="cloud-technical"><summary>Technikai beállítások</summary><label><input id="cloud-test-project" type="checkbox"> Megerősítem, hogy külön tesztprojektet és tesztadatokat használok.</label><label>Supabase URL<input id="cloud-url" type="url" placeholder="https://project.supabase.co"></label><label>Publishable kulcs<input id="cloud-key" autocomplete="off"></label></details><label>Email<input id="cloud-email" type="email" autocomplete="username"></label><label>Jelszó<input id="cloud-password" type="password" autocomplete="current-password"></label><button id="cloud-login" type="button">Bejelentkezés</button><button id="cloud-stop" type="button">Kijelentkezés és automatikus kapcsolat törlése</button><p id="cloud-status" role="status">Kikapcsolva · csak helyi mentés</p><pre id="cloud-preview" style="white-space:pre-wrap"></pre><div id="cloud-choices" hidden><button id="cloud-local" type="button">Ez az eszköz legyen a forrás</button><button id="cloud-remote" type="button">A felhő legyen a forrás</button></div><details id="cloud-storage"><summary>Storage Health</summary><pre id="cloud-health"></pre><button id="cloud-recovery" type="button">Recovery mentések letöltése</button></details><dialog id="cloud-relogin" aria-labelledby="cloud-relogin-title"><form id="cloud-relogin-form"><p class="muted">SHADOW OS · CLOUD CORE</p><h2 id="cloud-relogin-title">Kapcsolódás a felhőhöz</h2><label>Mentett fiók<input id="cloud-relogin-email" type="email" autocomplete="username" required></label><label>Jelszó<input id="cloud-relogin-password" type="password" autocomplete="current-password" required></label><p id="cloud-relogin-status" role="status"></p><button type="submit">Bejelentkezés</button><button id="cloud-offline" type="button">Folytatás helyben</button></form></dialog>';
(document.getElementById('page-system')||document.querySelector('main')).appendChild(panel);
const el=id=>document.getElementById('cloud-'+id),status=s=>el('status').textContent=s;
document.body?.appendChild(el('relogin'));
const diagnostics=document.createElement('pre');diagnostics.id='cloud-diagnostics';el('details').appendChild(diagnostics);el('details').appendChild(el('preview'));
function diagnose(){
 try{const raw=localStorage.getItem(key),x=raw?validate(raw):null;
 diagnostics.textContent=JSON.stringify({build:'Cloud Core 2.0',syncStatus:preview?'conflict':busy?'syncing':!navigator.onLine?'offline':session?(lastError?'error':'connected'):accountId?'reauthentication_required':'local_only',storageError,session:session?'Bejelentkezve · automatikus szinkron':'Nincs session: jelentkezz be',online:navigator.onLine,helyiMentes:x?.lastSavedAt??null,kipipaltQuest:x?.quests.filter(q=>q.completed).length??0,revision:observedRevision,utolsoOlvasas:lastRead,utolsoFeltoltes:lastWrite,utolsoUIFrissites:lastApply,valasztasSzukseges:!!preview,hiba:lastError,serviceWorker:navigator.serviceWorker?.controller?.scriptURL??'Nincs vezérlő'},null,2);
 }catch(e){diagnostics.textContent='Helyi diagnózis: '+e.message;}
}
diagnose();status('Nincs bejelentkezés · csak helyi mentés. Bejelentkezés után a kapcsolat ezen az eszközön megmarad.');
// Preferences contain only public fields and email, never a password.
function rememberPreferences(){
 try{let url='';try{const u=new URL(el('url').value.trim());if(u.protocol==='https:'&&/^[-a-z0-9]+\.supabase\.co$/.test(u.hostname)&&!u.username&&!u.password&&!u.port)url=u.origin;}catch{}
 const publicKey=el('key').value.trim();
 localStorage.setItem(preferencesKey,JSON.stringify({url,key:/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)?publicKey:'',email:el('email').value.trim()}));}
 catch{status('A böngésző nem engedi a beállítások megjegyzését.');}
}
function restorePreferences(){
 try{const saved=JSON.parse(localStorage.getItem(preferencesKey)||'null');
 if(saved)for(const field of ['url','key','email'])if(typeof saved[field]==='string')el(field).value=saved[field];
 }catch{status('A mentett beállítások nem olvashatók; add meg újra.');}
}
restorePreferences();
for(const field of ['url','key','email'])el(field).oninput=rememberPreferences;
function showLogin() {
  const dialog = el('relogin');
  if (!config || !el('email').value || dialog.open) return;
  el('relogin-email').value = el('email').value;
  el('relogin-password').value = '';
  el('relogin-status').textContent = navigator.onLine ? '' : 'Offline módban a helyi mentés használható.';
  dialog.showModal?.();
}
function storageFailure(error) {
  storageError = error?.name === 'QuotaExceededError'
    ? 'Az IndexedDB megtelt. A helyi felhőtár írása sikertelen.'
    : 'A felhőtár nem érhető el: ' + error.message;
}
async function updateHealth() {
  try {
    const counts = await CloudStorage.health();
    const estimate = await navigator.storage?.estimate?.().catch(() => null);
    el('health').textContent = JSON.stringify({
      ...counts,
      localSaveBytes: new Blob([localStorage.getItem(key) || '']).size,
      originUsageBytes: estimate?.usage ?? null,
      originQuotaBytes: estimate?.quota ?? null,
      warning: storageError
    }, null, 2);
  } catch (error) {
    storageFailure(error);
    el('health').textContent = storageError;
  }
}
el('storage').ontoggle = () => { if (el('storage').open) updateHealth(); };
el('recovery').onclick = async () => {
  try {
    const recovery = await CloudStorage.exportRecovery();
    const url = URL.createObjectURL(new Blob([JSON.stringify(recovery)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shadow-cloud-recovery-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    storageFailure(error);
    status(storageError);
  }
};
function checkedConfig(url, key) {
  const u = new URL(url);
  if (u.protocol !== 'https:' || !/^[-a-z0-9]+\.supabase\.co$/.test(u.hostname) ||
      u.origin !== url || u.username || u.password || u.port) {
    throw Error('Érvényes Supabase HTTPS projekt URL szükséges');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw Error('Kizárólag nyilvános sb_publishable_ kulcs használható');
  return { url, key };
}
function normalizeSession(value, expiry) {
  if (!value?.user?.id || typeof value.access_token !== 'string' ||
      typeof value.refresh_token !== 'string' || !Number.isFinite(expiry)) {
    throw Error('Érvénytelen Cloud Core munkamenet');
  }
  return {
    access_token: value.access_token, refresh_token: value.refresh_token, expires_at: expiry,
    user: { id: value.user.id, email: value.user.email }
  };
}
async function persist() {
  if (!config || !accountId) return;
  try {
    await CloudStorage.write({ version: 2, config, session, accountId, baseline, email: el('email').value });
  } catch (error) {
    storageFailure(error);
  }
}
async function readConnection() {
  const saved = await CloudStorage.read();
  if (saved) return saved;
  const raw = localStorage.getItem(connectionKey);
  if (!raw) return null;
  const legacy = JSON.parse(raw);
  const config = checkedConfig(legacy.config.url, legacy.config.key);
  if (legacy.version !== 1) throw Error('Ismeretlen mentett kapcsolat');
  const session = normalizeSession(legacy.session, legacy.session.expires_at);
  if (legacy.baseline !== null) validate(legacy.baseline);
  const migrated = { version: 2, config, session, accountId: session.user.id, baseline: legacy.baseline, email: session.user.email };
  await CloudStorage.write(migrated);
  if (localStorage.getItem(connectionKey) === raw) localStorage.removeItem(connectionKey);
  return migrated;
}
async function stop() {
  if (busy || booting) return;
  busy = true;
  try {
    await CloudStorage.write({ version: 2, disabled: true });
    localStorage.removeItem(connectionKey);
    root.ShadowPush?.beforeSignOut?.();
    epoch++;
    session = null;
    accountId = null;
    baseline = null;
    preview = null;
    el('choices').hidden = true;
    el('relogin').close?.();
    status('Kikapcsolva · helyi adatok megőrizve');
  } catch (error) {
    storageFailure(error);
    status(storageError);
  } finally {
    busy = false;
    diagnose();
  }
}
async function request(path, body, token = true, retry = true) {
  const r = await fetch(config.url + path, {
    method: body === undefined ? 'GET' : 'POST',
    cache: 'no-store', credentials: 'omit',
    headers: { apikey: config.key, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + session.access_token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000)
  });
  if (r.ok) return r.status === 204 ? null : r.json();
  if (token && retry && r.status === 401) {
    await refresh(true);
    return request(path, body, token, false);
  }
  const details = await r.json?.().catch(() => null);
  const rejectedRefresh = path.includes('grant_type=refresh_token') &&
    (r.status === 401 || ['refresh_token_not_found', 'refresh_token_already_used', 'invalid_grant', 'session_not_found', 'session_expired'].includes(details?.error_code || details?.code || details?.error));
  if (rejectedRefresh || (token && r.status === 401)) {
    session = null;
    await persist();
    showLogin();
  }
  throw Error('Felhőkérés sikertelen (' + r.status + '). Helyi mentés megőrizve.');
}
async function refresh(force = false) {
  if (!session) throw Error('Új bejelentkezés szükséges');
  if (!force && Date.now() / 1000 <= session.expires_at - 60) return;
  const previous = session;
  const renew = async () => {
    const saved = await CloudStorage.read().catch(() => null);
    if (saved?.disabled || (saved?.accountId && (saved.accountId !== accountId || saved.config.url !== config.url))) {
      session = null;
      throw Error('A felhőkapcsolat másik lapon megváltozott. Nyisd meg újra az appot.');
    }
    if (saved?.session && saved.session.refresh_token !== previous.refresh_token &&
        saved.session.expires_at > Date.now() / 1000 + 60) {
      session = normalizeSession(saved.session, saved.session.expires_at);
      return;
    }
    const next = await request('/auth/v1/token?grant_type=refresh_token', { refresh_token: previous.refresh_token }, false);
    if (next.user?.id !== accountId) {
      session = null;
      await persist();
      showLogin();
      throw Error('Megváltozott felhasználó; új bejelentkezés szükséges.');
    }
    session = normalizeSession(next, Date.now() / 1000 + next.expires_in);
    await persist();
  };
  if (navigator.locks) return navigator.locks.request('shadow-cloud-session-v2', renew);
  return renew();
}
function summary(raw){if(raw===null)return 'Nincs mentés';const x=validate(raw);return JSON.stringify({nev:x.player.name,szint:x.player.level,streak:x.player.streak,quests:x.quests.length,kipipaltQuest:x.quests.filter(q=>q.completed).map(q=>({id:q.id,title:q.title})),napok:x.history.length,edzesek:x.training?.history.length||0,tervek:x.training?.templates.length||0,utolsoMentes:x.lastSavedAt},null,2);}
function choose(local,remote){el('details').open=true;preview={local,remote};el('preview').textContent='HELYI\n'+summary(local)+'\nFELHŐ · rev '+(remote?.revision||0)+'\n'+summary(remote?.payload??null);el('choices').hidden=false;el('remote').disabled=!remote;status('Adatforrás-választás szükséges. Nincs automatikus felülírás.');}
async function checkpoint(local, remote) {
  try { await CloudStorage.checkpoint(local, remote); }
  catch (error) {
    storageFailure(error);
    throw Error(storageError);
  }
  if (localStorage.getItem(key) !== local) throw Error('A helyi mentés megváltozott; új összehasonlítás szükséges.');
}
async function push(local,remote){validate(local);await checkpoint(local,remote);const revision=await request('/rest/v1/rpc/shadow_cloud_write',{expected_revision:remote?.revision||0,new_payload:local});baseline=local;observedRevision=revision;lastWrite=new Date().toISOString();await persist();status('Felhő visszaigazolta · rev '+revision);}
async function pull(local,remote){
 const next=migrateState(validate(remote.payload));
 if(JSON.parse(remote.payload).calendar===undefined&&state.calendar)next.calendar=structuredClone(state.calendar);
 if(next.training===undefined && state.training)next.training=structuredClone(state.training);
 if(next.training&&state.training)for(const k of ['cardio','recovery'])if(JSON.parse(remote.payload).training?.[k]===undefined)next.training[k]=structuredClone(state.training[k]||[]);
 await checkpoint(local,remote);
 if(document.activeElement && editingFields.has(document.activeElement))throw Error('Aktív szerkesztés: felhőbetöltés szünetel.');
 const previous=state;
 try{localStorage.setItem(key,JSON.stringify(next));state=next;render();}
 catch(e){state=previous;if(localStorage.getItem(key)!==local)localStorage.setItem(key,local);throw e;}
 baseline=remote.payload;lastApply=new Date().toISOString();await persist();status('Felhőmentés betöltve');
}
async function sync(source){
 if(booting||!session||busy||!navigator.onLine)return;
 busy=true;const generation=epoch;
 try{
  await refresh();const rows=await request('/rest/v1/shadow_cloud_saves?select=revision,payload');
  if(generation!==epoch)return;
  if(rows.length>1)throw Error('Unexpected cloud rows');
  const remote=rows[0]||null,local=localStorage.getItem(key);validate(local);if(remote)validate(remote.payload);
  observedRevision=remote?.revision??0;lastRead=new Date().toISOString();lastError=null;
  if(source){
   if(!preview||preview.local!==local||JSON.stringify(preview.remote)!==JSON.stringify(remote)){choose(local,remote);return;}
   if(!confirm(source==='local'?'A helyi mentés váltsa fel a felhőpéldányt? Mindkettőről helyi biztonsági másolat készül.':'A felhőmentés váltsa fel az eszköz mentését? Mindkettőről helyi biztonsági másolat készül.'))return;
   if(source==='local')await push(local,remote);else if(remote)await pull(local,remote);
   el('choices').hidden=true;preview=null;
   return;
  }
  if(preview){choose(local,remote);return;}
  const action=decide(baseline,local,remote?.payload??null);
  if(action==='choose')choose(local,remote);
  if(action==='equal'){if(baseline!==local){baseline=local;await persist();}status('Azonos helyi és felhőmentés');}
  if(action==='push')await push(local,remote);
  if(action==='pull')await pull(local,remote);
 }catch(e){lastError=e.message;status(e.message+' Új összehasonlítás szükséges.');}finally{busy=false;diagnose();if(el('storage').open)updateHealth();root.ShadowPush?.refresh?.();}
}
async function login(password, rememberedAccount = false) {
  if (busy || booting) return;
  if (!password || !navigator.onLine) {
    const message = password ? 'Offline módban nem lehet bejelentkezni.' : 'Add meg a jelszót.';
    status(message);
    el('relogin-status').textContent = message;
    return;
  }
  if (!rememberedAccount && !el('test-project').checked) {
    status('Külön tesztprojekt megerősítése szükséges.');
    return;
  }
  busy = true;
  const previous = { config, session, accountId };
  try {
    const target = rememberedAccount ? config : checkedConfig(el('url').value.trim().replace(/\/$/, ''), el('key').value.trim());
    config = target;
    const value = await request('/auth/v1/token?grant_type=password', { email: el('email').value.trim(), password }, false);
    const next = normalizeSession(value, Date.now() / 1000 + value.expires_in);
    if (previous.config?.url !== target.url || previous.accountId !== next.user.id) {
      config = previous.config;
      root.ShadowPush?.beforeSignOut?.();
      config = target;
      baseline = null;
    }
    epoch++;
    session = next;
    accountId = next.user.id;
    preview = null;
    el('choices').hidden = true;
    rememberPreferences();
    await persist();
    el('relogin').close?.();
    status('Bejelentkezve · automatikus összehasonlítás');
  } catch (error) {
    ({ config, session, accountId } = previous);
    status(error.message);
    el('relogin-status').textContent = error.message;
  } finally {
    busy = false;
    diagnose();
  }
  await sync();
}
el('login').onclick = () => {
  const password = el('password').value;
  el('password').value = '';
  return login(password);
};
el('relogin-form').onsubmit = event => {
  event.preventDefault();
  if (busy) return;
  const password = el('relogin-password').value;
  el('relogin-password').value = '';
  el('email').value = el('relogin-email').value;
  return login(password, true);
};
el('offline').onclick = () => el('relogin').close?.();
el('relogin').onclose = () => { el('relogin-password').value = ''; };
el('stop').onclick = stop;
el('local').onclick = () => sync('local');
el('remote').onclick = () => sync('remote');
document.addEventListener('input',event=>{if(event.target?.matches('input,textarea,select,[contenteditable="true"]')&&!panel.contains(event.target)&&!el('relogin').contains?.(event.target))editingFields.add(event.target);},true);
document.addEventListener('focusout',event=>{const wasEditing=editingFields.delete(event.target);if(wasEditing)return Promise.resolve().then(()=>sync());},true);
setInterval(()=>{diagnose();return sync();},5000);window.addEventListener('focus',()=>sync());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});window.addEventListener('online',()=>sync());window.addEventListener('offline',()=>status('Offline · helyi mentés megőrizve, szinkronizálás később'));

root.CloudNotifications={
 identity(){return session&&config?{userId:session.user.id,projectUrl:config.url}:null;},
 async call(body){if(!session||!config)throw Error('Sign in to Cloud Core first.');const generation=epoch,deadline=Date.now()+30000;while(busy){if(generation!==epoch||!session)throw Error('Cloud account changed. Try again.');if(Date.now()>deadline)throw Error('Cloud sync is taking longer than expected. Try again shortly.');await new Promise(resolve=>setTimeout(resolve,100));}if(generation!==epoch||!session)throw Error('Cloud account changed. Try again.');busy=true;try{await refresh();const r=await fetch(config.url+'/functions/v1/shadow-push',{method:'POST',credentials:'omit',cache:'no-store',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(generation!==epoch||!session)throw Error('Cloud account changed. Try again.');const value=await r.json().catch(()=>({}));if(!r.ok)throw Error(value.error||'Push backend unavailable ('+r.status+').');return value;}finally{busy=false;}},
 disableDevice(deviceId){if(session&&config)return fetch(config.url+'/functions/v1/shadow-push',{method:'POST',credentials:'omit',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'disable',deviceId}),signal:AbortSignal.timeout(15000)}).catch(()=>{});}
};

root.cloudReady = (async () => {
  try {
    try { await CloudStorage.archiveLegacy(localStorage); }
    catch (error) { storageFailure(error); }
    const saved = await readConnection();
    if (saved?.disabled) return;
    if (!saved) {
      if (el('url').value && el('key').value && el('email').value) {
        config = checkedConfig(el('url').value, el('key').value);
        showLogin();
      }
      return;
    }
    config = checkedConfig(saved.config.url, saved.config.key);
    accountId = saved.accountId;
    if (saved.baseline !== null) validate(saved.baseline);
    baseline = saved.baseline;
    session = saved.session ? normalizeSession(saved.session, saved.session.expires_at) : null;
    el('url').value = config.url;
    el('key').value = config.key;
    el('email').value = saved.email || session?.user.email || el('email').value;
    el('test-project').checked = true;
    if (session && session.user.id !== accountId) throw Error('A mentett fiók nem egyezik a munkamenettel');
    if (session) status('Mentett kapcsolat · automatikus összehasonlítás');
    else showLogin();
  } catch (error) {
    session = null;
    storageFailure(error);
    status(storageError);
    try { config = checkedConfig(el('url').value, el('key').value); showLogin(); }
    catch { /* Enrollment can be entered in technical settings. */ }
  } finally {
    booting = false;
    diagnose();
  }
  await sync();
})();
})(globalThis);
