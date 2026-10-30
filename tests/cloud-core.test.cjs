const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/core/cloud-core.js','utf8');
const raw=n=>JSON.stringify({player:{name:'Test',level:n,streak:n},quests:[],history:[],settings:{},stats:{},skills:{},achievements:[]});
async function run(){
const elements=new Map(),store=new Map([['akos-system-v0.1.0',raw(1)]]);let remote=null,writes=0,tick,quota=false,fail=false,reloads=0,authFail=false;const events={};
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,appendChild(){}});return elements.get(id);}
const c={structuredClone,console,URL,Date,JSON,Error,AbortSignal,crypto:require('crypto').webcrypto,TrainingData:{validate:x=>x},state:JSON.parse(raw(1)),migrateState:x=>x,render(){},confirm:()=>true,location:{reload(){reloads++;}},navigator:{onLine:true},localStorage:{removeItem:k=>store.delete(k),getItem:k=>store.get(k)??null,setItem(k,v){if(quota&&k.startsWith('shadow-cloud'))throw Error('Quota');store.set(k,v);}},document:{addEventListener(){},head:{appendChild(){}},activeElement:null,createElement:()=>({textContent:'',appendChild(){},set id(v){elements.set(v,this);}}),getElementById:el,querySelector:()=>el('main')},window:{addEventListener(name,fn){events[name]=fn;}},setInterval(fn){tick=fn;},fetch:async(url,o)=>{
 if(fail)throw Error('Offline');if(authFail)return {ok:false,status:401};let value;
 if(url.includes('/token'))value={access_token:'user-token',refresh_token:'refresh',expires_in:3600,user:{id:'test-user'}};
 else if(url.includes('/rpc/')){const b=JSON.parse(o.body);if((remote?.revision||0)!==b.expected_revision)return {ok:false,status:409};remote={revision:(remote?.revision||0)+1,payload:b.new_payload};writes++;value=remote.revision;}
 else value=remote?[{...remote}]:[];
 return {ok:true,status:200,json:async()=>value};
}};
vm.createContext(c);vm.runInContext(source,c);
assert.equal(c.CloudLogic.decide(null,'x','x'),'equal');assert.equal(c.CloudLogic.decide('a','b','c'),'choose');assert.throws(()=>c.CloudLogic.validate('{}'));
el('cloud-url').value='https://test.supabase.co';el('cloud-key').value='sb_publishable_test';el('cloud-email').value='test@example.test';el('cloud-password').value='fake';
await el('cloud-login').onclick();assert.equal(writes,0);assert.equal(el('cloud-status').textContent,'Külön tesztprojekt megerősítése szükséges.');el('cloud-test-project').checked=true;await el('cloud-login').onclick();assert.equal(writes,0);assert.equal(el('cloud-choices').hidden,false);
await el('cloud-local').onclick();assert.equal(writes,1);assert.equal(remote.payload,raw(1));assert.equal(el('cloud-password').value,'');
store.set('akos-system-v0.1.0',raw(2));await tick();assert.equal(remote.payload,raw(2));
remote={revision:3,payload:raw(3)};await tick();assert.equal(store.get('akos-system-v0.1.0'),raw(3));assert.equal(c.state.player.level,3);assert.equal(reloads,0);
store.set('akos-system-v0.1.0',raw(4));remote={revision:4,payload:raw(5)};const before=writes;await tick();assert.equal(writes,before);assert.equal(store.get('akos-system-v0.1.0'),raw(4));
// Changed data invalidates the preview, without writing.
store.set('akos-system-v0.1.0',raw(6));await el('cloud-local').onclick();assert.equal(writes,before);
quota=true;await el('cloud-local').onclick();assert.equal(writes,before);quota=false;
fail=true;await tick();assert.equal(store.get('akos-system-v0.1.0'),raw(6));fail=false;
el('cloud-stop').onclick();await tick();assert.equal(writes,before);
// A page restart must expose the missing in-memory session without any request/write.
assert.match(el('cloud-diagnostics').textContent,/Nincs session/);
// Reconnect explicitly; two completed Quests survive upload and a remote UI apply.
el('cloud-password').value='fake';await el('cloud-login').onclick();await el('cloud-local').onclick();
const quests=JSON.parse(raw(7));quests.quests=[{id:'phone-1',title:'One',completed:true},{id:'phone-2',title:'Two',completed:true}];
store.set('akos-system-v0.1.0',JSON.stringify(quests));await tick();assert.equal(JSON.parse(remote.payload).quests.filter(q=>q.completed).length,2);
assert.equal(JSON.parse(el('cloud-diagnostics').textContent).revision,remote.revision);
// Undo is a normal saved state change and is uploaded by the same sync path.
quests.quests[0].completed=false;store.set('akos-system-v0.1.0',JSON.stringify(quests));await tick();assert.equal(JSON.parse(remote.payload).quests[0].completed,false);assert.equal(JSON.parse(remote.payload).quests[1].completed,true);
// Remote legacy save preserves Training on disk as well as in memory, including reload.
c.state.training={history:[{id:'keep'}],templates:[]};remote={revision:remote.revision+1,payload:raw(8)};await events.focus();
assert.equal(JSON.parse(store.get('akos-system-v0.1.0')).training.history[0].id,'keep');
assert.equal(c.state.training.history[0].id,'keep');
// Reload reuses remembered session and baseline without choosing a source.
await tick(); // Upload the preserved Training before simulating a fresh page.
const remembered=JSON.parse(store.get('shadow-cloud-v1:connection'));assert.equal(remembered.session.user.id,'test-user');
remote={revision:remote.revision+1,payload:raw(9)};
vm.runInContext(source,c);await c.cloudReady;
assert.equal(c.state.player.level,9);assert.equal(el('cloud-choices').hidden,true);
const offlineEdit=JSON.parse(store.get('akos-system-v0.1.0'));offlineEdit.player.level=10;store.set('akos-system-v0.1.0',JSON.stringify(offlineEdit));
vm.runInContext(source,c);await c.cloudReady;assert.equal(JSON.parse(remote.payload).player.level,10);
// Expired remembered token refreshes automatically on startup.
const expired=JSON.parse(store.get('shadow-cloud-v1:connection'));expired.session.expires_at=0;store.set('shadow-cloud-v1:connection',JSON.stringify(expired));vm.runInContext(source,c);await c.cloudReady;assert.ok(JSON.parse(store.get('shadow-cloud-v1:connection')).session.expires_at>Date.now()/1000);
// Both sides changed while closed: neither side is silently overwritten.
const localConflict=JSON.parse(store.get('akos-system-v0.1.0'));localConflict.player.level=11;store.set('akos-system-v0.1.0',JSON.stringify(localConflict));remote={revision:remote.revision+1,payload:raw(12)};
const countBeforeConflict=writes;vm.runInContext(source,c);await c.cloudReady;assert.equal(writes,countBeforeConflict);assert.equal(c.state.player.level,9);assert.equal(el('cloud-choices').hidden,false);assert.equal(JSON.parse(store.get('akos-system-v0.1.0')).player.level,11);
// Auth rejection disconnects without replacing either save.
const preserved=store.get('akos-system-v0.1.0'),cloudPreserved=remote.payload;authFail=true;await tick();
assert.equal(store.get('akos-system-v0.1.0'),preserved);assert.equal(remote.payload,cloudPreserved);assert.match(el('cloud-diagnostics').textContent,/Nincs session/);authFail=false;

assert.ok([...store.keys()].some(k=>k.startsWith('shadow-cloud-v1:backup:')));
console.log('Automated simulation completed (including two Quests, Training persistence, focus resume, revision diagnostics and auth rejection): explicit enrollment, upload, local change, remote apply, memory refresh, conflict, stale preview, quota abort, offline preservation, stop, credential clearing, validation. Supabase/RLS and PC-phone tests NOT RUN.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
