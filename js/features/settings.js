function saveSettingsFromForm() {
  state.settings.guidanceMode =
    document.getElementById("settings-guidance-mode").value;

  state.settings.units =
    document.getElementById("settings-units").value;

  state.settings.weekStartsOn =
    document.getElementById("settings-week-start").value;

  state.settings.bodyCheckInDay =
    document.getElementById("settings-body-checkin-day").value;

    state.settings.trainingDays = Array.from(
  document.querySelectorAll(
    ".training-days-options input[type='checkbox']:checked"
  )
).map(input => input.value);

  saveState();
  render();

  state.log.unshift({
    id: crypto.randomUUID(),
    text: "[SYSTEM] Settings updated."
  });

  saveState();
  render();
  const saveButton = document.getElementById("save-settings-btn");

saveButton.textContent = "SAVED ✓";
saveButton.classList.add("is-saved");

setTimeout(() => {
  saveButton.textContent = "SAVE SETTINGS";
  saveButton.classList.remove("is-saved");
}, 1200);
}
