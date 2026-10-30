const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/core/cloud-core.js','utf8');
const raw=n=>JSON.stringify({player:{name:'Test',level:n,streak:n},quests:[],history:[],settings:{},stats:{},skills:{},achievements:[]});
async function run(){
const elements=new Map(),store=new Map([['akos-system-v0.1.0',raw(1)]]);let remote=null,writes=0,tick,quota=false,fail=false,reloads=0;
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,appendChild(){}});return elements.get(id);}
const c={console,URL,Date,JSON,Error,AbortSignal,crypto:require('crypto').webcrypto,TrainingData:{validate:x=>x},state:JSON.parse(raw(1)),migrateState:x=>x,render(){},confirm:()=>true,location:{reload(){reloads++;}},navigator:{onLine:true},localStorage:{getItem:k=>store.get(k)??null,setItem(k,v){if(quota&&k.startsWith('shadow-cloud'))throw Error('Quota');store.set(k,v);}},document:{head:{appendChild(){}},activeElement:null,createElement:()=>el('panel'),getElementById:el,querySelector:()=>el('main')},window:{addEventListener(){}},setInterval(fn){tick=fn;},fetch:async(url,o)=>{
 if(fail)throw Error('Offline');let value;
 if(url.includes('/token'))value={access_token:'user-token',refresh_token:'refresh',expires_in:3600};
 else if(url.includes('/rpc/')){const b=JSON.parse(o.body);if((remote?.revision||0)!==b.expected_revision)return {ok:false,status:409};remote={revision:(remote?.revision||0)+1,payload:b.new_payload};writes++;value=remote.revision;}
 else value=remote?[{...remote}]:[];
 return {ok:true,status:200,json:async()=>value};
}};
vm.createContext(c);vm.runInContext(source,c);
assert.equal(c.CloudLogic.decide(null,'x','x'),'choose');assert.equal(c.CloudLogic.decide('a','b','c'),'choose');assert.throws(()=>c.CloudLogic.validate('{}'));
el('cloud-url').value='https://test.supabase.co';el('cloud-key').value='sb_publishable_test';el('cloud-email').value='test@example.test';el('cloud-password').value='fake';
await el('cloud-login').onclick();assert.equal(writes,0);assert.equal(el('cloud-choices').hidden,false);
await el('cloud-local').onclick();assert.equal(writes,1);assert.equal(remote.payload,raw(1));assert.equal(el('cloud-password').value,'');
store.set('akos-system-v0.1.0',raw(2));await tick();assert.equal(remote.payload,raw(2));
remote={revision:3,payload:raw(3)};await tick();assert.equal(store.get('akos-system-v0.1.0'),raw(3));assert.equal(c.state.player.level,3);assert.equal(reloads,0);
store.set('akos-system-v0.1.0',raw(4));remote={revision:4,payload:raw(5)};const before=writes;await tick();assert.equal(writes,before);assert.equal(store.get('akos-system-v0.1.0'),raw(4));
// Changed data invalidates the preview, without writing.
store.set('akos-system-v0.1.0',raw(6));await el('cloud-local').onclick();assert.equal(writes,before);
quota=true;await el('cloud-local').onclick();assert.equal(writes,before);quota=false;
fail=true;await tick();assert.equal(store.get('akos-system-v0.1.0'),raw(6));fail=false;
el('cloud-stop').onclick();await tick();assert.equal(writes,before);
assert.ok([...store.keys()].some(k=>k.startsWith('shadow-cloud-v1:backup:')));
console.log('12 automated checks completed: explicit enrollment, upload, local change, remote apply, memory refresh, conflict, stale preview, quota abort, offline preservation, stop, credential clearing, validation. Supabase/RLS and PC-phone tests NOT RUN.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
