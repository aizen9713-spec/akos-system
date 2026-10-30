/* Device appearance never writes player saves, XP, quests or backups. */
(() => {
  "use strict";
  const KEY = "shadow-os-appearance-v1";
  const themes = ["shadow-blue", "imperial-gold", "crimson-black"];
  const backgrounds = ["minimal-hud", "shadow-core", "cinematic-transmission"];
  const defaults = { theme: "shadow-blue", background: "cinematic-transmission" };
  const colors = { "shadow-blue": "#070b14", "imperial-gold": "#100d07", "crimson-black": "#10080b" };
  function normalize(value) {
    return {
      theme: themes.includes(value?.theme) ? value.theme : defaults.theme,
      background: backgrounds.includes(value?.background) ? value.background : defaults.background
    };
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch { return { ...defaults }; }
  }
  let appearance = load();
  function apply() {
    document.documentElement.dataset.theme = appearance.theme;
    document.documentElement.dataset.background = appearance.background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors[appearance.theme]);
  }
  // Restore before styles paint to avoid a blue flash on reload.
  apply();
  document.addEventListener("DOMContentLoaded", () => {
    const theme = document.getElementById("appearance-theme");
    const background = document.getElementById("appearance-background");
    const status = document.getElementById("appearance-status");
    function sync() {
      theme.value = appearance.theme;
      background.value = appearance.background;
      apply();
    }
    function save() {
      sync();
      try {
        localStorage.setItem(KEY, JSON.stringify(appearance));
        status.textContent = "Appearance saved on this device.";
      } catch {
        status.textContent = "Appearance applied for this session. Device storage is unavailable.";
      }
    }
    theme.addEventListener("change", () => {
      appearance = normalize({ ...appearance, theme: theme.value });
      save();
    });
    background.addEventListener("change", () => {
      appearance = normalize({ ...appearance, background: background.value });
      save();
    });
    document.getElementById("appearance-reset").addEventListener("click", () => {
      appearance = { ...defaults };
      save();
    });
    window.addEventListener("storage", event => {
      if (event.key === KEY || event.key === null) {
        appearance = load();
        sync();
        status.textContent = "Appearance synchronized with this device.";
      }
    });
    sync();
  });
})();
