function renderSettings() {
  document.getElementById("settings-guidance-mode").value =
    state.settings.guidanceMode;

  document.getElementById("settings-units").value =
    state.settings.units;

  document.getElementById("settings-week-start").value =
    state.settings.weekStartsOn;

  document.getElementById("settings-body-checkin-day").value =
    state.settings.bodyCheckInDay;

  document
    .querySelectorAll(".training-days-options input[type='checkbox']")
    .forEach(input => {
      input.checked = state.settings.trainingDays.includes(input.value);
    });
    document.getElementById("settings-mode-badge").textContent =
  `MODE: ${state.settings.guidanceMode}`;

document.getElementById("settings-units-badge").textContent =
  `UNITS: ${state.settings.units.toUpperCase()}`;

document.getElementById("settings-checkin-badge").textContent =
  `CHECK-IN: ${state.settings.bodyCheckInDay.slice(0, 3).toUpperCase()}`;
}
