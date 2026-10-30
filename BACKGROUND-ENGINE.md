# SHADOW OS Background Engine V1.1

## Changes

- CONFIG > Theme & Background keeps separate Theme and Background selectors.
- Adds Shadow Gold and Shadow Blue cinematic colorways alongside the three existing backgrounds.
- Adds a labeled keyboard/touch accessible 0–100% Background visibility slider, live percentage output, default 60%.
- A fixed decorative body pseudo-element renders the wallpaper with cover/center cropping on desktop and mobile. Only that layer receives opacity and color filters; text and controls do not.
- Content cards, header and navigation use 93–97% dark theme surfaces independently from wallpaper visibility. The image is brighter in open areas while text remains readable at 100%.
- Retains the existing shadow-os-appearance-v1 preference key. Existing selections migrate in place with visibility=60. Invalid values fall back safely; numeric visibility is rounded/clamped. Reload, cross-tab synchronization, reset and unavailable-storage feedback include visibility.
- No player save, backup, XP, quest or progression code changes. No new network asset dependencies.
- Service worker cache advances to akos-system-background-v1.1; the existing illustration remains precached.

## Artwork provenance and limitation

The referenced conversation exposed only a screenshot of the previous interface, not the generated gold/blue wallpaper originals. The repository contains system-bg.png. Gold and Blue deliberately reuse that illustration through separate fixed CSS color filters; they are NOT the previously generated new artworks. The UI says this. No screenshot was used as wallpaper. When the original files are supplied, replace the colorway background URLs and remove their filters; add those files to sw.js ASSETS. The rest of the engine needs no change.

## Architectural rationale

A Theme a felület színpalettáját vezérli, a Background külön a díszítő képréteget. A két választás és a láthatóság ugyanabban az elkülönített megjelenési rekordban marad, ezért kompatibilis a korábbi változattal, és nem érinti a játékmentést. A kép egyetlen rögzített CSS rétegen jelenik meg; az áttetszőség és a szűrő csak erre hat. A kártyák saját sötét felülete biztosítja az olvashatóságot, így nem kell az egész háttérképet elhalványítani. A meglévő képfájl újrafelhasználása nem növeli a letöltési méretet, és offline is működik.

## Verification performed

Headless Chrome, isolated fresh profiles, local static server:

- 15 theme/background combinations, reload persistence and player-storage equality.
- Slider values 0, 35, 100: output, computed layer opacity, persistence and unchanged player storage.
- Old two-field preferences retain theme/background and receive visibility 60; out-of-range, nonnumeric, null, corrupt and invalid preferences checked.
- Cross-tab theme and visibility synchronization; theme changes preserve background and visibility and do not recolor the fixed gold/blue filters.
- 320, 375, 768, 1440px viewport widths without horizontal overflow; desktop/mobile screenshots reviewed.
- Reset, unavailable storage and normal-operation page errors checked.
- Service worker precache installation, offline reload, preference changes and persistence passed.

## User acceptance

1. Serve the develop branch. The main deployment does not automatically include these changes.
2. Open CONFIG > Theme & Background. Choose Shadow Gold or Shadow Blue, then change Theme: the background selection and its coloration must remain independent.
3. Move Background visibility from 0 to 100. It updates immediately. Inspect CORE, QUESTS, PLAYER and MODULES: open areas show the image; cards remain dark and readable.
4. Reload, and open a second tab on the same origin: selections and percentage persist and synchronize without SAVE SETTINGS.
5. Test phone portrait and landscape, slider touch/keyboard control, and scrolling. Cover cropping is intentional on narrow screens.
6. After a PWA update, use UPDATE NOW when offered. Load once online, then reload offline. The wallpaper and settings must still work.
7. RESET APPEARANCE restores Shadow Blue theme, Cinematic Transmission and 60%, without resetting player progress.
