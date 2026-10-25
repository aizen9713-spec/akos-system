const STORAGE_KEY = "akos-system-v0.1.0";


const STREAK_MILESTONES = [7, 14, 30, 100];

let historyWeekOffset = 0;

function getNextStreakMilestone(streak) {
  return STREAK_MILESTONES.find(milestone => milestone > streak)
    ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
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


function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



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
