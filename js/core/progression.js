function xpNeededForLevel(level) {
  return 100 + (level - 1) * 50;
}

function statXpNeededForLevel(level) {
  return 100 + (level - 1) * 20;
}

function applyStatLevelUps(statKey) {
  if (state.stats[statKey] === undefined) return;
  if (state.statLevels[statKey] === undefined) return;

  let level = state.statLevels[statKey];
  let needed = statXpNeededForLevel(level);

  while (state.stats[statKey] >= needed) {
    state.stats[statKey] -= needed;
    state.statLevels[statKey] += 1;

    addLog(
      `[STAT LEVEL UP] ${statKey.toUpperCase()} reached Lv.${state.statLevels[statKey]}.`
    );

    level = state.statLevels[statKey];
    needed = statXpNeededForLevel(level);
  }
}

function applyLevelUps() {
  let needed = xpNeededForLevel(state.player.level);

  while (state.player.xp >= needed) {
    state.player.xp -= needed;
    state.player.level += 1;
    addLog(`[LEVEL UP] Player reached Level ${state.player.level}.`);
    needed = xpNeededForLevel(state.player.level);
  }
}