# Database

Supabase Postgres is the source of truth. The public site reads with the **anon** key; the admin CMS writes as an **authenticated** user whose JWT `app_metadata.role` is `cms` or `admin`. Import jobs may use `service_role` on a server only — never in the browser.

CLI workdir: either stay at the **repo root** and pass `--workdir database`, **or** `cd database` and omit `--workdir`. Do not combine both — if you are already in `database/`, `--workdir database` looks for `database/database` and fails.

```bash
# From repo root (Students-Biennale-KMB/)
supabase --workdir database start

# Or from database/
cd database
supabase start
```

## Layout

```
database/
├── README.md
└── supabase/
    ├── config.toml
    ├── seed.sql
    └── migrations/
        ├── 20260813074902_initial_schema.sql
        ├── 20260813074903_rls_cms_policies.sql
        ├── 20260813074904_search_rpc.sql
        ├── 20260813074905_storage_buckets.sql
        ├── 20260815135642_restrict_cms_writes_and_import_idempotency.sql
        └── 20260817183430_catalogue_snapshots.sql
```

| Bucket | Public | Use |
|--------|--------|-----|
| `sb-assets-original` | no | HD masters |
| `sb-assets-public` | yes | web derivatives (`thumbnail`, `card`, `hero`, `gallery`) |

## Developer cheatsheet

All commands below assume you are in `database/`. From the repo root, prefix with `supabase --workdir database`.

### Ports (what to open)

| Port | Service | Open in a browser? |
|------|---------|--------------------|
| **54321** | API gateway (Kong) | No — `/` returns `no Route matched`. Use `/rest/v1/<table>` |
| **54322** | Postgres | No — use `psql`, TablePlus, DBeaver |
| **54323** | Studio (table UI) | Yes, if `[studio] enabled = true` |
| **54324** | Mailpit (auth emails) | Yes |

```bash
supabase start          # Docker must be running
supabase status         # print URLs + keys
supabase stop
supabase db reset       # wipe local DB, re-run migrations + seed.sql
```

Local Postgres (password is `postgres`):

```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

TablePlus / DBeaver / Postico: host `127.0.0.1`, port **54322**, user `postgres`, password `postgres`, database `postgres`. Schema to inspect: `public`.

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

Inside `psql`: `\dt public.*` tables · `\d+ public.editions` columns · `\df public.search_entities` RPC · `\dp public.editions` grants · `\q` quit.

As `postgres` you **bypass RLS**. That is the superuser view (all rows). The website does not connect as `postgres`.

### Roles (who sees what)

| Role | How you get it | What it can do here |
|------|----------------|---------------------|
| `postgres` | port 54322 / `db query` | Everything; ignores RLS. Use for schema work. |
| `anon` | REST + anon JWT, no login | `SELECT` published content; web-safe assets only |
| `authenticated` | REST + user JWT | Same reads; writes only if `app_metadata.role` is `cms` or `admin` |
| `service_role` | server key only | Bypasses RLS. Import jobs. Never in the frontend. |

### Inspect data and schema

```bash
# Tables in public
supabase db query "select tablename from pg_tables where schemaname = 'public' order by 1;"

# Seed editions
supabase db query "select id, slug, is_current, published from public.editions order by number;"

# RLS on?
supabase db query "select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and relkind = 'r' order by 1;"

# Policies
supabase db query "select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by 1, 2;"

# Search RPC (min 2 chars)
supabase db query "select id, title, matched_field, rank from public.search_entities('sensing', 'edition-2025-26', 12);"

# Schema warnings
supabase db advisors
```

REST (same data the frontend sees as `anon`). Copy the anon key from `supabase status` or `frontend/.env.local`:

```bash
KEY=$(grep VITE_SUPABASE_ANON_KEY ../frontend/.env.local | cut -d= -f2)
curl -s "http://127.0.0.1:54321/rest/v1/editions?select=id,slug,title,is_current&order=number" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Table path: `/rest/v1/artworks`, `/rest/v1/venues`, … Empty arrays are normal until seed/import fills them.

### Change the schema

1. `supabase migration new <name>` — empty file under `supabase/migrations/`
2. Put SQL in that file
3. `supabase db reset` — applies all migrations from scratch + `seed.sql`
4. Experiment with `supabase db query "…"`; when the statement is right, copy it into the migration and reset once to confirm

`seed.sql` is **local fixture data only**. It does not run on `db push` to hosted.

```bash
supabase migration new add_foo
supabase db reset
supabase gen types typescript --local > ../frontend/src/lib/database.types.ts
```

Do not iterate by applying one-off migration history on a database you still need to `db pull`.

### Logs

```bash
supabase logs db
supabase logs api
```

### CMS write test

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"cms"}'::jsonb
where email = 'editor@example.com';
```

User must sign out/in so the JWT refreshes. REST writes as `anon` should fail; CMS session should succeed.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) v2.81+ (`brew install supabase/tap/supabase`)
- Docker Desktop (local stack only)

## Local

Docker Desktop must be running. Examples below assume you are **inside `database/`** (omit `--workdir`). From the repo root, prefix every command with `supabase --workdir database`.

```bash
supabase start
supabase status   # API URL + anon key → frontend/.env.local
```

Studio is **off** in `config.toml` because this repo lives on `~/Desktop` and Docker Desktop cannot bind-mount that folder on macOS. Database, Auth, Storage, and the API still run.

To turn Studio on (http://127.0.0.1:54323): grant Docker access to Desktop (System Settings → Privacy & Security → Files and Folders or Full Disk Access), or move the repo out of Desktop, then set `[studio] enabled = true` and restart.

Reset (re-runs migrations + `seed.sql`):

```bash
supabase db reset
```

Smoke-test as anon (published editions only):

```bash
supabase db query "select id, slug, is_current from public.editions;"
```

Search RPC:

```sql
select * from public.search_entities('sensing', 'edition-2025-26', 12);
```

Stop:

```bash
supabase stop
```

## Link a hosted project

Create the project in the [Supabase dashboard](https://supabase.com/dashboard) (do not commit the ref or keys). Then:

```bash
supabase --workdir database login
supabase --workdir database link --project-ref <project-ref>
supabase --workdir database db push
```

`db push` applies migrations to the linked remote. It does **not** run `seed.sql` — seed is local-only. Production catalogue data is loaded with `python3 backend/import_catalogue.py --target linked` (see [backend/README.md](../backend/README.md)).

CMS can edit programmes, press, about, and assets. Editions, artworks, curators, and venues are import-owned.

## CMS role

1. Auth → add the editor user (email magic link is enough).
2. Set **`app_metadata.role`**, not `user_metadata` (users can edit the latter):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"cms"}'::jsonb
where email = 'editor@example.com';
```

3. The user must refresh their session (sign out / in) so the JWT picks up the claim.

## Frontend connection

Copy `frontend/.env.example` → `frontend/.env.local`:

| Env | Local | Hosted |
|-----|--------|--------|
| `VITE_SUPABASE_URL` | `http://127.0.0.1:54321` | Project Settings → API → URL |
| `VITE_SUPABASE_ANON_KEY` | `supabase status` | Project Settings → API → anon / publishable key |

Public reads: one `supabase.from('catalogue_snapshots').select('edition_id, payload, search_index, generated_at')` per tab (cached in `sessionStorage`). Edition and Discover search filter that pack in the browser. Do not call `search_entities` on keystroke.

CMS writes: `createClient` with the **anon** key, then `signIn`. RLS allows writes only when `app_metadata.role` is `cms` or `admin`, and only on programmes, press, about, and assets. Catalogue tables and `catalogue_snapshots` are import-owned.

## New migrations

```bash
supabase --workdir database migration new <descriptive_name>
# edit database/supabase/migrations/<timestamp>_<descriptive_name>.sql
supabase --workdir database db reset   # local
# supabase --workdir database db push  # remote, after review
```

Do not iterate with `apply_migration` on a database you still need to `db pull` — it writes history on every attempt.

## Types

```bash
supabase --workdir database gen types typescript --local > frontend/src/lib/database.types.ts
```

After linking: drop `--local` (uses the remote schema).

## Debug

| Symptom | Check |
|---------|--------|
| Empty API / 404 on tables | Grants + RLS. Cloud does not auto-expose new tables. |
| Writes return 0 rows | Missing SELECT policy, or JWT role not `cms`/`admin`. Refresh the session. |
| Storage upsert fails | Policies need INSERT + SELECT + UPDATE. |
| Search returns nothing | Query length ≥ 2; `search_entries` must be populated. The public site searches cached `catalogue_snapshots`, not this RPC. |
| Empty edition catalogue | Import writes `catalogue_snapshots`. Run `python3 backend/import_catalogue.py --target local` after `db reset`. |
| Advisor warnings | `supabase --workdir database db advisors` |
| SQL / API logs | `supabase --workdir database logs db` / `logs api` |
| Auth emails (local) | http://127.0.0.1:54324 |

## Push local schema to hosted (production)

`db push` applies **migrations only**. It does not run `seed.sql`, does not create Auth users, and does not set frontend env vars.

Postgres in `config.toml` is **major version 17**. Create the hosted project on Postgres 17 (default on current Supabase).

### You do manually

1. Create the project in the [dashboard](https://supabase.com/dashboard) — org, name (e.g. `students-biennale-kmb`), region, plan. Copy **Project Settings → General → Reference ID**.
2. `supabase login` in a terminal (browser OAuth). One-time per machine.
3. Auth: add the CMS editor user (email). Then set `app_metadata.role` (SQL in [CMS role](#cms-role)). Sign out/in after.
4. Auth → URL configuration: add the production frontend origin to **Site URL** and **Redirect URLs**.
5. Frontend host (Vercel etc.): set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. Never `service_role` / `VITE_*` secret keys.
6. Catalogue content: `python3 backend/import_catalogue.py --target linked` (see [backend/README.md](../backend/README.md)). Seed editions stay local-only.

### CLI can automate (after login + project exists)

From **repo root**:

```bash
supabase --workdir database link --project-ref <project-ref>
supabase --workdir database db push
python3 backend/import_catalogue.py --target linked
supabase --workdir database db advisors          # optional check
supabase --workdir database migration list       # local vs remote
```

`link` writes `database/supabase/.temp/` (gitignored). Re-link if the ref changes.

Confirm Storage buckets `sb-assets-original` (private) and `sb-assets-public` (public) after the storage migration. Recreate them in the dashboard only if `db push` skipped Storage (rare).

Later schema changes: `migration new` → test with `db reset` locally → `db push` to production.

### Agent / MCP (optional)

This repo’s Cursor session does **not** currently have the Supabase MCP server. After you create the project:

1. Cursor Settings → MCP → enable the official **Supabase** plugin (or add `https://mcp.supabase.com/mcp`).
2. Authenticate in the browser when Cursor prompts.
3. Reload the agent. Then it can `list_projects`, inspect SQL, and run advisors on the new project.

MCP does **not** replace `db push`. Keep shipping schema through the CLI migrations in `database/supabase/migrations/`. Do not ask the agent to `create_project` unless you explicitly want a new cloud project billed to your org.
