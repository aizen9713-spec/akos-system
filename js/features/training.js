const Training = (() => {
 const root=document.getElementById('training-workspace'), historyRoot=document.getElementById('training-history');
 let selected='',editing=false;
 const esc=s=>escapeHtml(String(s));
 function data(){return state.training;}
 function status(s){document.getElementById('training-status').textContent=s;}
 function update(action,redraw=true){
  try{
   const stored=localStorage.getItem(STORAGE_KEY);
   if(stored&&JSON.parse(stored).lastSavedAt!==state.lastSavedAt)throw new Error('A newer save exists in another tab. Reload before editing.');
   const next=structuredClone(state);action(next.training);next.training=TrainingData.validate(next.training);next.lastSavedAt=new Date().toISOString();
   localStorage.setItem(STORAGE_KEY,JSON.stringify(next));state=next;if(redraw)render();status('Saved on this device · No automatic XP');return true;
  }catch(e){status('NOT SAVED: '+e.message);return false;}
 }
 function exercise(e,i,plan){return `<section class="training-exercise"><label>Exercise<input aria-label="Exercise ${i+1}" data-field="name" data-exercise="${i}" maxlength="150" value="${esc(e.name)}"></label><button type="button" data-action="remove-exercise" data-exercise="${i}">Remove exercise</button><div class="training-set-head"><span>Set</span><span>Weight (kg)</span><span>Reps</span><span>${plan?'':'Done'}</span></div>${e.sets.map((s,j)=>`<div class="training-set"><span>${j+1}</span><input aria-label="Weight exercise ${i+1} set ${j+1}" data-field="weight" data-exercise="${i}" data-set="${j}" type="number" min="0" max="10000" step="0.5" value="${s.weight}"><input aria-label="Reps exercise ${i+1} set ${j+1}" data-field="reps" data-exercise="${i}" data-set="${j}" type="number" min="0" max="10000" step="1" value="${s.reps}">${plan?'<span></span>':`<input aria-label="Done exercise ${i+1} set ${j+1}" data-field="done" data-exercise="${i}" data-set="${j}" type="checkbox" ${s.done?'checked':''}>`}<button aria-label="Remove exercise ${i+1} set ${j+1}" type="button" data-action="remove-set" data-exercise="${i}" data-set="${j}">×</button></div>`).join('')}<button type="button" data-action="add-set" data-exercise="${i}">+ Set</button></section>`;}
 function render(){
  if(!state.training)state.training=TrainingData.defaults();
  try { TrainingData.validate(state.training); } catch(e) { root.textContent='Training data could not be opened. Export the full System save before attempting recovery.'; status(e.message); return; }
  const d=data();if(!d.templates.some(t=>t.id===selected))selected=d.templates[0].id;
  const draft=d.draft,t=d.templates.find(t=>t.id===selected),target=draft||(editing?t:null);
  root.innerHTML=`<div class="training-actions"><button type="button" data-action="history">History & progress</button><button type="button" data-action="export">JSON backup</button><label class="training-import">Import Training JSON<input id="training-import" type="file" accept="application/json,.json"></label></div><p class="muted">Build 1 · kg · Draft changes save automatically. Completed history stays unchanged. Cardio / Recovery: Build 2.</p>${draft?`<h3>IN PROGRESS · ${esc(draft.name)}</h3><label>Workout date<input type="date" data-field="date" value="${draft.date}"></label>`:`<label>Workout plan<select id="training-template">${d.templates.map(t=>`<option value="${esc(t.id)}" ${t.id===selected?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><div class="training-actions"><button type="button" data-action="start">Start workout</button><button type="button" data-action="edit">${editing?'Close plan editor':'Edit plan'}</button><button type="button" data-action="new-plan">+ Personal plan</button></div>`}${target?`${editing&&!draft?`<label>Plan name<input data-field="plan-name" maxlength="150" value="${esc(target.name)}"></label><p class="muted">Changes affect future workouts only.</p>`:''}${target.exercises.map((e,i)=>exercise(e,i,!draft)).join('')}<button type="button" data-action="add-exercise">+ Exercise</button>`:`<p>${t.exercises.map(e=>esc(e.name)+' · '+e.sets.length+' sets').join('<br>')}</p><p class="muted">Starter exercises are placeholders. Edit your plan before starting. Last completed sets are prefilled by exercise identity.</p>`}${draft?'<div class="training-actions"><button type="button" data-action="finish">Finish & save to history</button><button type="button" data-action="pause">Pause / back to Training</button><button type="button" data-action="discard">Discard draft</button></div>':''}`;
  renderHistory(d);
 }
 function renderHistory(d){
  const sessions=[...d.history].sort((a,b)=>b.date.localeCompare(a.date)||b.completedAt.localeCompare(a.completedAt));
  const earlier=(p,s)=>p.date<s.date||(p.date===s.date&&p.completedAt<s.completedAt);
  historyRoot.innerHTML=`<p>${sessions.length} completed workouts · ${sessions.reduce((n,s)=>n+TrainingData.volume(s),0).toLocaleString()} kg total volume</p><p class="muted">Volume counts checked sets only (kg × reps). Compare the same exercise with the same technique.</p>`+(sessions.length?sessions.map(s=>{
   const prev=sessions.find(p=>p.templateId===s.templateId&&earlier(p,s)),delta=prev?TrainingData.volume(s)-TrainingData.volume(prev):null;
   return `<details class="training-exercise"><summary>${esc(s.date)} · ${esc(s.name)} · ${TrainingData.volume(s).toLocaleString()} kg</summary><p>Saved ${esc(new Date(s.completedAt).toLocaleString())}</p>${delta===null?'':`<p>Volume vs previous same plan: ${delta>=0?'+':''}${delta.toLocaleString()} kg</p>`}${s.exercises.map(e=>{
    const old=sessions.filter(p=>earlier(p,s)).flatMap(p=>p.exercises).find(x=>x.id===e.id&&x.sets.some(z=>z.done)),peak=x=>Math.max(0,...x.sets.filter(z=>z.done).map(z=>z.weight));
    return `<h4>${esc(e.name)}</h4><p>${e.sets.map((x,i)=>`${i+1}. ${x.weight} kg × ${x.reps} ${x.done?'✓':'(not completed)'}`).join('<br>')}</p>${old?`<p class="muted">Top weight: ${peak(e)} kg · previous ${peak(old)} kg</p>`:''}`;
   }).join('')}</details>`;
  }).join(''):'<p>No completed workouts yet. Start and finish a workout to see history.</p>');
 }
 root.addEventListener('change',async event=>{
  if(event.target.id==='training-template'){selected=event.target.value;render();}
  if(event.target.id==='training-import'){
   const file=event.target.files[0];if(!file)return;
   try{if(file.size>10000000)throw new Error('Backup too large.');const b=JSON.parse(await file.text());if(b.app!=='SHADOW OS TRAINING'||b.version!==1)throw new Error('Select a Training V1 JSON backup.');const incoming=TrainingData.validate(b.training);if(confirm('Merge Training backup? Current workouts and plans are preserved. Player XP is unchanged.'))update(d=>Object.assign(d,TrainingData.merge(d,incoming)));}catch(e){status('IMPORT FAILED: '+e.message);}event.target.value='';
  }
 });
 root.addEventListener('input',event=>{
  const el=event.target,field=el.dataset.field;if(!field)return;
  if(!el.checkValidity()||(el.type==='number'&&el.value==='')){el.setAttribute('aria-invalid','true');status('NOT SAVED: enter a valid value.');return;}
  const ok=update(d=>{const t=d.draft||d.templates.find(t=>t.id===selected);if(field==='date')t.date=el.value;else if(field==='plan-name')t.name=el.value;else if(field==='name')t.exercises[Number(el.dataset.exercise)].name=el.value;else t.exercises[Number(el.dataset.exercise)].sets[Number(el.dataset.set)][field]=field==='done'?el.checked:Number(el.value);},false);
  el.setAttribute('aria-invalid',String(!ok));
 });
 root.addEventListener('click',event=>{
  const b=event.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
  if(action==='history'){showPage('training-history');return;}
  if(action==='pause'){showPage('training');return;}
  if(root.querySelector('[aria-invalid="true"], input:invalid')){status('Correct the invalid field before continuing.');return;}
  if(action==='edit'){editing=!editing;render();return;}
  if(action==='export'){const blob=new Blob([JSON.stringify({app:'SHADOW OS TRAINING',version:1,exportedAt:new Date().toISOString(),training:data()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shadow-training-'+getDateKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);let fallback=document.getElementById('training-backup-copy');if(!fallback){fallback=document.createElement('textarea');fallback.id='training-backup-copy';fallback.readOnly=true;fallback.setAttribute('aria-label','Training JSON backup copy');root.appendChild(fallback);}blob.text().then(text=>{fallback.value=text;fallback.focus();fallback.select();status('Download requested. If the browser blocks it, copy this JSON into a .json file.');});return;}
  if(action==='discard'&&!confirm('Discard the current draft? Completed history is kept.'))return;
  if(action==='finish'&&!confirm('Finish this workout? The dated history snapshot cannot be edited. Unchecked sets do not count toward progress.'))return;
  update(d=>{
   const t=d.draft||d.templates.find(t=>t.id===selected),i=Number(b.dataset.exercise),j=Number(b.dataset.set);
   if(action==='start'){TrainingData.start(d,selected,getDateKey());editing=false;}
   if(action==='finish')TrainingData.finish(d);
   if(action==='discard')d.draft=null;
   if(action==='new-plan'){const p=structuredClone(d.templates.find(t=>t.id===selected));p.id=TrainingData.id();p.name='Personal plan';p.exercises.forEach(e=>e.id=TrainingData.id());d.templates.push(p);selected=p.id;editing=true;}
   if(action==='add-exercise')t.exercises.push({id:TrainingData.id(),name:'New exercise',sets:[TrainingData.blankSet()]});
   if(action==='remove-exercise'){if(t.exercises.length===1)throw new Error('Keep at least one exercise.');t.exercises.splice(i,1);}
   if(action==='add-set')t.exercises[i].sets.push(TrainingData.blankSet());
   if(action==='remove-set'){if(t.exercises[i].sets.length===1)throw new Error('Keep at least one set.');t.exercises[i].sets.splice(j,1);}
  });
 });
 return {render};
})();
