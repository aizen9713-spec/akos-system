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


function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
