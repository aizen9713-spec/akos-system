const QuestV2UI = (() => {
  const el=id=>document.getElementById(id);
  function status(message){el('questV2Status').textContent=message;}
  function commit(next) {
    const stored=localStorage.getItem(STORAGE_KEY);
    if(stored && JSON.parse(stored).lastSavedAt!==state.lastSavedAt) throw Error('A newer local save exists. Reload before making changes.');
    const previous=state;
    try {state=next;saveState();} catch(e){state=previous;throw e;}
    render();
  }
  function run(fn){try{fn();}catch(e){status(e.message);}}
  function edit(id){
    const q=state.quests.find(q=>q.id===id);if(!q||q.kind!=='custom'||q.completed)return;
    const baseline=JSON.stringify(state), dialog=document.createElement('dialog');dialog.className='quest-dialog';
    dialog.innerHTML='<form><h3>Edit custom quest</h3><label>Title<input name="title" maxlength="80" required></label><label>XP<input name="xp" type="number" min="1" max="100" step="1" required></label><button type="submit">SAVE</button><button type="button">CANCEL</button></form>';
    dialog.querySelector('[name=title]').value=q.title;dialog.querySelector('[name=xp]').value=q.xp;
    dialog.querySelector('[type=button]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
    dialog.querySelector('form').onsubmit=e=>{e.preventDefault();run(()=>{if(JSON.stringify(state)!==baseline)throw Error('Save changed. Reopen the editor.');const d=new FormData(e.target),v=QuestV2.definition({...q,title:d.get('title'),xp:Number(d.get('xp')),source:'custom'});if(state.quests.some(x=>x.id!==id&&x.title.trim().toLowerCase()===v.title.toLowerCase()))throw Error('Duplicate title.');const next=structuredClone(state);Object.assign(next.quests.find(x=>x.id===id),{title:v.title,xp:v.xp});commit(next);dialog.close();});};
    document.body.append(dialog);dialog.showModal();
  }
  function renderInbox(){
    const root=el('questInbox');root.replaceChildren();
    const rows=state.questInbox||[];if(!rows.length){root.textContent='No pending suggestions. Import an AI quest file to review it here.';return;}
    for(const q of rows){const row=document.createElement('div');row.className='quest-row';const title=document.createElement('span');title.textContent=q.title+' · '+q.xp+' XP';row.append(title);
      for(const [label,action] of [['APPROVE',()=>commit(QuestV2.approve(state,q.id))],['DISMISS',()=>{const next=structuredClone(state);next.questInbox=next.questInbox.filter(x=>x.id!==q.id);commit(next);}]]){const b=document.createElement('button');b.type='button';b.className='small-btn';b.textContent=label;b.onclick=()=>run(action);row.append(b);}root.append(row);}
  }
  el('questExport').onclick=()=>run(()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(QuestV2.exportFile(state),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='shadow-quests.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  el('questImport').onclick=()=>el('questFile').click();
  el('questFile').onchange=async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      if(file.size>262144)throw Error('File too large (maximum 256 KB).');
      const data=JSON.parse(await file.text()),plan=QuestV2.preview(state,data),baseline=JSON.stringify(state),dialog=document.createElement('dialog');dialog.className='quest-dialog';
      const h=document.createElement('h3');h.textContent='Import preview';const summary=document.createElement('p');summary.textContent=`${plan.added.length} new · ${plan.skipped.length} skipped · 0 overwritten · 0 XP awarded. ID/title conflicts are never overwritten in Build 1.`;
      const list=document.createElement('ul');for(const q of plan.added){const li=document.createElement('li');li.textContent=`${q.title} · ${q.xp} XP · ${q.source==='ai'?'AI Inbox (approval required)':'Custom quest'}`;list.append(li);}
      for(const q of plan.skipped){const li=document.createElement("li");li.textContent="SKIPPED (ID/title conflict): "+q.title;list.append(li);}
      const yes=document.createElement('button');yes.textContent='CONFIRM ADDITIONS';yes.disabled=!plan.added.length;yes.onclick=()=>run(()=>{if(JSON.stringify(state)!==baseline)throw Error('Save changed. Close and import again for a fresh preview.');commit(QuestV2.apply(state,data));dialog.close();status('Import saved. No XP awarded.');});
      const no=document.createElement('button');no.textContent='CANCEL';no.onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.append(h,summary,list,yes,no);document.body.append(dialog);dialog.showModal();
    }catch(e){status(e.message);}
  };
  return {render:renderInbox,edit};
})();
