/* Calendar V1: independent definitions; imports never edit Quests, Training or rewards. */
const CalendarData = (() => {
 const kinds=['event','training','quest','reminder'],clone=x=>structuredClone(x);
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2100-12-31'&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const time=x=>typeof x==='string'&&(x===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(x));

 const zones=new Set(),instantCache=new Map(),formatters=new Map();
 function notification(n){
  if(!n||Array.isArray(n)||![null,0,5,15,30,60,1440].includes(n.offsetMinutes)||typeof n.timeZone!=='string'||n.timeZone.length>100||!time(n.allDayTime)||!n.allDayTime)throw Error('Invalid reminder settings.');
  if(!zones.has(n.timeZone)){try{new Intl.DateTimeFormat('en',{timeZone:n.timeZone});zones.add(n.timeZone);}catch{throw Error('Use a valid IANA time zone, for example Europe/Budapest.');}}
  return {offsetMinutes:n.offsetMinutes,timeZone:n.timeZone,allDayTime:n.allDayTime};
 }
 function notificationInstant(e){
  if(!e.notification||e.notification.offsetMinutes===null)return null;
  const n=notification(e.notification),clock=e.time||n.allDayTime,key=e.date+'T'+clock+'@'+n.timeZone;
  if(instantCache.has(key))return instantCache.get(key);
  let fmt=formatters.get(n.timeZone);if(!fmt){fmt=new Intl.DateTimeFormat('en-GB',{timeZone:n.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formatters.set(n.timeZone,fmt);}
  const target=Date.parse(e.date+'T'+clock+':00Z'),wall=t=>{const p=Object.fromEntries(fmt.formatToParts(new Date(t)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return Date.parse(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute+':'+p.second+'Z');};
  const candidates=[-36,0,36].map(h=>{const sample=target+h*3600000;return target-(wall(sample)-sample);}).filter(t=>wall(t)===target);
  if(!candidates.length)throw Error('This local time does not exist because of a daylight-saving change. Choose another time.');
  const result=Math.max(...candidates);if(instantCache.size>4000)instantCache.clear();instantCache.set(key,result);return result;
 }

 function event(x){
  if(!x||Array.isArray(x)||typeof x.id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(x.id)||typeof x.title!=='string'||!x.title.trim()||x.title.length>150||!date(x.date)||!time(x.time)||!time(x.endTime)||(!x.time&&x.endTime)||(x.endTime&&x.endTime<=x.time)||!kinds.includes(x.kind)||typeof x.note!=='string'||x.note.length>3000||typeof x.questId!=='string'||x.questId.length>150||typeof x.completed!=='boolean'||(x.sourceRef!==undefined&&(typeof x.sourceRef!=='string'||x.sourceRef.length>200)))throw Error('Invalid calendar event. Use a date from 1900–2100 and HH:MM times; end time must be after start time.');
  const reminder=x.notification===undefined?undefined:notification(x.notification);
  if(reminder)notificationInstant({...x,notification:reminder});
  return {id:x.id,title:x.title.trim(),date:x.date,time:x.time,endTime:x.endTime,kind:x.kind,note:x.note,questId:x.questId,completed:x.completed,sourceRef:x.sourceRef??'',...(reminder?{notification:reminder}:{})};
 }
 function validate(x){if(!x||x.version!==1||!Array.isArray(x.events)||x.events.length>2000)throw Error('Invalid Calendar V1 data.');const events=x.events.map(event);if(new Set(events.map(e=>e.id)).size!==events.length)throw Error('Duplicate event ID.');const refs=events.map(e=>e.sourceRef).filter(Boolean);if(new Set(refs).size!==refs.length)throw Error('Only one calendar override is allowed per training occurrence.');if(new TextEncoder().encode(JSON.stringify(events)).length>500000)throw Error('The calendar reached its 500 KB size limit. Export old entries before archiving them.');return {version:1,events};}
 const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
 function preview(current,file){
  const local=validate(current);
  if(!file||file.format!=='shadow-calendar'||file.version!==1||file.timeBasis!=='local')throw Error('A Shadow Calendar V1 JSON file with local time basis is required.');
  const base=validate({version:1,events:file.baseEvents}),desired=validate({version:1,events:file.events});
  const before=new Map(base.events.map(e=>[e.id,e])),after=new Map(desired.events.map(e=>[e.id,e])),now=new Map(local.events.map(e=>[e.id,e]));
  const changes=[],conflicts=[];
  for(const id of new Set([...before.keys(),...after.keys()])){
   const b=before.get(id),a=after.get(id),n=now.get(id);if(equal(b,a)||equal(n,a))continue;
   if(!equal(n,b)){conflicts.push(id);continue;}
   changes.push({id,action:!a?'delete':!b?'add':'update',before:n??null,after:a??null});
  }
  if(conflicts.length)throw Error('Conflict: '+conflicts.join(', ')+'. Export a fresh file; neither version was overwritten.');
  const merged=new Map(now);for(const c of changes){if(c.after)merged.set(c.id,c.after);else merged.delete(c.id);}
  return {changes,calendar:validate({version:1,events:[...merged.values()]})};
 }
 function exportFile(current,context={}){const d=validate(current);return {format:'shadow-calendar',version:1,timeBasis:'local',exportedAt:new Date().toISOString(),instructions:'Edit events only. Keep baseEvents and existing IDs unchanged. New events need a unique ID. Removing an event from events proposes deletion. context is read-only. No XP or Quest/Training changes are imported.',baseEvents:clone(d.events),events:clone(d.events),context};}
 const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
 function derived(state,key){
  if(!date(key))return [];
  const rows=[];const day=new Date(key+'T12:00:00').getDay();
  if((state.settings?.trainingDays||[]).includes(weekdays[day]))rows.push({ref:'planned:'+key,title:'Scheduled training day',kind:'training',source:'Training schedule',time:'',completed:false});
  for(const s of state.training?.history||[])if(s.date===key)rows.push({ref:'workout:'+s.id,title:s.name||'Training',kind:'training',source:'Workout history',time:'',completed:true});
  for(const s of state.training?.cardio||[])if(s.date===key)rows.push({ref:'cardio:'+s.id,title:'Cardio · '+s.minutes+' perc',kind:'training',source:'Cardio history',time:'',completed:true});
  if(state.training?.draft?.date===key)rows.push({ref:'draft:'+state.training.draft.id,title:state.training.draft.name||'Active workout',kind:'training',source:'Active workout draft',time:'',completed:false});
  return rows;
 }
 function entries(state,key){const all=validate(state.calendar??{version:1,events:[]}).events,refs=new Set(all.map(e=>e.sourceRef).filter(Boolean));return [...all.filter(e=>e.date===key).map(e=>({...e,source:e.sourceRef?'Calendar override':'Calendar'})),...derived(state,key).filter(e=>!refs.has(e.ref))];}
 return {event,validate,preview,exportFile,derived,entries,date,notification,notificationInstant};
})();
if(typeof module!=='undefined')module.exports=CalendarData;
