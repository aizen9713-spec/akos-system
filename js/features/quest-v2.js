/* Quest exchange is definition-only: never accept progress or reward maps from files. */
const QuestV2 = (() => {
  const key = q => q.title.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
  function definition(q) {
    if (!q || typeof q !== 'object' || typeof q.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(q.id) || typeof q.title !== 'string' || !q.title.trim() || q.title.length > 80 || !Number.isInteger(q.xp) || q.xp < 1 || q.xp > 100 || !['custom','ai'].includes(q.source)) throw Error('Invalid quest definition (ID, title, XP 1–100 or source).');
    return {id:q.id,title:q.title.trim(),xp:q.xp,source:q.source};
  }
  function preview(state, file) {
    if (!file || file.format !== 'shadow-quests' || file.version !== 1 || !Array.isArray(file.quests) || file.quests.length > 200) throw Error('Unsupported shadow-quests format/version (maximum 200 quests).');
    const existing = [...state.quests, ...(state.questInbox || [])];
    const ids = new Set(existing.map(q=>q.id)), titles = new Set(existing.map(key));
    const added=[], skipped=[];
    for (const raw of file.quests) {
      const q=definition(raw);
      if(ids.has(q.id)||titles.has(key(q))) { skipped.push(q); continue; }
      ids.add(q.id);titles.add(key(q));added.push(q);
    }
    return {added,skipped};
  }
  function apply(state, file) {
    const plan=preview(state,file), next=structuredClone(state);
    next.questInbox ||= [];
    for(const q of plan.added) {
      if(q.source==='ai') next.questInbox.push(q);
      else next.quests.push({...q,kind:'custom',completed:false,statRewards:{},skillRewards:{}});
    }
    return next;
  }
  function approve(state,id) {
    const next=structuredClone(state), q=(next.questInbox||[]).find(q=>q.id===id);
    if(!q) throw Error('Suggestion no longer exists.');
    if(next.quests.some(x=>x.id===id||key(x)===key(q))) throw Error('Duplicate quest.');
    next.quests.push({...definition(q),kind:'custom',completed:false,statRewards:{},skillRewards:{}});
    next.questInbox=next.questInbox.filter(x=>x.id!==id);return next;
  }
  function exportFile(state) {
    return {format:'shadow-quests',version:1,exportedAt:new Date().toISOString(),quests:[...state.quests.filter(q=>q.kind==='custom').map(q=>definition({...q,source:'custom'})),...(state.questInbox||[]).map(definition)]};
  }
  return {preview,apply,approve,exportFile,definition};
})();
if(typeof module!=='undefined') module.exports=QuestV2;
