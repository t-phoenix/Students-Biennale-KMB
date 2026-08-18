# Backend

Import jobs for the Students' Biennale catalogue. CMS API comes later.

## Catalogue import

`import_catalogue.py` upserts production data from the local content bundle into Supabase. It does **not** run `seed.sql`. Images are recorded as `assets` rows with Drive `source_url` and `status = pending` — files are not uploaded to Storage yet.

| Source | Tables |
|--------|--------|
| `content/tables/projects.json` | `projects`, `artworks`, `artwork_contributors`, `people`, `institutions` |
| `content/tables/curators.json` | `zones`, `people`, `zone_people` |
| `content/tables/venues.json` | `venues`, `edition_venues` |
| `content/site-content.json` | `editions`, `edition_sections`, `programmes`, `press_items`, `about_sections`, `sponsors` |
| `content/media-manifest.json` | `assets`, `asset_links` |

After upserts, the import also writes **`catalogue_snapshots`** — one JSON pack per edition (`payload` + `search_index`) so the public site can load the catalogue in a single request.

Web images: `python3 backend/upload_public_assets.py` resizes `content/media` and uploads JPEG cards to the public `sb-assets-public` bucket. Then re-run the import so snapshots pick up `public_url`.

Rebuild the JSON first if the sheet or docs changed:

```bash
python3 scripts/build_sheet_tables.py --no-download-media
python3 scripts/build_content_data.py
```

Then import (from repo root):

```bash
# Preview counts only
python3 backend/import_catalogue.py --dry-run

# Linked hosted project (Students Biennale)
python3 backend/import_catalogue.py --target linked

# Local Docker stack
python3 backend/import_catalogue.py --target local
```

Re-runs are idempotent (`ON CONFLICT` upserts). Programme/press/about rows that editors create in the CMS with new IDs are left alone.

CMS can update **programmes** (workshops, residencies, awards), **press**, **about**, and **assets**. Catalogue tables and `catalogue_snapshots` (editions, artworks, curators, venues) are import-owned.
