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
