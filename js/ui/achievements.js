function renderAchievements() {
  const list = document.getElementById("achievementList");
  if (!list) return;

  const saved = new Map(state.achievements.map(badge => [badge.id, badge]));
  const days = new Map(state.history.map(day => [day.date, day]));
  days.set(state.activeDay, {
    totalQuests: state.quests.length,
    completedQuests: state.quests.filter(quest => quest.completed).length
  });
  const recorded = [...days.values()];
  const streak = Math.max(state.player.streak || 0, state.player.bestStreak || 0);
  const goals = [
    ["no-zero-days", "🔥", "No Zero Days", "Reach a 7-day streak.", streak, 7],
    ["streak-14", "🛡", "Iron Will", "Reach a 14-day streak.", streak, 14],
    ["streak-30", "⛓", "Unbroken", "Reach a 30-day streak.", streak, 30],
    ["streak-60", "👑", "Monarch’s Resolve", "Reach a 60-day streak.", streak, 60],
    ["quest-100", "⚔", "Quest Vanguard", "Complete 100 quests across recorded days.", recorded.reduce((sum, day) => sum + (Number(day.completedQuests) || 0), 0), 100],
    ["perfect-10", "✦", "Flawless Ten", "Complete every quest on 10 days with at least one quest.", recorded.filter(day => day.totalQuests > 0 && day.completedQuests >= day.totalQuests).length, 10],
    ["strength-10", "🏋", "Iron Forge", "Log 10 completed strength workouts.", state.training?.history?.length || 0, 10],
    ["cardio-10", "⚡", "Pulse Runner", "Log 10 cardio sessions.", state.training?.cardio?.length || 0, 10],
    ["level-10", "💠", "Ascendant", "Reach player level 10.", state.player.level || 0, 10]
  ];
  const badges = goals.map(([id, icon, title, description, progress, target]) => ({
    icon, title, description, progress, target, unlocked: progress >= target || saved.has(id), earned: saved.get(id)
  }));
  const known = new Set(goals.map(([id]) => id));
  for (const earned of saved.values()) {
    if (!known.has(earned.id)) badges.push({
      icon: "◇", title: earned.title, description: earned.description, unlocked: true, earned
    });
  }

  function badgeMarkup(badge) {
    const title = escapeHtml(badge.earned?.title || badge.title);
    const description = escapeHtml(badge.earned?.description || badge.description);
    const progress = badge.unlocked ? "Unlocked" : `${Math.min(badge.progress, badge.target)} / ${badge.target}`;
    return `<details class="player-badge">
      <summary title="${title} · ${description}" aria-label="${title} · ${progress}">
        <span aria-hidden="true">${badge.icon}</span>
      </summary>
      <div class="player-badge-info"><strong>${title}</strong><span>${description}</span><small>${progress}</small></div>
    </details>`;
  }

  const unlocked = badges.filter(badge => badge.unlocked);
  const locked = badges.filter(badge => !badge.unlocked);
  list.innerHTML = `<div class="player-badge-strip">${unlocked.map(badgeMarkup).join("") || '<p class="muted">No badges unlocked yet.</p>'}</div>
    ${locked.length ? `<details class="player-badge-goals"><summary>Available goals · ${locked.length}</summary><div class="player-badge-strip locked">${locked.map(badgeMarkup).join("")}</div></details>` : ""}`;
}
