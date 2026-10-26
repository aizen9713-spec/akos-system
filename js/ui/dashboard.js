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