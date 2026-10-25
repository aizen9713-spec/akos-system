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