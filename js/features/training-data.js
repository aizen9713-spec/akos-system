const TrainingData = (() => {
 const clone=v=>structuredClone(v), id=()=>crypto.randomUUID(), blankSet=()=>({weight:0,reps:8,done:false});
 function defaults(){return {version:1,templates:['Tuesday','Thursday','Saturday'].map(name=>({id:id(),name,exercises:[{id:id(),name:'Exercise 1',sets:[blankSet(),blankSet(),blankSet()]}]})),draft:null,history:[]};}
 function validate(v){
  const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=150;
  const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
  const sets=xs=>Array.isArray(xs)&&xs.length>0&&xs.length<=100&&xs.every(s=>s&&Number.isFinite(s.weight)&&s.weight>=0&&s.weight<=10000&&Number.isInteger(s.reps)&&s.reps>=0&&s.reps<=10000&&typeof s.done==='boolean');
  const exercises=xs=>Array.isArray(xs)&&xs.length>0&&xs.length<=100&&new Set(xs.map(x=>x?.id)).size===xs.length&&xs.every(x=>x&&text(x.id)&&text(x.name)&&sets(x.sets));
  const session=(s,completed)=>s&&text(s.id)&&text(s.templateId)&&text(s.name)&&date(s.date)&&exercises(s.exercises)&&typeof s.startedAt==='string'&&Number.isFinite(Date.parse(s.startedAt))&&(!completed||(typeof s.completedAt==='string'&&Number.isFinite(Date.parse(s.completedAt))&&s.exercises.some(e=>e.sets.some(x=>x.done&&x.reps>0))));
  if(!v||v.version!==1||!Array.isArray(v.templates)||v.templates.length>50||!v.templates.every(t=>t&&text(t.id)&&text(t.name)&&exercises(t.exercises))||new Set(v.templates.map(t=>t.id)).size!==v.templates.length||!Array.isArray(v.history)||v.history.length>10000||!v.history.every(s=>session(s,true))||new Set(v.history.map(s=>s.id)).size!==v.history.length||(v.draft!==null&&!session(v.draft,false))||v.history.some(s=>s.id===v.draft?.id))throw new Error('Invalid Training V1 data. Nothing was imported.');
  return clone(v);
 }
 // A creation request has one stable ID, even when submitted repeatedly.
 function createPlan(d,requestId,name,sourceId){
  if(d.templates.some(t=>t.id===requestId))return;
  const source=d.templates.find(t=>t.id===sourceId);
  const p=source?clone(source):{exercises:[{id:id(),name:'Exercise 1',sets:[blankSet()]}]};
  p.id=requestId;p.name=name;p.exercises.forEach(e=>e.id=id());d.templates.push(p);
 }
 function deletePlan(d,templateId){
  // History and drafts are independent snapshots; never cascade deletion.
  d.templates=d.templates.filter(t=>t.id!==templateId);
 }
 function start(d,templateId,date){
  if(d.draft)throw new Error('Resume or discard the current draft first.');
  const t=d.templates.find(t=>t.id===templateId);if(!t)throw new Error('Template not found.');
  const exercises=clone(t.exercises).map(e=>{const previous=[...d.history].sort((a,b)=>b.date.localeCompare(a.date)||b.completedAt.localeCompare(a.completedAt)).flatMap(s=>s.exercises).find(x=>x.id===e.id&&x.sets.some(s=>s.done));return {...e,sets:(previous?previous.sets.filter(s=>s.done):e.sets).map(s=>({...s,done:false}))};});
  d.draft={id:id(),templateId,name:t.name,date,startedAt:new Date().toISOString(),exercises};
 }
 function finish(d){if(!d.draft||!d.draft.exercises.some(e=>e.sets.some(s=>s.done&&s.reps>0)))throw new Error('Check at least one completed set with reps above zero.');d.history.unshift({...clone(d.draft),completedAt:new Date().toISOString()});d.draft=null;}
 function merge(current,incoming){
  const d=validate(current),s=validate(incoming);
  for(const h of s.history){const old=d.history.find(x=>x.id===h.id);if(old&&JSON.stringify(old)!==JSON.stringify(h))throw new Error('Conflicting history ID. Import cancelled.');if(!old)d.history.push(clone(h));}
  if(s.draft&&d.history.some(h=>h.id===s.draft.id))s.draft=null;
  if(d.draft&&d.history.some(h=>h.id===d.draft.id))throw new Error('Backup conflicts with the current draft.');
  if(d.draft&&s.draft&&JSON.stringify(d.draft)!==JSON.stringify(s.draft))throw new Error('Two different drafts. Finish or discard the current draft first.');
  d.draft ||= s.draft;
  for(const t of s.templates){const old=d.templates.find(x=>x.id===t.id);if(!old)d.templates.push(clone(t));else if(JSON.stringify(old)!==JSON.stringify(t)&&!d.templates.some(x=>x.name===(t.name+' (imported)').slice(0,150)&&JSON.stringify(x.exercises)===JSON.stringify(t.exercises)))d.templates.push({...clone(t),id:id(),name:(t.name+' (imported)').slice(0,150)});}
  return validate(d);
 }
 const volume=s=>s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).reduce((m,x)=>m+x.weight*x.reps,0),0);
 return {defaults,validate,createPlan,deletePlan,start,finish,merge,volume,blankSet,id};
})();
