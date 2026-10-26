function renderSystemHealth() {
  const appVersion = document.getElementById("health-app-version");
  const activeDay = document.getElementById("health-active-day");
  const storage = document.getElementById("health-storage");
  const network = document.getElementById("health-network");
  const lastSave = document.getElementById("health-last-save");
  const status = document.getElementById("health-status");

  const hasStorage = !!localStorage.getItem(STORAGE_KEY);
  const isOnline = navigator.onLine;
  const isStable = !!state.activeDay && hasStorage;

  appVersion.textContent = "BETA 0.1";
  activeDay.textContent = state.activeDay || "—";

  storage.textContent = hasStorage ? "ONLINE" : "OFFLINE";
  storage.className = hasStorage
    ? "health-live health-online"
    : "health-live health-offline";

  network.textContent = isOnline ? "ONLINE" : "OFFLINE";
  network.className = isOnline
    ? "health-live health-online"
    : "health-live health-offline";

  if (state.lastSavedAt) {
    const savedDate = new Date(state.lastSavedAt);

    lastSave.textContent = savedDate.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } else {
    lastSave.textContent = "—";
  }

  status.textContent = isStable ? "STABLE" : "CHECK";
  status.className = isStable
    ? "health-live health-online"
    : "health-live health-warning";
}
