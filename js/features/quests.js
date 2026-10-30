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
// Subtract earned XP while reversing any crossed level thresholds.
function subtractQuestProgress(level, xp, amount, threshold) {
  if (!Number.isInteger(level) || level < 1 || !Number.isFinite(xp) || xp < 0 || !Number.isFinite(amount) || amount < 0) {
    throw new Error('Érvénytelen jutalomadat; a mentés változatlan maradt.');
  }
  xp -= amount;
  while (xp < 0 && level > 1) {
    level -= 1;
    xp += threshold(level);
  }
  if (xp < 0) throw new Error('A jutalom nem vonható vissza biztonságosan; a mentés változatlan maradt.');
  return { level, xp };
}

function undoQuestCompletion(id) {
  // Never apply an old screen's action to a different day or a newer tab save.
  if (state.activeDay !== getDateKey()) {
    handleDayRollover();
    return;
  }
  const quest = state.quests.find(q => q.id === id);
  if (!quest?.completed) return;
  const previous = state;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && JSON.parse(stored).lastSavedAt !== state.lastSavedAt) {
      throw new Error('Újabb helyi mentés létezik. Frissítsd az oldalt a visszavonás előtt.');
    }
    const next = structuredClone(state);
    const target = next.quests.find(q => q.id === id);
    const player = subtractQuestProgress(next.player.level, next.player.xp, target.xp, xpNeededForLevel);
    next.player.level = player.level;
    next.player.xp = player.xp;
    for (const [statKey, amount] of Object.entries(target.statRewards || {})) {
      if (next.stats[statKey] === undefined) continue;
      const stat = subtractQuestProgress(next.statLevels[statKey], next.stats[statKey], amount, statXpNeededForLevel);
      next.statLevels[statKey] = stat.level;
      next.stats[statKey] = stat.xp;
    }
    for (const [skillKey, amount] of Object.entries(target.skillRewards || {})) {
      if (!next.skills[skillKey]) continue;
      next.skills[skillKey].xp = subtractQuestProgress(1, next.skills[skillKey].xp, amount, () => 0).xp;
    }
    target.completed = false;
    state = next;
    addLog('[QUEST UNDONE] ' + target.title + ' · -' + target.xp + ' XP');
    saveState();
  } catch (error) {
    state = previous;
    alert(error.message);
    return;
  }
  render();
}
