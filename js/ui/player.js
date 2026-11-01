// Presentation only: progression and persistence remain in the existing core.
function renderPlayer() {
  const p = state.player;
  const needed = xpNeededForLevel(p.level);
  const coreValues = {
    corePlayerName: p.name, corePlayerTitle: p.title,
    corePlayerClass: p.class || "Unassigned", corePlayerArc: p.arc,
    corePlayerLevel: p.level, corePlayerXp: p.xp + " / " + needed + " XP",
    corePlayerPercent: Math.min(100, Math.round(p.xp / needed * 100)) + "%"
  };
  for (const [id, value] of Object.entries(coreValues)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  const coreFill = document.getElementById("corePlayerXpFill");
  if (coreFill) coreFill.style.width = Math.min(100, Math.max(0, p.xp / needed * 100)) + "%";
  document.getElementById("playerName").textContent = p.name;
  document.getElementById("playerTitle").textContent = p.title;
  document.getElementById("playerClass").textContent = p.class || "Unassigned";
  document.getElementById("playerArc").textContent = p.arc;
  document.getElementById("levelValue").textContent = p.level;
  document.getElementById("xpText").textContent = p.xp + " XP";
  document.getElementById("playerNextXp").textContent = needed + " XP";
  document.getElementById("playerRemainingXp").textContent = Math.max(0, needed - p.xp) + " XP";
  document.getElementById("streakValue").textContent = p.streak + " / " + getNextStreakMilestone(p.streak);
  const stats = document.getElementById("playerCoreStats");
  if (stats) stats.innerHTML = Object.entries(STAT_CONFIG).map(([key, config]) => {
    const level = state.statLevels?.[key] ?? 1;
    const xp = state.stats[key] ?? 0;
    return '<div class="ascension-stat"><span class="ascension-stat-icon" aria-hidden="true">' + escapeHtml(config.icon) + '</span><div><strong>' + escapeHtml(key.toUpperCase()) + '</strong><small>' + escapeHtml(config.name) + '</small></div><div class="ascension-stat-value"><strong>Lv.' + escapeHtml(String(level)) + '</strong><small>' + escapeHtml(String(xp)) + ' / ' + statXpNeededForLevel(level) + ' XP</small></div></div>';
  }).join("");
  const skills = document.getElementById("playerSkillMastery");
  if (skills) skills.innerHTML = Object.entries(state.skills || {}).map(([key, skill]) =>
    '<div class="ascension-skill"><span class="skill-icon" aria-hidden="true">' + skillIcon(key) + '</span><div><strong>' + escapeHtml(skill.name) + '</strong><small>' + escapeHtml(skill.rank) + ' · ' + escapeHtml(String(skill.xp)) + ' XP</small></div></div>'
  ).join("") || '<p class="muted">No skills recorded yet.</p>';
}

function renderStats() {
  const stats = state.stats;

  const statMap = {
    str: { value: "strValue", fill: "strFill" },
    end: { value: "endValue", fill: "endFill" },
    int: { value: "intValue", fill: "intFill" },
    dis: { value: "disValue", fill: "disFill" },
    cha: { value: "chaValue", fill: "chaFill" },
    wis: { value: "wisValue", fill: "wisFill" },
    virtue: { value: "virtueValue", fill: "virtueFill" }
  };

  for (const [statKey, elements] of Object.entries(statMap)) {
    const xp = stats[statKey] || 0;

    const level = state.statLevels[statKey] || 1;
const needed = statXpNeededForLevel(level);

    const valueEl = document.getElementById(elements.value);
    const fillEl = document.getElementById(elements.fill);

    if (valueEl) {
      valueEl.textContent = `Lv.${level} · ${xp} / ${needed} XP`;
    }

    if (fillEl) {
      const percent = Math.min((xp / needed) * 100, 100);
      fillEl.style.width = `${percent}%`;
    }
  }
}