-- 1) Anyone with the public anon key could LIST every file in sb-assets-public
--    (POST /storage/v1/object/list/sb-assets-public), which makes bulk scraping of
--    all artwork images trivial. Public buckets serve files by URL
--    (/object/public/…, /render/image/public/…) without any SELECT policy, so the
--    site keeps working; only listing is closed. CMS admins keep SELECT.
--
-- 2) anon/authenticated never need REFERENCES or TRIGGER on app tables (the API
--    only uses SELECT/INSERT/UPDATE/DELETE). Remove them, now and for new tables.
--
-- Rollback for (1):
--   drop policy if exists sb_assets_public_cms_read on storage.objects;
--   create policy sb_assets_public_read on storage.objects for select
--     to anon, authenticated using (bucket_id = 'sb-assets-public');

drop policy if exists sb_assets_public_read on storage.objects;
drop policy if exists sb_assets_public_cms_read on storage.objects;

create policy sb_assets_public_cms_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sb-assets-public'
  and (select private.is_cms_admin())
);

revoke references, trigger on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke references, trigger on tables from anon, authenticated;
