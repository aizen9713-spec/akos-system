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
   ${escapeHtml(String(quest.xp))} XP
${statRewardText ? ` · ${escapeHtml(statRewardText)}` : ""}
${skillRewardText ? ` · ${escapeHtml(skillRewardText)}` : ""}
${quest.completed ? " · COMPLETED" : " · ACTIVE"}
  </div>
`;

    const actions = document.createElement("div");
    actions.className = "quest-actions";

    const complete = document.createElement("button");
    complete.className = "small-btn complete-btn";
    complete.textContent = quest.completed ? "VISSZAVONÁS" : "COMPLETE";
    complete.type = "button";
    complete.title = quest.completed ? "A teljesítés és jutalmai visszavonása" : "Quest teljesítése";
    complete.onclick = () => quest.completed ? undoQuestCompletion(quest.id) : completeQuest(quest.id);

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
