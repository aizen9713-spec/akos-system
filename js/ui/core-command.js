const CoreCommand = (() => {
  const el = id => document.getElementById(id);
  const root = el("coreCommand");
  const form = el("corePlanForm");
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const fields = [...form.querySelectorAll("[data-priority]")];
  const esc = value => escapeHtml(String(value ?? ""));
  const dateLabel = date => dateKeyToLocalDate(date).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short"
  });
  let active = "daily";
  let dirty = false;
  let editingDay, editingSnapshot;
  let automatic = true;
  let writing = false;
  let conflict = false;

  function plan(date) {
    return CoreCommandData.validate(state.corePlan ?? CoreCommandData.empty()).days[date] ?? null;
  }

  function entries(date) {
    return [...CalendarData.entries(state, date), ...HungarianCalendar.forDate(date)]
      .sort((left, right) => (left.time || "").localeCompare(right.time || ""));
  }

  function deadlines(today, until) {
    return (state.calendar?.events || []).filter(row => row.kind === "quest" && row.date <= until &&
      (!row.completed || row.date >= today))
      .sort((left, right) => (left.date + left.time).localeCompare(right.date + right.time));
  }

  function list(id, rows, empty, label) {
    el(id).innerHTML = rows.length ? "<ul>" + rows.map(row =>
      "<li><strong>" + esc(row.title) + "</strong><small>" + esc(label(row)) + "</small></li>"
    ).join("") + "</ul>" : '<p class="muted">' + esc(empty) + "</p>";
  }

  function entryLabel(row) {
    return [row.time || "All day", row.source, row.completed ? "Done" : ""].filter(Boolean).join(" · ");
  }

  function suggested(today, rows) {
    const quests = state.activeDay === today ? state.quests : [];
    return CoreCommandData.suggestions(quests, rows, deadlines(today, today));
  }

  function loadForm(today, rows) {
    const saved = plan(today);
    editingDay = today;
    editingSnapshot = JSON.stringify(saved);
    el("coreFocus").value = saved?.focus || "";
    automatic = saved?.priorities == null;
    const priorities = automatic ? suggested(today, rows) : saved.priorities;
    fields.forEach((input, index) => { input.value = priorities[index] || ""; });
    el("corePriorityMode").textContent = automatic ? "Suggested" : "Manual";
    dirty = false;
    conflict = false;
  }

  function renderDaily(today) {
    const rows = entries(today);
    const quests = state.activeDay === today ? state.quests : [];
    const done = quests.filter(quest => quest.completed).length;
    const training = rows.filter(row => row.kind === "training");
    const due = deadlines(today, today);
    const suggestions = suggested(today, rows);
    el("coreDailyDate").textContent = dateLabel(today);
    el("coreFocusSuggestions").innerHTML = suggestions.map(title => '<option value="' + esc(title) + '"></option>').join("");
    if (!dirty) loadForm(today, rows);
    else if (editingDay !== today || editingSnapshot !== JSON.stringify(plan(today))) {
      conflict = true;
      el("corePlanStatus").textContent = "The day or saved plan changed. Reload the plan before saving.";
    }
    list("coreDailyCalendar", rows.filter(row => row.kind !== "training"), "No events for today.", entryLabel);
    list("coreDailyTraining", training, "No training logged or scheduled today.", entryLabel);
    list("coreDailyQuests", quests, "No current quests for this date.", row => row.completed ? "Completed" : "Open");
    list("coreDailyDeadlines", due, "No due or overdue quest deadlines.", row =>
      [dateLabel(row.date), row.time, row.completed ? "Done" : row.date < today ? "Overdue" : "Due today"].filter(Boolean).join(" · "));
    const savedFocus = plan(today)?.focus;
    el("coreLiveTransmission").textContent =
      quests.length ? done + " of " + quests.length + " quests completed today. " +
        (savedFocus ? "Your focus: " + savedFocus : suggestions[0] ? "Suggested next move: " + suggestions[0] : "All current quests are complete.") :
        savedFocus ? "Your focus: " + savedFocus :
          rows.length ? "Your calendar has " + rows.length + " entries today. Review your agenda to choose your focus." :
            "There are no saved quests or calendar entries for today. Set a focus when you are ready.";
  }

  function renderWeekly(today) {
    const weekOffset = state.settings?.weekStartsOn === "sunday" ? 0 : 6;
    const start = addDaysToDateKey(today, -(dateKeyToLocalDate(today).getDay() + weekOffset) % 7);
    const dates = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(start, index));
    const end = dates[6];
    const totals = CoreCommandData.questTotals(state, dates, today);
    const training = state.training || {};
    const within = row => row.date >= start && row.date <= end && row.date <= today;
    const strength = (training.history || []).filter(within).length;
    const cardio = (training.cardio || []).filter(within).length;
    const recovery = (training.recovery || []).filter(within).length;
    el("coreWeekDate").textContent = dateLabel(start) + " – " + dateLabel(end);
    el("coreWeekQuests").textContent = totals.done + " / " + totals.total + " completed";
    el("coreWeekTraining").textContent = strength + " strength · " + cardio + " cardio";
    el("coreWeekRecovery").textContent = recovery + " recovery check-ins logged";
    const agendaDates = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, index));
    const agenda = agendaDates.flatMap(date => entries(date).map(row => ({ ...row, date })));
    list("coreUpcoming", agenda, "No entries in the next 7 days.", row => dateLabel(row.date) + " · " + entryLabel(row));
    list("coreWeekDeadlines", deadlines(today, end), "No deadlines through the end of this week.", row =>
      dateLabel(row.date) + (row.time ? " · " + row.time : "") + (row.completed ? " · Done" : row.date < today ? " · Overdue" : ""));
    const milestones = (state.achievements || []).filter(row => {
      const date = new Date(row.unlockedAt);
      return Number.isFinite(date.getTime()) && within({ date:
        date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0")
      });
    });
    list("coreWeekMilestones", milestones, "No milestones earned this week.", row => row.description);
    const openDays = agendaDates.filter(date => !agenda.some(row => row.date === date && !row.official && !row.completed));
    list("coreWeekOpenDays", openDays.map(date => ({ title: dateLabel(date) })), "Each of the next 7 days has an open calendar entry.", () => "No open calendar or training entries");
  }

  function render() {
    el("corePlayerRank").textContent = state.player.rank || "Unassigned";
    try {
      if (active === "daily") renderDaily(getDateKey());
      if (active === "weekly") renderWeekly(getDateKey());
      el("coreCommandError").textContent = "";
    } catch (error) {
      el("coreCommandError").textContent = "Unable to show CORE data: " + error.message;
    }
  }

  function select(name, focus) {
    active = name;
    tabs.forEach(tab => {
      const selected = tab.dataset.coreTab === name;
      tab.setAttribute("aria-selected", selected);
      tab.tabIndex = selected ? 0 : -1;
      el(tab.getAttribute("aria-controls")).hidden = !selected;
      if (selected && focus) tab.focus();
    });
    render();
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab.dataset.coreTab));
    tab.addEventListener("keydown", event => {
      const index = tabs.indexOf(tab);
      const next = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.coreTab, true);
    });
  }

  form.addEventListener("input", event => {
    dirty = true;
    if (event.target.matches("[data-priority]")) automatic = false;
    el("corePriorityMode").textContent = automatic ? "Suggested" : "Manual";
  });
  el("coreUseSuggestions").onclick = () => {
    automatic = true;
    dirty = true;
    const suggestions = suggested(getDateKey(), entries(getDateKey()));
    fields.forEach((field, index) => { field.value = suggestions[index] || ""; });
    el("corePriorityMode").textContent = "Suggested";
  };
  el("coreReloadPlan").onclick = () => {
    loadForm(getDateKey(), entries(getDateKey()));
    el("corePlanStatus").textContent = "Saved plan loaded.";
  };
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (writing) return;
    writing = true;
    try {
      const today = getDateKey();
      if (conflict || today !== editingDay || editingSnapshot !== JSON.stringify(plan(today))) {
        throw Error("The day or saved plan changed. Reload the plan before saving.");
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && JSON.parse(raw).lastSavedAt !== state.lastSavedAt) {
        throw Error("A newer save exists in another tab. Reload before saving.");
      }
      const next = CoreCommandData.withDay(state, today, {
        focus: el("coreFocus").value.trim(),
        priorities: automatic ? null : fields.map(input => input.value.trim())
      }, new Date().toISOString());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      state = next;
      dirty = false;
      render();
      el("corePlanStatus").textContent = "Plan saved on this device. Cloud Sync will pick it up when connected.";
    } catch (error) {
      el("corePlanStatus").textContent = "Plan not saved. " + error.message;
    } finally {
      writing = false;
    }
  });

  el("coreNewQuest").onclick = () => {
    showPage("quests");
    el("questInput").focus();
  };
  el("coreNewEvent").onclick = () => {
    CalendarUI.openEvent(null, getDateKey());
    el("calendarNew").click();
  };
  el("coreOpenTraining").onclick = () => {
    showPage("workout");
    el("training-workspace").querySelector('[data-action="start"]:not(:disabled), [data-action="finish"], [data-action="new-plan"]')?.focus();
  };
  el("coreCheckIn").onclick = () => {
    showPage("recovery");
    el("recovery-workspace").querySelector("input")?.focus();
  };
  return { render };
})();
