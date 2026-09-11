const STORAGE_KEY = "akos-system-v0.1.0";

const STAT_CONFIG = {
  str: { name: "Strength", icon: "💪" },
  end: { name: "Endurance", icon: "🏃" },
  int: { name: "Intelligence", icon: "🧠" },
  dis: { name: "Discipline", icon: "⚔️" },
  cha: { name: "Charisma", icon: "🗣️" },
  wis: { name: "Wisdom", icon: "💰" },
  virtue: { name: "Virtue", icon: "🛡️" }
};

const DAILY_QUOTES = [
  "Discipline is choosing what you want most over what you want now.",
  "A weak day completed is worth more than a perfect day postponed.",
  "You do not need motivation. You need the next action.",
  "Comfort is useful for recovery. Dangerous as a permanent residence.",
  "Small steps repeated long enough become an unfair advantage.",
  "The Player who repeats the basics eventually becomes the boss others cannot understand.",
  "Recovery is not retreat. Weapons are maintained before the next battle.",
  "Every excuse avoided becomes strength stored for later.",
  "You are not behind. You are still building.",
  "Progress becomes visible only after consistency becomes boring.",
  "Do the difficult thing before it becomes the emergency.",
  "The starting stats do not determine the final build.",
  "There is no final form.",
  "Build the life that makes discipline feel worth it.",
  "One disciplined decision can change the direction of an entire day."
];

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
skills: {
  automotive: {
    name: "Automotive",
    rank: "Intermediate",
    xp: 0
  },

  automotiveElectrical: {
    name: "Automotive Electrical",
    rank: "Beginner",
    xp: 0
  },

  diagnostics: {
    name: "Diagnostics",
    rank: "Intermediate",
    xp: 0
  },

  automotiveAC: {
    name: "Automotive AC",
    rank: "Intermediate",
    xp: 0
  },

  welding: {
    name: "Welding",
    rank: "Beginner",
    xp: 0
  },

  buildingDIY: {
    name: "Building / DIY",
    rank: "Intermediate",
    xp: 0
  },

  appDevelopment: {
    name: "App Development",
    rank: "Beginner",
    xp: 0
  },

  investing: {
    name: "Investing",
    rank: "Intermediate",
    xp: 0
  },

  entrepreneurship: {
    name: "Entrepreneurship",
    rank: "Beginner",
    xp: 0
  },

  communication: {
    name: "Communication",
    rank: "Intermediate",
    xp: 0
  },

  english: {
    name: "English",
    rank: "Developing",
    xp: 0
  },

  firstAid: {
    name: "First Aid",
    rank: "Intermediate",
    xp: 0
  }
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

skills: Object.fromEntries(
  Object.entries(defaultState.skills).map(([skillKey, defaultSkill]) => [
    skillKey,
    {
      ...defaultSkill,
      ...(loaded.skills?.[skillKey] || {})
    }
  ])
),

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

if (quest.skillRewards) {
  for (const [skillKey, amount] of Object.entries(quest.skillRewards)) {
    if (state.skills[skillKey]) {
      state.skills[skillKey].xp += amount;
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
function renderSkills() {
  const grid = document.getElementById("skillsGrid");

  if (!grid) return;

  grid.innerHTML = "";

  Object.entries(state.skills).forEach(([skillKey, skill]) => {
    const card = document.createElement("div");
    card.className = "skill-item";

    card.innerHTML = `
      <div class="skill-top">
        <strong>${escapeHtml(skill.name)}</strong>
        <span class="skill-rank">${escapeHtml(skill.rank)}</span>
      </div>

      <div class="skill-xp">
        ${skill.xp} XP
      </div>

      <div class="skill-bar">
        <div
          class="skill-fill"
          style="width: ${Math.min(skill.xp, 100)}%"
        ></div>
      </div>
    `;

    grid.appendChild(card);
  });
}
function renderQuests() {
  const activeList = document.getElementById("activeQuestList");
const completedList = document.getElementById("completedQuestList");

activeList.innerHTML = "";
completedList.innerHTML = "";

  if (state.quests.length === 0) {
  activeList.innerHTML = `<p class="muted">No active quests.</p>`;
  completedList.innerHTML = `<p class="muted">No completed quests.</p>`;
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
  const skillRewardText = quest.skillRewards
  ? Object.entries(quest.skillRewards)
      .filter(([, amount]) => amount > 0)
      .map(([skillKey, amount]) => {
        const skillName =
          state.skills?.[skillKey]?.name || skillKey;

        return `+${amount} ${skillName} XP`;
      })
      .join(" · ")
  : "";

left.innerHTML = `
  <div class="quest-name">${escapeHtml(quest.title)}</div>
  <div class="quest-meta">
   ${quest.xp} XP
${statRewardText ? ` · ${statRewardText}` : ""}
${skillRewardText ? ` · ${skillRewardText}` : ""}
${quest.completed ? " · COMPLETED" : " · ACTIVE"}
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
    if (quest.completed) {
  completedList.appendChild(row);
} else {
  activeList.appendChild(row);
}
  });
  
  if (activeList.children.length === 0) {
  activeList.innerHTML = `<p class="muted">No active quests.</p>`;
}

if (completedList.children.length === 0) {
  completedList.innerHTML = `<p class="muted">No completed quests yet.</p>`;
}

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

function renderDashboard() {
  const questProgress = document.getElementById("dashboardQuestProgress");
  const streak = document.getElementById("dashboardStreak");
  const growthSnapshot = document.getElementById("growthSnapshot");
  const dailyQuote = document.getElementById("dailyQuote");

  const quests = state.quests || [];
  const completedQuests = quests.filter(quest => quest.completed).length;
  const totalQuests = quests.length;
  const stats = state.stats || {};
  const statEntries = Object.entries(stats);
  const today = new Date();

const dayNumber = Math.floor(
  Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ) / 86400000
);

const quoteIndex = dayNumber % DAILY_QUOTES.length;

dailyQuote.textContent = `"${DAILY_QUOTES[quoteIndex]}"`;

  questProgress.textContent = `${completedQuests} / ${totalQuests}`;
  streak.textContent = `${state.player.streak} / 7`;
  growthSnapshot.innerHTML = statEntries
  .map(([key, value]) => {
    const xp = value ?? 0;
    const xpNeeded = 100;
    const progress = Math.min((xp / xpNeeded) * 100, 100);

    return `
      <div class="growth-stat">
        <div class="growth-stat-head">
          <span>
  ${STAT_CONFIG[key]?.icon || ""}
  ${key.toUpperCase()}
</span>
          <span>${xp} / ${xpNeeded} XP</span>
        </div>

        <div class="growth-bar">
          <div class="growth-bar-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  })
  .join("");
}
function render() {
  renderPlayer();
  renderStats();
  renderSkills();
  renderQuests();
  renderDashboard();
  renderLog();
}

function exportSave() {
  const saveData = {
    saveVersion: 1,
    app: "AKOS SYSTEM",
    exportedAt: new Date().toISOString(),
    state: state
  };

  const json = JSON.stringify(saveData, null, 2);

  const blob = new Blob([json], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    "akos-system-save-" +
    new Date().toISOString().slice(0, 10) +
    ".json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}


async function importSave(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (
      !imported ||
      imported.app !== "AKOS SYSTEM" ||
      !imported.state ||
      typeof imported.state !== "object"
    ) {
      throw new Error("Invalid AKOS SYSTEM save file.");
    }

    const confirmed = window.confirm(
      "IMPORT SYSTEM SAVE?\n\n" +
      "This will replace your current Player progress with the selected backup."
    );

    if (!confirmed) {
      return;
    }

    state = imported.state;

    saveState();
    render();

    alert("SYSTEM SAVE RESTORED");
  } catch (error) {
    console.error("Import failed:", error);

    alert(
      "IMPORT FAILED\n\nThe selected file is not a valid AKOS SYSTEM save."
    );
  }
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

const questSkillInput = document.getElementById("questSkillInput");
const questSkillXpInput = document.getElementById("questSkillXpInput");

function updateSkillXpInput() {
  const hasSkill = questSkillInput.value !== "";

  questSkillXpInput.disabled = !hasSkill;

  if (!hasSkill) {
    questSkillXpInput.value = 0;
  } else if (Number(questSkillXpInput.value) === 0) {
    questSkillXpInput.value = 5;
  }
}

questSkillInput.addEventListener("change", updateSkillXpInput);
updateSkillXpInput();

document.getElementById("addQuestBtn").addEventListener("click", addQuest);
document.getElementById("questInput").addEventListener("keydown", e => {
  if (e.key === "Enter") addQuest();
});
document.getElementById("resetBtn").addEventListener("click", resetSystem);

document
  .getElementById("exportSaveBtn")
  .addEventListener("click", exportSave);

document
  .getElementById("importSaveInput")
  .addEventListener("change", event => {
    const file = event.target.files[0];

    if (file) {
      importSave(file);
    }

    event.target.value = "";
  });

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
// =========================
// SYSTEM NAVIGATION v1
// =========================

const navButtons = document.querySelectorAll(".nav-btn");

function showPage(pageName) {
  const pages = document.querySelectorAll(".app-page");

  pages.forEach(page => {
    page.classList.remove("active");
  });

  navButtons.forEach(button => {
    button.classList.remove("active");
  });

  const targetPage = document.getElementById(`page-${pageName}`);
  const targetButton = document.querySelector(
    `.nav-btn[data-page="${pageName}"]`
  );

  if (targetPage) {
    targetPage.classList.add("active");
  }

  if (targetButton) {
    targetButton.classList.add("active");
  }
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});