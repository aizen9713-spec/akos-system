function getWeekdayKey(date = new Date()) {
  const dayIndex = date.getDay();

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  return days[dayIndex];
}

function createDailyQuests(date = new Date()) {
  const weekdayKey = getWeekdayKey(date);
  const template = WEEKLY_QUESTS[weekdayKey] || [];

  return template.map(quest => ({
    id: crypto.randomUUID(),
    title: quest.title,
    xp: quest.xp,
    completed: false,
    statRewards: structuredClone(quest.statRewards || {}),
    skillRewards: structuredClone(quest.skillRewards || {})
  }));
}
