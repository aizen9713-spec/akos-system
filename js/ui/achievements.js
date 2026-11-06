function renderAchievements() {
  const list = document.getElementById("achievementList");
  if (!list) return;

  const saved = new Map(state.achievements.map(badge => [badge.id, badge]));
  const goals = getAchievementGoals(state);
  const badges = goals.map(([id, icon, title, description, progress, target, unit]) => ({
    icon, title, description, progress, target, unit, unlocked: progress >= target || saved.has(id), earned: saved.get(id)
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
    const date = badge.earned?.unlockedAt ? new Date(badge.earned.unlockedAt) : null;
    const earnedDate = date && Number.isFinite(date.getTime()) ? " · " + date.toLocaleDateString() : "";
    return `<details class="player-badge">
      <summary title="${title} · ${description}" aria-label="${title} · ${progress}">
        <span aria-hidden="true">${badge.icon}</span>
      </summary>
      <div class="player-badge-info"><strong>${title}</strong><span>${description}</span><small>${progress}${escapeHtml(earnedDate)}</small></div>
    </details>`;
  }

  const unlocked = badges.filter(badge => badge.unlocked);
  const locked = badges.filter(badge => !badge.unlocked);
  const next = locked.reduce((closest, badge) =>
    !closest || badge.progress / badge.target > closest.progress / closest.target ? badge : closest, null);
  const remaining = next ? next.target - next.progress : 0;
  const nextMarkup = next ? `<div class="player-next-milestone">
    <span class="eyebrow">NEXT MILESTONE</span>
    <strong>${next.icon} ${escapeHtml(next.title)}</strong>
    <progress value="${next.progress}" max="${next.target}" aria-label="${escapeHtml(next.title)} progress"></progress>
    <small>${next.progress} / ${next.target} · ${remaining} ${remaining === 1 ? next.unit.slice(0, -1) : next.unit} to go</small>
  </div>` : '<p class="muted">All milestones unlocked.</p>';
  list.innerHTML = `<div class="player-badge-strip">${unlocked.map(badgeMarkup).join("") || '<p class="muted">No badges unlocked yet.</p>'}</div>
    ${nextMarkup}
    ${locked.length ? `<details class="player-badge-goals"><summary>Available goals · ${locked.length}</summary><div class="player-badge-strip locked">${locked.map(badgeMarkup).join("")}</div></details>` : ""}`;
}
