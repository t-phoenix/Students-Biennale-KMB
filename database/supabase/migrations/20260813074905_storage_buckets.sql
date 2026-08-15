-- Storage: HD originals stay private; web derivatives are public-read.
-- Upload/replace requires CMS admin (INSERT + SELECT + UPDATE).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'sb-assets-original',
    'sb-assets-original',
    false,
    104857600,
    array['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'video/mp4']
  ),
  (
    'sb-assets-public',
    'sb-assets-public',
    true,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- Public derivatives
create policy sb_assets_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'sb-assets-public');

-- Originals: CMS only
create policy sb_assets_original_cms_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sb-assets-original'
  and (select private.is_cms_admin())
);

create policy sb_assets_cms_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('sb-assets-original', 'sb-assets-public')
  and (select private.is_cms_admin())
);

create policy sb_assets_cms_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('sb-assets-original', 'sb-assets-public')
  and (select private.is_cms_admin())
)
with check (
  bucket_id in ('sb-assets-original', 'sb-assets-public')
  and (select private.is_cms_admin())
);

create policy sb_assets_cms_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('sb-assets-original', 'sb-assets-public')
  and (select private.is_cms_admin())
);
