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

function getAchievementGoals(data) {
  const days = new Map(data.history.map(day => [day.date, day]));
  days.set(data.activeDay, {
    totalQuests: data.quests.length,
    completedQuests: data.quests.filter(quest => quest.completed).length
  });
  const recorded = [...days.values()];
  const streak = Math.max(data.player.streak || 0, data.player.bestStreak || 0);
  return [
    ["no-zero-days", "🔥", "No Zero Days", "Reach a 7-day streak.", streak, 7, "days"],
    ["streak-14", "🛡", "Iron Will", "Reach a 14-day streak.", streak, 14, "days"],
    ["streak-30", "⛓", "Unbroken", "Reach a 30-day streak.", streak, 30, "days"],
    ["streak-60", "👑", "Monarch’s Resolve", "Reach a 60-day streak.", streak, 60, "days"],
    ["quest-100", "⚔", "Quest Vanguard", "Complete 100 quests across recorded days.", recorded.reduce((sum, day) => sum + (Number(day.completedQuests) || 0), 0), 100, "quests"],
    ["perfect-10", "✦", "Flawless Ten", "Complete every quest on 10 days with at least one quest.", recorded.filter(day => day.totalQuests > 0 && day.completedQuests >= day.totalQuests).length, 10, "days"],
    ["strength-10", "🏋", "Iron Forge", "Log 10 completed strength workouts.", data.training?.history?.length || 0, 10, "workouts"],
    ["cardio-10", "⚡", "Pulse Runner", "Log 10 cardio sessions.", data.training?.cardio?.length || 0, 10, "sessions"],
    ["level-10", "💠", "Ascendant", "Reach player level 10.", data.player.level || 0, 10, "levels"]
  ];
}

function recordMilestoneAchievements(data) {
  const earned = data.achievements || [];
  const ids = new Set(earned.map(badge => badge.id));
  const unlockedAt = new Date().toISOString();
  const additions = getAchievementGoals(data)
    .filter(([id, , , , progress, target]) => !ids.has(id) && progress >= target)
    .map(([id, , title, description]) => ({ id, title, description, unlockedAt }));
  return additions.length ? [...earned, ...additions] : earned;
}
