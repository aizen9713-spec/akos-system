# Push Notifications V1 — checkpoint, NOT LIVE

Date: 2026-11-02. Branch: develop. Main must remain 04e6599cb39d3e435394f6b150dddac8d887a75c unless separately approved.

## Current status
Implementation is saved and locally testable. NO Supabase project was supplied (user replied that no test project exists). NO migration, Edge Function, Cron job, VAPID key or push subscription was installed on a live backend. Real phone delivery is NOT verified. Do not describe this as completed/activated push.

## Audit
main, origin/main, develop and origin/develop started at 04e6599. Existing local document moves (QUEST-UNDO.md, QUEST-V2-BUILD1.md, TRAINING-BUILD2.md into Ai work), Quest exports, and work/ remain untouched/uncommitted. Existing app had a PWA/service worker, Calendar JSON/full-save integration, account-scoped Supabase CAS sync, but no Push API receiver/sender/scheduler. No Supabase CLI/Deno/Docker deployment tooling was initially present. Reused Cloud Core authentication and cloud save; no second event source or token store.

## Implemented
- Calendar event optional notification object: offsetMinutes null/0/5/15/30/60/1440, timeZone (IANA), allDayTime. Legacy events remain unmodified/opted out. New timed events suggest 30 minutes. All-day events use an explicit 09:00 default anchor if enabled. DST nonexistent wall times rejected, repeated wall times use the later instant.
- English Monarch Settings > Notifications, collapsed by default: explicit permission action, registration state, test, disable, diagnostic summary. Permission denial/backend absence does not break app use. Cloud credentials reused via narrow CloudNotifications bridge; raw tokens never exposed by the bridge or copied into a new store.
- Device-only browser preferences and service-worker IndexedDB keep opt-in/account state and dedup receipts. No event/save duplication. Disable/logout blocks local display, unsubscribes, attempts server cleanup, closes existing Shadow notifications.
- Existing SW imports push-worker.js while retaining offline/update/cache behavior. Push receiver, durable receipt guard, account guard, expiration check, safe Calendar click routing, foreground window focus and closed-window deep link.
- SQL migration projects the existing shadow_cloud_saves payload into scheduling jobs after CAS writes. No new primary Calendar event table. Includes RLS, own-account device registration, limit 20 enabled devices, per-job/device unique deliveries, claim tokens/SKIP LOCKED, update/delete cancellation, expired endpoint/key scrubbing, maintenance retention. Malformed reminder data does not abort otherwise valid save writes.
- Two Supabase Edge Function entrypoints: authenticated user/device API and server-secret-only dispatcher. Restricted CORS, provider endpoint allowlist, no user-controlled outbound URL, private VAPID secrets only server-side. Pinned web-push 3.6.7 transport, encrypted payloads. Dispatcher sends up to 32 deliveries with concurrency 8; Cron invocation template runs every minute.
- Retry only explicit rejected 429/503 responses, max 3 attempts. Timeout/crash/unknown outcomes become uncertain and are NOT automatically resent; this prioritizes avoiding duplicates over pretending exactly-once delivery can be guaranteed. Browser durable dedup adds another guard. Existing in-flight pushes can still arrive just after an edit/disable.
- Notifications are scheduled only after full-save Cloud Sync succeeds. Unsynced/offline edits cannot change server jobs until reconnect. Reminders expire at the earlier of 10 minutes after due time or 5 minutes after event time.
- Existing focusout sync was narrowed to genuinely edited non-Cloud fields, removing a race found during browser testing between Cloud choice buttons and an unnecessary focusout sync.

## Verification (local)
- 20 test files PASS via node tests/run.cjs (npm test after npm ci).
- Real PostgreSQL engine (PGlite): migrations/functions, RLS/cross-account isolation, CAS projection, multi-device claims, retry/410 cleanup, edit/delete cancellation, DST parity, invalid-data save preservation, 20-device limit, crashed-dispatch uncertainty.
- Runtime-neutral Edge handlers: Auth lookup, origin/SSRF checks, RPC auth, real VAPID/aes128gcm request generation, safe errors, expired/retry/unknown outcomes. No real provider endpoint contacted.
- Service worker: fake-indexeddb tests for opt-in, persistent dedup, account/logout gates and safe routing.
- Real isolated Chrome + actual service worker/IndexedDB, with browser permission/subscription and Cloud/provider network MOCKED: no unsolicited prompt, denial-safe, missing-backend handling without losing Cloud login, register/test/disable/logout, 30-minute suggestion, explicit all-day anchor, legacy opt-out after editing, Calendar foreground deep link, 320px layout. tests/push-browser.integration.cjs is reproducible (npm run test:browser after installing Playwright Chromium, or set PUSH_TEST_CHROME).
- Existing Quest/Training/Cloud/save/offline regressions PASS. Last log: work/push-tests-final.log.
- Deno Edge entrypoints, pg_cron/pg_net/Vault scheduling and real Supabase Auth/RLS have NOT been deployed or tested on Supabase. Android Chrome/installed PWA and iOS physical delivery with app closed have NOT been tested. These are mandatory before release.

## Resume here
1. Create/identify a dedicated Supabase TEST project and an HTTPS app test origin. Do not reuse production silently. Follow supabase/PUSH-DEPLOY.md.
2. Install existing cloud-core.sql only on a fresh project; do not rerun it over existing tables. Apply migration with a backup and inspect RLS.
3. Generate project-specific VAPID/Cron secrets locally using scripts/create-push-secrets.cjs. Keep .env.push.local private; it is ignored. Configure server secrets/origin allowlist and deploy functions. Verify Deno runtime/type compatibility.
4. Install Vault values/Cron schedule only after authenticated API checks. Confirm unauthorized requests fail. Check actual provider subscription hosts against the endpoint allowlist.
5. Test two real devices on same user, another user isolation, app closed/background, 30-minute/at-time/all-day reminders, edit/delete, offline reconnect, permission denial/revocation, expired subscription, logout/account switch, test throttling, retry and duplicate prevention. Check Cron logs and diagnostic failure counts.
6. Re-run npm test and npm run test:browser. Record real delivery evidence and any fixes. Main requires separate user PASS. No automatic continuation/reminder has been scheduled.

## Limits to keep explicit
Exactly-once network delivery and exact-second phone display are not promised. OS force-stop, battery restrictions, Focus/Do Not Disturb and network can delay/prevent delivery. Chrome Android supports the standard Push API/service-worker approach; installed PWA should be tested on the user's phone. iPhone/iPad requires 16.4+ and Home Screen web app. Notifications remain unavailable until the server side is actually installed.

Primary references checked during audit:
https://web.dev/articles/push-notifications-overview
https://developer.mozilla.org/en-US/docs/Web/API/Push_API
https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
https://supabase.com/docs/guides/functions/auth
https://supabase.com/docs/guides/functions/schedule-functions
https://github.com/web-push-libs/web-push
