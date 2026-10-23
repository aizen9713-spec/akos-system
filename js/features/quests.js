function addQuest() {
  const input = document.getElementById("questInput");
  const xpInput = document.getElementById("questXpInput");
  const statInput = document.getElementById("questStatInput");
const statXpInput = document.getElementById("questStatXpInput");
const skillInput = document.getElementById("questSkillInput");
const skillXpInput = document.getElementById("questSkillXpInput");

const stat = statInput.value;
const statXp = Number(statXpInput.value);

const skill = skillInput.value;
const skillXp = Number(skillXpInput.value);

const title = input.value.trim();
const xp = Number(xpInput.value);

  if (!title) return;

  if (!Number.isFinite(xp) || xp < 1 || xp > 100) {
    alert("Quest XP must be between 1 and 100.");
    return;
  }

 state.quests.push({
  id: crypto.randomUUID(),
  title,
  xp,
  completed: false,

  statRewards: stat
    ? { [stat]: statXp }
    : {},

  skillRewards: skill
    ? { [skill]: skillXp }
    : {}
});

  addLog(`[QUEST ADDED] ${title}`);

input.value = "";

// Reset stat reward
statInput.value = "";
statXpInput.value = 0;
updateStatXpInput();

// Reset skill reward
skillInput.value = "";
skillXpInput.value = 0;
updateSkillXpInput();

saveState();
render();
}

function applyQuestRewards(quest) {
  state.player.xp += quest.xp;

  if (quest.statRewards) {
  for (const [statKey, amount] of Object.entries(quest.statRewards)) {
    if (state.stats[statKey] !== undefined) {
      state.stats[statKey] += amount;

      applyStatLevelUps(statKey);
    }
  }
}

  if (quest.skillRewards) {
    for (const [skillKey, amount] of Object.entries(quest.skillRewards)) {
      if (state.skills[skillKey]) {
        state.skills[skillKey].xp += amount;
      }
    }
  }

  applyLevelUps();
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.completed) return;

  quest.completed = true;
applyQuestRewards(quest);

  addLog(`[QUEST COMPLETE] ${quest.title} · +${quest.xp} XP`);

  saveState();
  render();
}

function deleteQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;

  state.quests = state.quests.filter(q => q.id !== id);
  addLog(`[QUEST REMOVED] ${quest.title}`);
  saveState();
  render();
}