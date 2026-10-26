function detectNewDay() {
  const today = getDateKey();

  if (state.activeDay !== today) {
    console.log(
      `[SYSTEM] New day detected. ${state.activeDay} -> ${today}`
    );

    return true;
  }

  return false;
}

function archiveCurrentDay() {
  const dayKey = state.activeDay;

  const alreadyArchived = state.history.some(
    day => day.date === dayKey
  );

  if (alreadyArchived) {
    return false;
  }
  
  const questsSnapshot = structuredClone(state.quests);

  state.history.unshift({
    date: dayKey,
    totalQuests: questsSnapshot.length,
    completedQuests: questsSnapshot.filter(
      quest => quest.completed
    ).length,
    quests: questsSnapshot
  });

  return true;
}

function archiveMissedDay(dateKey) {
  const alreadyArchived = state.history.some(
    day => day.date === dateKey
  );

  if (alreadyArchived) {
    return false;
  }

  const missedDate = dateKeyToLocalDate(dateKey);
  const questsSnapshot = createDailyQuests(missedDate);

  state.history.unshift({
    date: dateKey,
    totalQuests: questsSnapshot.length,
    completedQuests: 0,
    quests: questsSnapshot
  });

  return true;
}

function repairMissingHistoryDays() {
  if (!Array.isArray(state.history) || state.history.length === 0) {
    return 0;
  }

  const archivedDates = state.history
    .map(day => day.date)
    .filter(Boolean)
    .sort();

  const lastArchivedDate =
    archivedDates[archivedDates.length - 1];

  let cursor =
    addDaysToDateKey(lastArchivedDate, 1);

  let repairedCount = 0;

  while (cursor < state.activeDay) {
    if (archiveMissedDay(cursor)) {
      repairedCount += 1;
    }

    cursor = addDaysToDateKey(cursor, 1);
  }

  if (repairedCount > 0) {
    recalculateStreak();
    saveState();
  }

  return repairedCount;
}

function updateStreakFromArchivedDay() {
  const archivedDay = state.history[0];

  if (!archivedDay) {
    return false;
  }

  if (archivedDay.completedQuests > 0) {
    state.player.streak += 1;
  } else {
    state.player.streak = 0;
  }

  return true;
}

function recalculateStreak() {
  const activeDates = state.history
    .filter(day => day.completedQuests > 0)
    .map(day => day.date)
    .sort();

  state.player.totalActiveDays = activeDates.length;

  let bestStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  activeDates.forEach(dateKey => {
    const currentDate = new Date(`${dateKey}T12:00:00`);

    if (!previousDate) {
      runningStreak = 1;
    } else {
      const expectedNextDate = new Date(previousDate);
      expectedNextDate.setDate(expectedNextDate.getDate() + 1);

      const expectedKey = `${expectedNextDate.getFullYear()}-${String(
        expectedNextDate.getMonth() + 1
      ).padStart(2, "0")}-${String(
        expectedNextDate.getDate()
      ).padStart(2, "0")}`;

      if (dateKey === expectedKey) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    previousDate = currentDate;
  });

  state.player.bestStreak = bestStreak;

  let currentStreak = 0;

  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");

    const dateKey = `${year}-${month}-${day}`;

    if (activeDates.includes(dateKey)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  state.player.streak = currentStreak;
}

function startNewDay() {
  const today = getDateKey();

  state.activeDay = today;

 const transmissionCount =
  DAILY_TRANSMISSION_CATEGORIES.reduce(
    (total, category) =>
      total + DAILY_TRANSMISSIONS[category].length,
    0
  );

state.dailyMessageIndex =
  (state.dailyMessageIndex + 1) % transmissionCount;
  
  state.quests = createDailyQuests();

  saveState();

  return true;
}

function handleDayRollover() {
  if (!detectNewDay()) {
    return false;
  }

  const previousActiveDay = state.activeDay;
  const today = getDateKey();

  archiveCurrentDay();

  let missedDay = addDaysToDateKey(previousActiveDay, 1);

  while (missedDay < today) {
    archiveMissedDay(missedDay);
    missedDay = addDaysToDateKey(missedDay, 1);
  }

  recalculateStreak();
  checkNoZeroDaysAchievement();

  startNewDay();
  render();

  return true;
}
