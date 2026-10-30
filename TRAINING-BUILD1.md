# Training System V1.0 — Build 1

Implemented: Workout Log + History. Tuesday / Thursday / Saturday starter plans, editable exercise names and sets, personal plan copies, per-set kg/reps/completion, dated draft autosave/resume, immutable completed snapshots, latest completed exercise sets prefill, history detail and volume/top-weight comparison. Starter exercises are placeholders, not a prescribed workout plan.

Training lives in the existing System save under `training`. Existing player, quest, XP, and daily history data are not changed by Training actions. Full System export includes Training. Importing an older System backup without Training retains current Training. Training JSON import merges history by ID, rejects conflicts, preserves current plan variants and drafts. No automatic XP or Quest completion is awarded.

Offline: the service worker precaches both Training scripts and styles. On localhost the app normally skips worker registration; production installs/update once online before using offline.

Automated browser checks, isolated Chrome profile, 2026-10-30:
- Plan edits, extra exercises and personal plans, dated workouts.
- Draft reload, pause/resume, completed-set prefill and unchecked reset.
- Historical snapshot remains unchanged after later plan/workout edits.
- Checked-only volume, top-weight progress, player/quest/stats/daily-history equality.
- 320/375/768/1440px views without horizontal overflow; mobile screenshot reviewed.
- Training JSON roundtrip/deduplication, malformed backup rejection, repeated plan import dedupe and conflicting historical IDs.
- Legacy full backup preservation, malformed full backup rejection.
- Invalid numerical input, storage-quota rollback, stale-tab overwrite prevention.
- Service worker offline reload and workout completion; no page errors.
- Background Gallery regression: 30 combinations, reload, keyboard, cross-tab, offline, storage preservation.

Download limitation: automated Chrome reports its download as cancelled. JSON Blob generation and import are tested. Export also exposes the exact JSON in a selected read-only text field as a fallback. Actual file download requires user acceptance testing. Do not claim a user PASS yet.

User acceptance:
1. Open MODULES > TRAINING > WORKOUT LOG. Edit each day plan with your actual exercises.
2. Start a workout, enter kg/reps, check completed sets. Reload: the same draft must resume.
3. Finish and inspect HISTORY. Change your plan: previous history must stay unchanged.
4. Start that plan again: previous completed weights/reps/set count preload, checkboxes clear.
5. Export JSON, verify the downloaded file (or copy the displayed JSON to a .json file). Reimport: no duplicate workouts.
6. Load once online and update the PWA; disconnect and verify workout logging/reload offline on your phone.
7. XP/quests must stay unchanged. Build 2 is Cardio + Recovery; integrations follow after acceptance.
