function exportSave() {
  const saveData = {
    saveVersion: 1,
    app: "AKOS SYSTEM",
    exportedAt: new Date().toISOString(),
    state: state
  };

  const json = JSON.stringify(saveData, null, 2);

  const blob = new Blob([json], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    "akos-system-save-" +
    new Date().toISOString().slice(0, 10) +
    ".json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}


async function importSave(file) {
  const stateBeforeImport = state;
  const storedBeforeImport = localStorage.getItem(STORAGE_KEY);
  let wroteImport = false;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (
      !imported ||
      imported.saveVersion !== 1 ||
      Array.isArray(imported.state) ||
      imported.app !== "AKOS SYSTEM" ||
      !imported.state ||
      typeof imported.state !== "object"
    ) {
      throw new Error("Invalid AKOS SYSTEM save file.");
    }

    if (imported.state.training !== undefined) TrainingData.validate(imported.state.training);

    const confirmed = window.confirm(
      "IMPORT SYSTEM SAVE?\n\n" +
      "This will replace your current Player progress with the selected backup."
    );

    if (!confirmed) {
      return;
    }

    const previousState = state;
    state = migrateState(imported.state);
    // Older system backups have no Training field: retain current workouts.
    if (imported.state.training === undefined && previousState.training) state.training = structuredClone(previousState.training);
    recalculateStreak();

    saveState();
    wroteImport = true;
    render();

    alert("SYSTEM SAVE RESTORED");
  } catch (error) {
    state = stateBeforeImport;
    if (wroteImport) {
      try {
        if (storedBeforeImport === null) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, storedBeforeImport);
      } catch (restoreError) { console.error("Storage rollback failed", restoreError); }
    }
    console.error("Import failed:", error);

    alert(
      "IMPORT FAILED\n\nThe selected file is not a valid AKOS SYSTEM save."
    );
  }
}

const questStatInput = document.getElementById("questStatInput");
const questStatXpInput = document.getElementById("questStatXpInput");
