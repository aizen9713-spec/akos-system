-- Run AFTER migration/functions/secrets are deployed to a dedicated test project.
-- Vault secrets: shadow_push_dispatch_url (HTTPS function URL), shadow_push_cron_secret.
-- Never put the actual secret in source control or a browser.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('shadow-push-every-minute','* * * * *',$$
 select net.http_post(
  url:=(select decrypted_secret from vault.decrypted_secrets where name='shadow_push_dispatch_url'),
  headers:=jsonb_build_object('Content-Type','application/json','x-shadow-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='shadow_push_cron_secret')),
  body:='{}'::jsonb,timeout_milliseconds:=55000
 );
$$);
