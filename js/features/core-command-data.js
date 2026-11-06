/* CORE V2 reads existing save data and stores only the editable daily plan. */
const CoreCommandData = (() => {
  const empty = () => ({ version: 1, days: {} });
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const validText = value => typeof value === "string" && value.length <= 150;

  function validate(plan) {
    if (!plan || plan.version !== 1 || !plan.days || typeof plan.days !== "object" || Array.isArray(plan.days)) {
      throw Error("Invalid CORE daily plan.");
    }
    for (const [date, day] of Object.entries(plan.days)) {
      if (!validDate(date) || !day || !validText(day.focus) ||
          !(day.priorities === null || (Array.isArray(day.priorities) &&
            day.priorities.length === 3 && day.priorities.every(validText)))) {
        throw Error("Invalid CORE plan entry.");
      }
    }
    return plan;
  }

  function withDay(save, date, day, lastSavedAt) {
    const current = validate(save.corePlan ?? empty());
    const corePlan = validate({ version: 1, days: { ...current.days, [date]: day } });
    return { ...save, corePlan, lastSavedAt };
  }

  function suggestions(quests, entries, deadlines) {
    const open = quests.filter(quest => !quest.completed);
    const linked = new Set(open.map(quest => quest.id));
    const ordered = [
      ...deadlines.filter(entry => !entry.completed && (!entry.questId || linked.has(entry.questId))),
      ...entries.filter(entry => !entry.completed && !entry.official && entry.kind !== "quest"),
      ...open
    ];
    return [...new Set(ordered.map(row => row.title?.slice(0, 150)).filter(Boolean))].slice(0, 3);
  }

  function questTotals(save, dates, today) {
    const inWeek = new Set(dates);
    const days = new Map((save.history || []).filter(day => inWeek.has(day.date) && day.date < today)
      .map(day => [day.date, { done: day.completedQuests || 0, total: day.totalQuests || 0 }]));
    if (inWeek.has(today) && save.activeDay === today) {
      const quests = save.quests || [];
      days.set(today, { done: quests.filter(quest => quest.completed).length, total: quests.length });
    }
    return [...days.values()].reduce((sum, day) => ({
      done: sum.done + day.done, total: sum.total + day.total
    }), { done: 0, total: 0 });
  }

  return { empty, validate, withDay, suggestions, questTotals };
})();
if (typeof module !== "undefined" && module.exports) module.exports = CoreCommandData;
