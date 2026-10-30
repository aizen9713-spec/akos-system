function checkNoZeroDaysAchievement() {
  const achievementId = "no-zero-days";

  const alreadyUnlocked = state.achievements.some(
    achievement => achievement.id === achievementId
  );

  if (alreadyUnlocked) {
    return false;
  }

  if (
  Math.max(
    state.player.streak || 0,
    state.player.bestStreak || 0
  ) >= 7
) {
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

function checkStreakMilestones() {
  const bestStreak = Math.max(
    state.player.streak || 0,
    state.player.bestStreak || 0
  );

  const milestones = [
    {
      id: "streak-14",
      title: "IRON WILL",
      description: "Achieved a 14-day streak.",
      days: 14
    },
    {
      id: "streak-30",
      title: "UNBROKEN",
      description: "Achieved a 30-day streak.",
      days: 30
    }
  ];

  let unlockedCount = 0;

  milestones.forEach(milestone => {
    const alreadyUnlocked = state.achievements.some(
      achievement => achievement.id === milestone.id
    );

    if (bestStreak >= milestone.days && !alreadyUnlocked) {
      state.achievements.push({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        unlockedAt: new Date().toISOString()
      });

      unlockedCount++;
    }
  });

  return unlockedCount;
}