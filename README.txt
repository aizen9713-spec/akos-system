ÁKOS SYSTEM v0.1.0

FILES
- index.html: the visible structure of the app
- styles.css: visual design
- app.js: XP, level, quest and local-save logic
- manifest.webmanifest: makes the web app installable as a PWA
- sw.js: offline cache / service worker
- icon.svg: app icon

QUICK TEST ON PC
1. Open this folder in Visual Studio Code.
2. Use a local web server such as Live Server, or run:
   python -m http.server 8000
3. Open http://localhost:8000

WHY NOT DOUBLE-CLICK index.html?
Most features work, but service workers/PWA installation require http(s) or localhost.

CURRENT STATE
- Player: Ákos
- Level: 1
- XP: 50/100
- Title: THE MAIN CHARACTER
- Arc: VILLAIN ORIGIN
- NO ZERO DAYS: 1/7

IMPORTANT
Quest completion awards XP only once.
State is stored in the browser using localStorage.
Reset deletes the local save.

NEXT BUILD
v0.2: stats, skill tree, achievements, daily-date reset and stronger quest validation.
