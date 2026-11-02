# SHADOW OS Push — deployed backend, device acceptance pending

Deployment date: 2026-11-02. Project: aizen9713-spec's Project (`uijkqeuuiihldvegkeso`). Main has not been changed.

## Installed and verified
- Existing Cloud Core save backed up privately before migration. Save count, full-row fingerprint and revision unchanged after migration.
- Push tables, own-user RLS policies, device RPC, schedule projection, claim/prepare/finish RPCs installed.
- VAPID and cron credentials generated locally, kept outside Git, installed as server secrets. No credential values included in this report.
- `shadow-push` and `shadow-push-dispatch` deployed using server-side bundling. Deno entrypoint checks pass.
- Dedicated Vault entries and `shadow-push-every-minute` Cron installed. First actual scheduled invocation succeeded with HTTP 200, no timeout/error.
- Deployed user API rejects unauthenticated requests (401). Dispatcher rejects missing cron authentication (401). Authenticated dispatcher returns 200, zero queued notifications, zero errors.
- 20 local test files passed before deployment; browser integration uses mocked permission/subscriptions/Cloud/provider and real app/SW/IndexedDB.

## Still required before claiming complete
- Register PC and phone from Settings > Notifications using the push-enabled develop client, signed into Cloud Core.
- Test notification, scheduled event while app closed, correct event click, edits/deletion, disable/logout and same-account multi-device delivery.
- No physical push subscription or phone delivery has been verified. The live GitHub Pages main client is unchanged and may not yet contain Notifications UI. Develop source publication does not automatically replace main's hosted client.
- One proposed extra live Auth test was blocked by automatic approval review because it would retrieve a service-role credential to create an admin test account. It was not executed; use the normal signed-in app to test user API instead.
- Allowed browser origins: `https://aizen9713-spec.github.io` and local `127.0.0.1` / `localhost` on ports 5500 and 5173. Supabase authentication is required for each device.

## Operations
Do not rotate VAPID keys on redeployment. Do not rerun the initial migration blindly. Cron and functions are installed and active, but only explicit synced Calendar reminder settings with registered devices can send. Unsynced offline edits cannot update server scheduling.

Stop automatic scheduling if necessary:

```sql
select cron.unschedule('shadow-push-every-minute');
```

Review cron.job_run_details, net._http_response, and Settings diagnostics. Never export Vault values, service-role keys, browser tokens or private backup files into Git or chat.
