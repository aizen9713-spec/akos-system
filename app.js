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
  quests: [
    { id: crypto.randomUUID(), title: "Complete one meaningful action today", xp: 10, completed: false }
  ],
  log: [
    { id: crypto.randomUUID(), text: "[SYSTEM] Day 1 baseline loaded." }
  ]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return JSON.parse(saved);
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
    completed: false
  });

  addLog(`[QUEST ADDED] ${title}`);
  input.value = "";
  saveState();
  render();
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.completed) return;

  quest.completed = true;
  state.player.xp += quest.xp;

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
    left.innerHTML = `
      <div class="quest-name">${escapeHtml(quest.title)}</div>
      <div class="quest-meta">${quest.xp} XP · ${quest.completed ? "COMPLETED" : "ACTIVE"}</div>
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
  renderQuests();
  renderLog();
}

document.getElementById("addQuestBtn").addEventListener("click", addQuest);
document.getElementById("questInput").addEventListener("keydown", e => {
  if (e.key === "Enter") addQuest();
});
document.getElementById("resetBtn").addEventListener("click", resetSystem);

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
