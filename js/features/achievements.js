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