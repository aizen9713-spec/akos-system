
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