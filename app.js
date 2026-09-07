const STORAGE_KEY = "akos-system-v0.1.0";

const defaultState = {
  player: {
    name: "Ákos",
    title: "THE MAIN CHARACTER",
    arc: "VILLAIN ORIGIN",
    level: 1,
    xp: 50,
    streak: 1
  },
  stats: {
  str: 0,
  end: 0,
  int: 0,
  dis: 0,
  cha: 0,
  wis: 0,
  virtue: 0
},
  quests: [
    {
  id: crypto.randomUUID(),
  title: "Complete one meaningful action today",
  xp: 10,
  completed: false,
  statRewards: {
    dis: 5
  }
}
  ],
  log: [
    { id: crypto.randomUUID(), text: "[SYSTEM] Day 1 baseline loaded." }
  ]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    const loaded = JSON.parse(saved);

    return {
      ...structuredClone(defaultState),
      ...loaded,

      player: {
        ...defaultState.player,
        ...(loaded.player || {})
      },

     stats: {
  ...defaultState.stats,
  ...(loaded.stats || {})
},

quests: (loaded.quests || defaultState.quests).map(quest => ({
  ...quest,
  statRewards:
    quest.statRewards ??
    (
      quest.title === "Complete one meaningful action today"
        ? { dis: 5 }
        : {}
    )
}))
    };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function xpNeededForLevel(level) {
  return 100;
}

function applyLevelUps() {
  let needed = xpNeededForLevel(state.player.level);

  while (state.player.xp >= needed) {
    state.player.xp -= needed;
    state.player.level += 1;
    addLog(`[LEVEL UP] Player reached Level ${state.player.level}.`);
    needed = xpNeededForLevel(state.player.level);
  }
}

function addLog(text) {
  state.log.unshift({
    id: crypto.randomUUID(),
    text
  });

  state.log = state.log.slice(0, 12);
}

function addQuest() {
  const input = document.getElementById("questInput");
  const xpInput = document.getElementById("questXpInput");
  const statInput = document.getElementById("questStatInput");
const statXpInput = document.getElementById("questStatXpInput");

const stat = statInput.value;
const statXp = Number(statXpInput.value);
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
    : {}
});

  addLog(`[QUEST ADDED] ${title}`);
  input.value = "";
  statInput.value = "";
statXpInput.value = 5;
  saveState();
  render();
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.completed) return;

  quest.completed = true;
  state.player.xp += quest.xp;

  if (quest.statRewards) {
  for (const [statKey, amount] of Object.entries(quest.statRewards)) {
    if (state.stats[statKey] !== undefined) {
      state.stats[statKey] += amount;
    }
  }
}

  addLog(`[QUEST COMPLETE] ${quest.title} · +${quest.xp} XP`);
  applyLevelUps();

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

function resetSystem() {
  const okay = confirm("Reset the local System save? This cannot be undone.");
  if (!okay) return;

  state = structuredClone(defaultState);
  saveState();
  render();
}

function renderPlayer() {
  const p = state.player;
  const needed = xpNeededForLevel(p.level);
  const percent = Math.min(100, Math.round((p.xp / needed) * 100));

  document.getElementById("playerName").textContent = p.name;
  document.getElementById("playerTitle").textContent = p.title;
  document.getElementById("playerArc").textContent = p.arc;
  document.getElementById("levelValue").textContent = p.level;
  document.getElementById("xpText").textContent = `${p.xp} / ${needed} XP`;
  document.getElementById("xpPercent").textContent = `${percent}%`;
  document.getElementById("xpFill").style.width = `${percent}%`;
  document.getElementById("streakValue").textContent = p.streak;
}

function renderStats() {
  const stats = state.stats;

  const statMap = {
    str: { value: "strValue", fill: "strFill" },
    end: { value: "endValue", fill: "endFill" },
    int: { value: "intValue", fill: "intFill" },
    dis: { value: "disValue", fill: "disFill" },
    cha: { value: "chaValue", fill: "chaFill" },
    wis: { value: "wisValue", fill: "wisFill" },
    virtue: { value: "virtueValue", fill: "virtueFill" }
  };

  for (const [statKey, elements] of Object.entries(statMap)) {
    const xp = stats[statKey] || 0;

    const valueEl = document.getElementById(elements.value);
    const fillEl = document.getElementById(elements.fill);

    if (valueEl) {
      valueEl.textContent = `${xp} XP`;
    }

    if (fillEl) {
      const percent = Math.min((xp / 100) * 100, 100);
      fillEl.style.width = `${percent}%`;
    }
  }
}
function renderQuests() {
  const list = document.getElementById("questList");
  list.innerHTML = "";

  if (state.quests.length === 0) {
    list.innerHTML = `<p class="muted">No active quests.</p>`;
  }

  state.quests.forEach(quest => {
    const row = document.createElement("div");
    row.className = `quest-row ${quest.completed ? "completed" : ""}`;

    const left = document.createElement("div");
    const statRewardText = quest.statRewards
  ? Object.entries(quest.statRewards)
      .filter(([_, amount]) => amount > 0)
      .map(([stat, amount]) => `+${amount} ${stat.toUpperCase()}`)
      .join(" · ")
  : "";

left.innerHTML = `
  <div class="quest-name">${escapeHtml(quest.title)}</div>
  <div class="quest-meta">
    ${quest.xp} XP
    ${statRewardText ? ` · ${statRewardText}` : ""}
    · ${quest.completed ? "COMPLETED" : "ACTIVE"}
  </div>
`;

    const actions = document.createElement("div");
    actions.className = "quest-actions";

    const complete = document.createElement("button");
    complete.className = "small-btn complete-btn";
    complete.textContent = quest.completed ? "DONE" : "COMPLETE";
    complete.disabled = quest.completed;
    complete.onclick = () => completeQuest(quest.id);

    const remove = document.createElement("button");
    remove.className = "small-btn delete-btn";
    remove.textContent = "DELETE";
    remove.onclick = () => deleteQuest(quest.id);

    actions.append(complete, remove);
    row.append(left, actions);
    list.appendChild(row);
  });

  const completed = state.quests.filter(q => q.completed).length;
  document.getElementById("questCounter").textContent = `${completed}/${state.quests.length}`;
}

function renderLog() {
  const list = document.getElementById("logList");
  list.innerHTML = "";

  state.log.forEach(item => {
    const row = document.createElement("div");
    row.className = "log-item";
    row.textContent = item.text;
    list.appendChild(row);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  renderPlayer();
  renderStats();
  renderQuests();
  renderLog();
}

const questStatInput = document.getElementById("questStatInput");
const questStatXpInput = document.getElementById("questStatXpInput");

function updateStatXpInput() {
  const hasStat = questStatInput.value !== "";

  questStatXpInput.disabled = !hasStat;

  if (!hasStat) {
    questStatXpInput.value = 0;
  } else if (Number(questStatXpInput.value) === 0) {
    questStatXpInput.value = 5;
  }
}

questStatInput.addEventListener("change", updateStatXpInput);
updateStatXpInput();

document.getElementById("addQuestBtn").addEventListener("click", addQuest);
document.getElementById("questInput").addEventListener("keydown", e => {
  if (e.key === "Enter") addQuest();
});
document.getElementById("resetBtn").addEventListener("click", resetSystem);

render();

if (
  "serviceWorker" in navigator &&
  location.hostname !== "127.0.0.1" &&
  location.hostname !== "localhost"
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}