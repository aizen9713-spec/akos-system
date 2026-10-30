const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const initial=()=>({activeDay:'2026-10-31',lastSavedAt:'initial',player:{level:1,xp:95,streak:39,bestStreak:39},stats:{str:98},statLevels:{str:1},skills:{work:{xp:30}},quests:[{id:'a',title:'A',xp:10,completed:false,statRewards:{str:5},skillRewards:{work:3}},{id:'b',title:'B',xp:20,completed:false,statRewards:{str:8},skillRewards:{work:4}}],history:[{date:'2026-10-30',completedQuests:2}],training:{history:[{id:'training-keep'}]},log:[]});
let stored,fail=false,alerts=[],renders=0,rollovers=0;
const c={structuredClone,console,Date,JSON,Number,Object,Error,STORAGE_KEY:'save',getDateKey:()=> '2026-10-31',handleDayRollover(){rollovers++;},alert:s=>alerts.push(s),localStorage:{getItem:()=>stored,setItem(k,v){if(fail)throw Error('Quota');stored=v;}},render(){renders++;},addLog(text){c.state.log.push({text});},saveState(){c.state.lastSavedAt='saved';c.localStorage.setItem('save',JSON.stringify(c.state));}};
vm.createContext(c);vm.runInContext(fs.readFileSync('js/core/progression.js','utf8')+'\n'+fs.readFileSync('js/features/quests.js','utf8'),c);
function reset(){c.state=initial();stored=JSON.stringify(c.state);fail=false;alerts=[];}
function rewards(){return JSON.stringify({player:c.state.player,stats:c.state.stats,statLevels:c.state.statLevels,skills:c.state.skills});}
reset();const original=rewards();c.completeQuest('a');assert.equal(c.state.player.level,2);assert.equal(c.state.statLevels.str,2);c.undoQuestCompletion('a');assert.equal(rewards(),original);assert.equal(c.state.quests[0].completed,false);assert.equal(JSON.parse(stored).quests[0].completed,false);
const persisted=stored;c.undoQuestCompletion('a');assert.equal(stored,persisted);assert.equal(rewards(),original);
// Undo A after earning B must retain B, including level thresholds.
reset();c.completeQuest('b');const onlyB=rewards();reset();c.completeQuest('a');c.completeQuest('b');c.undoQuestCompletion('a');assert.equal(rewards(),onlyB);assert.equal(c.state.quests[1].completed,true);assert.equal(c.state.training.history[0].id,'training-keep');assert.equal(c.state.history[0].completedQuests,2);assert.equal(c.state.player.streak,39);
// Re-completing does not farm rewards; a reload keeps undo available for old saves.
c.completeQuest('a');const earned=rewards();c.state=JSON.parse(stored);c.undoQuestCompletion('a');c.completeQuest('a');assert.equal(rewards(),earned);
// Atomic storage failure retains the completed quest and all rewards.
const before=JSON.stringify(c.state),disk=stored;fail=true;c.undoQuestCompletion('a');assert.equal(JSON.stringify(c.state),before);assert.equal(stored,disk);assert.match(alerts.pop(),/Quota/);fail=false;
// Stale screen cannot overwrite a newer save from another tab.
const newer=JSON.parse(stored);newer.lastSavedAt='other-tab';stored=JSON.stringify(newer);c.undoQuestCompletion('a');assert.equal(JSON.stringify(c.state),before);assert.match(alerts.pop(),/Újabb/);
// Midnight archives are not edited through yesterday's action.
c.state.activeDay='2026-10-30';c.undoQuestCompletion('a');assert.equal(rollovers,1);assert.equal(c.state.quests[0].completed,true);
assert.deepEqual(JSON.parse(JSON.stringify(c.subtractQuestProgress(4,1,360,c.xpNeededForLevel))),{level:1,xp:91});
console.log('Quest undo simulations completed: level/stat reversal, skill XP, double click, other quest retention, reload, re-completion, quota, stale save, midnight and history/Training/streak preservation. User UI tests pending.');
