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
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (
      !imported ||
      imported.app !== "AKOS SYSTEM" ||
      !imported.state ||
      typeof imported.state !== "object"
    ) {
      throw new Error("Invalid AKOS SYSTEM save file.");
    }

    const confirmed = window.confirm(
      "IMPORT SYSTEM SAVE?\n\n" +
      "This will replace your current Player progress with the selected backup."
    );

    if (!confirmed) {
      return;
    }

    state = migrateState(imported.state);
    recalculateStreak();

    saveState();
    render();

    alert("SYSTEM SAVE RESTORED");
  } catch (error) {
    console.error("Import failed:", error);

    alert(
      "IMPORT FAILED\n\nThe selected file is not a valid AKOS SYSTEM save."
    );
  }
}

const questStatInput = document.getElementById("questStatInput");
const questStatXpInput = document.getElementById("questStatXpInput");
