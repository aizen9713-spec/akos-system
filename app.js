const STORAGE_KEY = "akos-system-v0.1.0";


const STREAK_MILESTONES = [7, 14, 30, 100];

let historyWeekOffset = 0;

function getNextStreakMilestone(streak) {
  return STREAK_MILESTONES.find(milestone => milestone > streak)
    ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
}

const DAILY_TRANSMISSION_CATEGORIES =
  Object.keys(DAILY_TRANSMISSIONS);

function getDailyTransmission() {
  const categoryIndex =
    state.dailyMessageIndex %
    DAILY_TRANSMISSION_CATEGORIES.length;

  const category =
    DAILY_TRANSMISSION_CATEGORIES[categoryIndex];

  const messages =
    DAILY_TRANSMISSIONS[category];

  const messageCycle =
    Math.floor(
      state.dailyMessageIndex /
      DAILY_TRANSMISSION_CATEGORIES.length
    );

  const messageIndex =
    messageCycle % messages.length;

  return {
    category,
    message: messages[messageIndex]
  };
}

function getWeekdayKey(date = new Date()) {
  const dayIndex = date.getDay();

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  return days[dayIndex];
}

function createDailyQuests(date = new Date()) {
  const weekdayKey = getWeekdayKey(date);
  const template = WEEKLY_QUESTS[weekdayKey] || [];

  return template.map(quest => ({
    id: crypto.randomUUID(),
    title: quest.title,
    xp: quest.xp,
    completed: false,
    statRewards: structuredClone(quest.statRewards || {}),
    skillRewards: structuredClone(quest.skillRewards || {})
  }));
}


function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );
}

function addDaysToDateKey(dateKey, amount) {
  const date = dateKeyToLocalDate(dateKey);

  date.setDate(date.getDate() + amount);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMondayDateKey(dateKey) {
  const date = dateKeyToLocalDate(dateKey);

  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diffToMonday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${dayOfMonth}`;
}

function getHistoryWeekRange() {
  const currentMonday = getMondayDateKey(getDateKey());

  const startDate = addDaysToDateKey(
    currentMonday,
    historyWeekOffset * -7
  );

  const endDate = addDaysToDateKey(startDate, 6);

  return {
    startDate,
    endDate
  };
}


let state = loadState();


function checkNoZeroDaysAchievement() {
  const achievementId = "no-zero-days";

  const alreadyUnlocked = state.achievements.some(
    achievement => achievement.id === achievementId
  );

  if (alreadyUnlocked) {
    return false;
  }

  if (state.player.streak >= state.player.streakGoal) {
    state.achievements.push({
      id: achievementId,
      title: "NO ZERO DAYS",
      description: "Completed at least one meaningful action for 7 consecutive days.",
      unlockedAt: new Date().toISOString()
    });

    return true;
  }

  return false;
}


repairMissingHistoryDays();
handleDayRollover();


function addLog(text) {
  state.log.unshift({
    id: crypto.randomUUID(),
    text
  });

  state.log = state.log.slice(0, 12);
}


function resetSystem() {
  const okay = confirm("Reset the local System save? This cannot be undone.");
  if (!okay) return;

  state = structuredClone(defaultState);
  recalculateStreak();
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
  const nextStreakMilestone = getNextStreakMilestone(p.streak);

document.getElementById("streakValue").textContent =
  `${p.streak} / ${nextStreakMilestone}`;
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

    const level = state.statLevels[statKey] || 1;
const needed = statXpNeededForLevel(level);

    const valueEl = document.getElementById(elements.value);
    const fillEl = document.getElementById(elements.fill);

    if (valueEl) {
      valueEl.textContent = `Lv.${level} · ${xp} / ${needed} XP`;
    }

    if (fillEl) {
      const percent = Math.min((xp / needed) * 100, 100);
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
const historyList = document.getElementById("historyList");

const historyPrevWeek =
  document.getElementById("historyPrevWeek");

const historyNextWeek =
  document.getElementById("historyNextWeek");

const historyWeekLabel =
  document.getElementById("historyWeekLabel");

  const { startDate, endDate } = getHistoryWeekRange();

  historyWeekLabel.textContent =
  historyWeekOffset === 0
    ? `CURRENT WEEK · ${startDate} — ${endDate}`
    : `${startDate} — ${endDate}`;

historyNextWeek.disabled =
  historyWeekOffset === 0;

historyPrevWeek.onclick = () => {
  historyWeekOffset += 1;
  render();
};

historyNextWeek.onclick = () => {
  if (historyWeekOffset > 0) {
    historyWeekOffset -= 1;
    render();
  }
};

activeList.innerHTML = "";
completedList.innerHTML = "";
historyList.innerHTML = "";

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
  if (state.history.length === 0) {
  historyList.innerHTML = `<p class="muted">No history yet.</p>`;
} else {

  const visibleHistory = state.history.filter(day =>
    day.date >= startDate &&
    day.date <= endDate
  );

  if (visibleHistory.length === 0) {
    historyList.innerHTML = `
      <p class="muted">
        No history for this week.
      </p>
    `;
  }

  visibleHistory.forEach(day => {
    const row = document.createElement("div");
    row.className = "quest-row completed";

    const questDetails = day.quests
  .map(quest => `
    <div class="history-quest-item">
      <span class="${quest.completed ? "history-check done" : "history-check missed"}">
  ${quest.completed ? "✓" : "✕"}
</span>
<span>${escapeHtml(quest.title)}</span>
      <span class="muted">${quest.completed ? "COMPLETED" : "INCOMPLETE"}</span>
    </div>
  `)
  .join("");

row.innerHTML = `
  <details class="history-day">
    <summary>
      <div>
        <strong>${day.date}</strong>
        <div class="muted">
          ${day.completedQuests} / ${day.totalQuests} completed
        </div>
      </div>
    </summary>

    <div class="history-details">
  ${questDetails}

  <button
    class="recover-day-btn"
    type="button"
    data-date="${day.date}"
  >
    RECOVER DAY
  </button>
</div>
  </details>
`;

    historyList.appendChild(row);
  });
}
document.querySelectorAll(".recover-day-btn").forEach(button => {
  button.addEventListener("click", () => {
    const targetDate = button.dataset.date;

    const targetDay = state.history.find(
  day => day.date === targetDate
);

if (!targetDay) {
  return;
}

const details = button.closest(".history-details");

if (!details) {
  return;
}

const recoveryQuestList = targetDay.quests
  .map(quest => `
    <label class="recovery-quest-item">
      <input
        type="checkbox"
        data-quest-id="${quest.id}"
        ${quest.completed ? "checked" : ""}
      >

      <span>${escapeHtml(quest.title)}</span>
    </label>
  `)
  .join("");

details.innerHTML = `
  <div class="recovery-panel">
    <p class="eyebrow">MISSED DAY RECOVERY</p>
    <h3>${targetDay.date}</h3>

    <p class="recovery-status">
  Select only quests that were actually completed. Rewards are restored once.
</p>

    <div class="recovery-quest-list">
      ${recoveryQuestList}
    </div>

    <button
      class="save-recovery-btn"
      type="button"
      data-date="${targetDay.date}"
    >
      SAVE CORRECTION
    </button>
    <button
  class="cancel-recovery-btn"
  type="button"
>
  CANCEL
</button>
  </div>
`;
const saveRecoveryButton =
  details.querySelector(".save-recovery-btn");

if (!saveRecoveryButton) {
  return;
}

const cancelRecoveryButton =
  details.querySelector(".cancel-recovery-btn");

if (!cancelRecoveryButton) {
  return;
}

cancelRecoveryButton.addEventListener("click", () => {
  render();
});

saveRecoveryButton.addEventListener("click", () => {
  const recoveryPanel =
    saveRecoveryButton.closest(".recovery-panel");

  if (!recoveryPanel) {
    return;
  }

  const checkedQuestIds = Array.from(
    recoveryPanel.querySelectorAll(
      'input[type="checkbox"]:checked'
    )
  ).map(input => input.dataset.questId);

  let recoveredCount = 0;
  let restoredXp = 0;

  targetDay.quests.forEach(quest => {
    const shouldBeCompleted =
      checkedQuestIds.includes(quest.id);

    if (shouldBeCompleted && !quest.completed) {
      quest.completed = true;

      applyQuestRewards(quest);

      addLog(
        `[HISTORY CORRECTION] ${targetDay.date} - ${quest.title} recovered +${quest.xp} XP`
      );

      recoveredCount += 1;
      restoredXp += quest.xp;
    }
  });

  targetDay.completedQuests =
    targetDay.quests.filter(
      quest => quest.completed
    ).length;

    if (recoveredCount > 0) {
  state.historyCorrections.push({
    id: crypto.randomUUID(),
    date: targetDay.date,
    correctedAt: new Date().toISOString(),
    recoveredQuests: recoveredCount,
    restoredXp: restoredXp
  });
}

    recalculateStreak();
checkNoZeroDaysAchievement();

  addLog(
    `[SYSTEM] History correction saved for ${targetDay.date}. ${recoveredCount} quest(s) recovered.`
  );

  saveState();
  render();
});
  });
});
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

function renderSettings() {
  document.getElementById("settings-guidance-mode").value =
    state.settings.guidanceMode;

  document.getElementById("settings-units").value =
    state.settings.units;

  document.getElementById("settings-week-start").value =
    state.settings.weekStartsOn;

  document.getElementById("settings-body-checkin-day").value =
    state.settings.bodyCheckInDay;

  document
    .querySelectorAll(".training-days-options input[type='checkbox']")
    .forEach(input => {
      input.checked = state.settings.trainingDays.includes(input.value);
    });
    document.getElementById("settings-mode-badge").textContent =
  `MODE: ${state.settings.guidanceMode}`;

document.getElementById("settings-units-badge").textContent =
  `UNITS: ${state.settings.units.toUpperCase()}`;

document.getElementById("settings-checkin-badge").textContent =
  `CHECK-IN: ${state.settings.bodyCheckInDay.slice(0, 3).toUpperCase()}`;
}

function saveSettingsFromForm() {
  state.settings.guidanceMode =
    document.getElementById("settings-guidance-mode").value;

  state.settings.units =
    document.getElementById("settings-units").value;

  state.settings.weekStartsOn =
    document.getElementById("settings-week-start").value;

  state.settings.bodyCheckInDay =
    document.getElementById("settings-body-checkin-day").value;

    state.settings.trainingDays = Array.from(
  document.querySelectorAll(
    ".training-days-options input[type='checkbox']:checked"
  )
).map(input => input.value);

  saveState();
  render();

  state.log.unshift({
    id: crypto.randomUUID(),
    text: "[SYSTEM] Settings updated."
  });

  saveState();
  render();
  const saveButton = document.getElementById("save-settings-btn");

saveButton.textContent = "SAVED ✓";
saveButton.classList.add("is-saved");

setTimeout(() => {
  saveButton.textContent = "SAVE SETTINGS";
  saveButton.classList.remove("is-saved");
}, 1200);
}

function renderAchievements() {
  const list = document.getElementById("achievementList");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (state.achievements.length === 0) {
    list.innerHTML = `<p class="muted">No achievements unlocked yet.</p>`;
    return;
  }

  state.achievements.forEach(achievement => {
    const card = document.createElement("div");
    card.className = "achievement-item";

    card.innerHTML = `
  <div class="achievement-head">
    <div class="achievement-title">
      <span class="achievement-icon">🏆</span>
      <strong>${escapeHtml(achievement.title)}</strong>
    </div>

    <span class="achievement-badge">UNLOCKED</span>
  </div>

  <div class="muted achievement-description">
    ${escapeHtml(achievement.description)}
  </div>
  <div class="achievement-date">
  UNLOCKED ${new Date(achievement.unlockedAt).toLocaleDateString()}
</div>
`;

    list.appendChild(card);
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
  const bestStreak =
  document.getElementById("dashboardBestStreak");
const activeDays =
  document.getElementById("dashboardActiveDays");
  const growthSnapshot = document.getElementById("growthSnapshot");
  const dailyQuote = document.getElementById("dailyQuote");

  const dailyTransmissionCategory =
  document.getElementById("dailyTransmissionCategory");

  const quests = state.quests || [];
  const completedQuests = quests.filter(quest => quest.completed).length;
  const totalQuests = quests.length;
  const stats = state.stats || {};
  const statEntries = Object.entries(stats);
const transmission =
  getDailyTransmission();

dailyQuote.textContent =
  `"${transmission.message}"`;

dailyTransmissionCategory.textContent =
  transmission.category.toUpperCase();

  questProgress.textContent = `${completedQuests} / ${totalQuests}`;
  const nextStreakMilestone = getNextStreakMilestone(
  state.player.streak
);

streak.textContent =
  `${state.player.streak} / ${nextStreakMilestone}`;
  bestStreak.textContent =
  state.player.bestStreak;
activeDays.textContent =
  state.player.totalActiveDays;
  growthSnapshot.innerHTML = statEntries
  .map(([key, value]) => {
    const xp = value ?? 0;
const level = state.statLevels[key] || 1;
const xpNeeded = statXpNeededForLevel(level);
const progress = Math.min((xp / xpNeeded) * 100, 100);

    return `
      <div class="growth-stat">
        <div class="growth-stat-head">
          <span>
  ${STAT_CONFIG[key]?.icon || ""}
  ${key.toUpperCase()}
</span>
          <span>Lv.${level} · ${xp} / ${xpNeeded} XP</span>
        </div>

        <div class="growth-bar">
          <div class="growth-bar-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  })
  .join("");
}

function renderSystemHealth() {
  const appVersion = document.getElementById("health-app-version");
  const activeDay = document.getElementById("health-active-day");
  const storage = document.getElementById("health-storage");
  const network = document.getElementById("health-network");
  const lastSave = document.getElementById("health-last-save");
  const status = document.getElementById("health-status");

  const hasStorage = !!localStorage.getItem(STORAGE_KEY);
  const isOnline = navigator.onLine;
  const isStable = !!state.activeDay && hasStorage;

  appVersion.textContent = "BETA 0.1";
  activeDay.textContent = state.activeDay || "—";

  storage.textContent = hasStorage ? "ONLINE" : "OFFLINE";
  storage.className = hasStorage
    ? "health-live health-online"
    : "health-live health-offline";

  network.textContent = isOnline ? "ONLINE" : "OFFLINE";
  network.className = isOnline
    ? "health-live health-online"
    : "health-live health-offline";

  if (state.lastSavedAt) {
    const savedDate = new Date(state.lastSavedAt);

    lastSave.textContent = savedDate.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } else {
    lastSave.textContent = "—";
  }

  status.textContent = isStable ? "STABLE" : "CHECK";
  status.className = isStable
    ? "health-live health-online"
    : "health-live health-warning";
}

function render() {
  renderPlayer();
  renderStats();
  renderSkills();
  renderQuests();
  renderDashboard();
  renderAchievements();
  renderSettings();
  renderSystemHealth();
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

    state = migrateState(imported.state);
    recalculateStreak();

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
  .getElementById("save-settings-btn")
  .addEventListener("click", saveSettingsFromForm);

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

window.addEventListener("online", renderSystemHealth);
window.addEventListener("offline", renderSystemHealth);

if (
  "serviceWorker" in navigator &&
  location.hostname !== "127.0.0.1" &&
  location.hostname !== "localhost"
) {
  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register("./sw.js", {
          updateViaCache: "none"
        });

      const updatePanel =
        document.getElementById("systemUpdatePanel");

        let isRefreshing = false;

navigator.serviceWorker.addEventListener(
  "controllerchange",
  () => {
    if (isRefreshing) return;

    isRefreshing = true;
    window.location.reload();
  }
);

        const updateButton =
  document.getElementById("systemUpdateBtn");

updateButton.addEventListener("click", () => {
  if (registration.waiting) {
    registration.waiting.postMessage({
      type: "SKIP_WAITING"
    });
  }
});

      function checkForUpdate() {
        if (
          registration.waiting &&
          navigator.serviceWorker.controller
        ) {
          updatePanel.hidden = false;
        }
      }

      checkForUpdate();

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            checkForUpdate();
          }
        });
      });

    } catch (error) {
      console.error("[SYSTEM] Update check failed:", error);
    }
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