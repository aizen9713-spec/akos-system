# Push test deployment — not yet deployed

Start with the checkpoint in Ai work/PUSH-NOTIFICATIONS-V1-CHECKPOINT.md. Main is not approved. No server or Cron was activated in this development session.

## Prerequisites
Dedicated Supabase test project, authenticated test accounts, HTTPS test app origin, Supabase CLI with project access, Node 22+, and two test devices. Start with a database backup. Configure the app's existing Cloud Core against this test project, not another login system.

## Database
On a fresh project only, run supabase/cloud-core.sql first. On an existing project inspect the already-installed schema instead of rerunning CREATE TABLE. Apply supabase/migrations/202611020001_calendar_push.sql. Verify authenticated users see only their rows and cannot invoke claim/prepare/finish or write tables directly. Migration changes the existing cloud save by adding an AFTER trigger; it does not replace the CAS function. It backfills only explicit reminder settings already present in saves. Legacy events have no reminders.

## Server secrets
From repo root, run:

    node scripts/create-push-secrets.cjs contact=mailto:YOUR_REAL_CONTACT origins=https://YOUR_TEST_APP_ORIGIN

This creates .env.push.local without printing its contents. Never commit or paste it. The origin must contain no path (for GitHub Pages use the account origin). Import with:

    supabase secrets set --env-file .env.push.local --project-ref YOUR_TEST_PROJECT_REF

The function runtime supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. Keep the service-role key and VAPID private key off the browser. Do not rotate VAPID keys casually: existing subscriptions will need re-registration.

## Functions
Review supabase/config.toml. Both gateway verify_jwt flags are false deliberately: shadow-push verifies the bearer with Supabase Auth itself, while shadow-push-dispatch rejects calls without PUSH_CRON_SECRET. Deploy both, using the same test project:

    supabase functions deploy shadow-push --project-ref YOUR_TEST_PROJECT_REF --no-verify-jwt
    supabase functions deploy shadow-push-dispatch --project-ref YOUR_TEST_PROJECT_REF --no-verify-jwt

Check unauthorized request rejection, allowed origins, missing config, registration, disable and test throttling before scheduling. The actual Deno/npm runtime still needs verification on Supabase.

## Cron
Create Vault secrets using the dashboard (not a public SQL file):
- shadow_push_dispatch_url: https://YOUR_PROJECT.supabase.co/functions/v1/shadow-push-dispatch
- shadow_push_cron_secret: same private value as PUSH_CRON_SECRET

Only then apply supabase/push-schedule.sql. Cron calls the dispatcher every minute. Do not put browser access tokens or the service-role key in this job. Review cron.job_run_details, pg_net responses and Settings > Notifications diagnostics. To stop new scheduled invocations:

    select cron.unschedule('shadow-push-every-minute');

To suspend the feature safely, stop Cron, disable devices, and drop the shadow_push_after_save trigger if needed; leave the existing cloud save/CAS function untouched. Clearing app data alone does not deactivate a server subscription. In-flight provider messages may still arrive.

## Local tests
    npm ci
    npm test
    npx playwright install chromium
    npm run test:browser

On Windows you can set PUSH_TEST_CHROME to an installed Chrome executable instead. Browser tests mock permission, subscription and provider/Cloud responses while running real app/worker/IndexedDB. PostgreSQL tests use PGlite and real SQL; they do not validate a deployed Supabase project's infrastructure.

## Required real-device acceptance
Same account PC + Android Chrome/installed PWA; one notification per event/version/device; notifications while app closed; click correct event; at-time and 5/15/30/60/1440 minute choices; all-day anchor; DST; edit/delete; offline save/reconnect; deny/revoke permission; expired endpoint cleanup; disabled/logout device; different account isolation; test throttling; retry and crash/unknown outcomes. iOS/iPadOS requires 16.4+ and Home Screen installation. Record results before claiming complete or merging main.
