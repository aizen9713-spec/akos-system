const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class El {
 constructor(){this.children=[];this.attrs={};this.events={};this.style={};this.dataset={};this.hidden=false;this.textContent='';this.scrollHeight=700;this.classList={toggle(){}};}
 setAttribute(k,v){this.attrs[k]=v} removeAttribute(k){delete this.attrs[k]}
 appendChild(x){this.children.push(x)} append(...x){this.children.push(...x)} replaceChildren(...x){this.children=x}
 addEventListener(k,f){(this.events[k]??=[]).push(f)} dispatchEvent(e){for(const f of this.events[e.type]||[])f(e)}
 cloneNode(){const e=new El();e.textContent=this.textContent;return e} after(e){this.afterElement=e}
 scrollIntoView(){} focus(){this.focused=true} contains(t){return t===this||this.children.some(x=>x.contains(t))}
 getBoundingClientRect(){return {left:10,top:120,bottom:164,width:280,height:44}}
}
const select=new El();select.options=[];select.value='';select.replaceChildren=(...x)=>{select.options=x};Object.defineProperty(select,'selectedIndex',{get(){return select.options.findIndex(x=>x.value===select.value)}});
const grid=new El(),doc=new El();doc.body=new El();doc.createElement=()=>new El();doc.getElementById=id=>id==='questSkillInput'?select:id==='skillsGrid'?grid:null;
const c={document:doc,window:new El(),innerWidth:320,innerHeight:568,queueMicrotask,Event:class{constructor(type){this.type=type}},Option:class{constructor(text,value){this.textContent=text;this.value=value}},escapeHtml:s=>s,structuredClone,crypto:{randomUUID:()=> 'test'},getDateKey:()=> '2026-11-01'};vm.createContext(c);
vm.runInContext(fs.readFileSync('js/core/state.js','utf8').split('const STORAGE_KEY')[0]+'\nthis.state=structuredClone(defaultState);',c);
const before=JSON.stringify(c.state);
for(const p of ['js/config/skills.js','js/ui/skills.js','js/ui/quest-skill-select.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);
const trigger=select.afterElement,list=doc.body.children[0],key=k=>{trigger.dispatchEvent({type:'keydown',key:k,preventDefault(){}})};
assert.equal(select.options.length,13);assert.equal(list.children.length,13);assert.equal(select.hidden,true);
const icons=vm.runInContext('SKILL_ICONS',c);assert.deepEqual(Object.keys(icons),Object.keys(c.state.skills));assert.equal(new Set(Object.values(icons)).size,12);
for(let i=1;i<13;i++){list.children[i].dispatchEvent({type:'click'});const k=select.options[i].value;assert.equal(select.value,k);assert.equal(trigger.children[0].textContent,icons[k]);assert.equal(trigger.children[1].textContent,c.state.skills[k].name);assert.equal(list.children[i].attrs['aria-selected'],'true');assert.equal(list.hidden,true)}
select.value='';c.window.syncQuestSkillSelector();assert.equal(trigger.children[1].textContent,'No skill');
key('ArrowDown');assert.equal(trigger.attrs['aria-expanded'],'true');key('End');key('Enter');assert.equal(select.value,'firstAid');key('Home');key('Escape');assert.equal(select.value,'firstAid');assert.equal(trigger.attrs['aria-activedescendant'],undefined);
key('ArrowUp');key('Home');key('ArrowDown');key(' ');assert.equal(select.value,'automotive');key('d');key('Enter');assert.equal(select.value,'diagnostics');
key('ArrowDown');key('Tab');assert.equal(list.hidden,true);key('ArrowDown');trigger.dispatchEvent({type:'blur'});assert.equal(list.hidden,true);
key('ArrowDown');doc.dispatchEvent({type:'pointerdown',target:new El()});assert.equal(list.hidden,true);
select.value='';c.renderSkills();assert.equal(trigger.children[1].textContent,'No skill');assert.equal(grid.children.length,12);for(let i=0;i<12;i++)assert.ok(grid.children[i].innerHTML.includes(Object.values(icons)[i]));assert.equal(JSON.stringify(c.state),before);
console.log('Skill icon selector: all 12 actual skills, shared Player icons, native values, reset, arrows/Home/End/typeahead/Enter/Space/Escape/Tab/blur/outside close, ARIA, unchanged state PASS (DOM simulation).');

