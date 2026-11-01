# Theme Selector V1

Open CONFIG (Settings) > Theme & Background. Changes apply immediately; SAVE SETTINGS remains for the existing profile settings.

- Themes: Shadow Blue, Imperial Gold, Crimson Black.
- Backgrounds: Minimal HUD (quiet grid), Shadow Core (accent glow), Cinematic Transmission (existing illustration under a dark palette overlay).
- Any theme works with any background.
- Preferences use the separate `shadow-os-appearance-v1` localStorage key. They are device/browser specific and intentionally excluded from player export/import. Appearance selection and RESET APPEARANCE never write the player save, XP, quests, history or logs.
- Default: Shadow Blue + Cinematic Transmission. Invalid/missing preferences fall back safely. If storage is blocked, appearance works for the current session and reports that it could not save.
- Appearance is restored before CSS loads and synchronized across tabs. Keyboard focus, native accessible selects, touch targets and reduced motion are supported.
- Shared CSS tokens replace decorative blue literals throughout the existing UI. Semantic success, warning and danger colors remain recognizable.
- The service worker has a new cache version and precaches all split CSS/JS plus the background. Cache cleanup is restricted to this application's cache prefix.

## Manual acceptance check

1. Open the build served from develop. The main GitHub Pages deployment may still serve main; inspect repository Pages configuration before expecting the change there.
2. Open CONFIG > Theme & Background. Select each theme, and inspect dashboard cards, header, navigation, quests, modules and CONFIG for consistent accent and surface colors.
3. For each theme, select all three backgrounds (nine combinations). Theme changes must retain the chosen background; background changes must retain the theme.
4. Refresh and reopen CONFIG. Both selections must remain. No SAVE SETTINGS click is required.
5. On mobile, test portrait and landscape, scrolling and select interaction. At 320px width there should be no horizontal page overflow.
6. Open a second tab on the same origin. Change appearance in one tab and confirm the other follows.
7. Click RESET APPEARANCE. Only appearance returns to defaults; existing player progress must remain.
8. Install/update the PWA. If an update banner appears, apply it. Load online once, then go offline and reload. Confirm CONFIG and all appearance combinations still work.
9. Test keyboard Tab and arrow selection, and the device's reduced-motion setting.

## Verification performed

Automated headless Chrome checks passed for all nine combinations, reload persistence, unchanged player-storage content during appearance changes, cross-tab sync, appearance reset, corrupt/invalid preferences and unavailable storage. Responsive widths checked: 320, 375, 768 and 1440px. No page errors occurred in normal operation. Screenshots reviewed for desktop and mobile. Service-worker precache installation, offline reload, offline theme/background changes and persistence also passed.

Player storage, backup/import, progression and quest modules were not changed. Tests used a fresh isolated browser profile on localhost, never the user's live save.
