function getDateKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );
}

function addDaysToDateKey(dateKey, amount) {
  const date = dateKeyToLocalDate(dateKey);

  date.setDate(date.getDate() + amount);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMondayDateKey(dateKey) {
  const date = dateKeyToLocalDate(dateKey);

  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diffToMonday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${dayOfMonth}`;
}

function getHistoryWeekRange() {
  const currentMonday = getMondayDateKey(getDateKey());

  const startDate = addDaysToDateKey(
    currentMonday,
    historyWeekOffset * -7
  );

  const endDate = addDaysToDateKey(startDate, 6);

  return {
    startDate,
    endDate
  };
}


