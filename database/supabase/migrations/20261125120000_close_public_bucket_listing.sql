-- Anyone with the public anon key could LIST every file in sb-assets-public
-- (POST /storage/v1/object/list/sb-assets-public), which makes bulk scraping of
-- all artwork images trivial. Public buckets serve files by URL without any
-- SELECT policy, so the site keeps working; only listing is closed.
-- CMS admins keep SELECT so uploads with upsert still work.

drop policy if exists sb_assets_public_read on storage.objects;

create policy sb_assets_public_cms_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sb-assets-public'
  and (select private.is_cms_admin())
);
