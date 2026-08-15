# Students' Biennale — KMB

Monorepo for the public site and its Supabase backend.

```
Students-Biennale-KMB/
├── frontend/    # React + Vite (public site)
├── database/    # Supabase schema, RLS, storage, seed
└── backend/     # reserved (import jobs / CMS API later)
```

Postgres is the source of truth. The frontend reads through the Supabase client (anon key + RLS). CMS writes use Auth + `app_metadata.role` (`cms` or `admin`). Never put `service_role` in the browser.

## Prerequisites

- Node 22+ and npm
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) v2.81+ (`brew install supabase/tap/supabase`)
- Docker Desktop — only if you run the database locally

## 1. Frontend

```bash
cd frontend
cp .env.example .env.local   # then fill URL + anon key (step 2)
npm install
npm run dev                  # http://127.0.0.1:5173
```

| Script | What it does |
|--------|----------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |

Pages still use mock data until queries are wired. `src/lib/supabase.ts` is the client for those reads and for a future CMS.

## 2. Database

See [database/README.md](database/README.md). From the **repo root**:

```bash
supabase --workdir database start
supabase --workdir database status
```

If you already `cd database`, drop `--workdir` (`supabase start` / `supabase status`). Combining both looks for `database/database` and fails. Docker Desktop must be running.

Local Studio is off while the repo sits on `~/Desktop` (Docker cannot bind-mount that folder). API still runs at http://127.0.0.1:54321. See [database/README.md](database/README.md) to re-enable Studio.

Put **API URL** and **anon key** into `frontend/.env.local` (`supabase status` prints them):

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from status>
```

Reset (migrations + seed editions): `supabase --workdir database db reset`

Hosted project: `login` → `link --project-ref <ref>` → `db push`. Seed is local-only; production data comes from import/CMS.

### CMS writes

Create the editor in Studio → Auth, then set **`app_metadata`** (not `user_metadata`):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"cms"}'::jsonb
where email = 'editor@example.com';
```

Sign out/in so the JWT refreshes. The CMS client is still the anon key plus that session.

## Debug

| Area | Command / URL |
|------|----------------|
| Stack not up | `supabase --workdir database status` |
| Schema / RLS warnings | `supabase --workdir database db advisors` |
| Postgres / API logs | `supabase --workdir database logs db` · `logs api` |
| Local Auth emails | http://127.0.0.1:54324 |
| Empty table from the app | RLS: unpublished rows are hidden from `anon`; grants are required (cloud does not auto-expose tables) |
| CMS write no-ops | Role missing on JWT, or no SELECT policy (Postgres needs SELECT to UPDATE) |
| Frontend env | Restart Vite after changing `.env.local`; vars must be prefixed `VITE_` |
| Lint / types | `cd frontend && npm run lint` · `npm run build` |

## Deploy

**Database**

1. Create a Supabase project in the dashboard.
2. `supabase --workdir database link --project-ref <ref>`
3. `supabase --workdir database db push`
4. Create the CMS user and set `app_metadata.role` as above.

**Frontend** (Vercel or equivalent)

1. Root directory: `frontend`
2. Build: `npm run build` · output: `dist`
3. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only
4. Auth redirect URLs must include the production origin

`service_role` belongs in a private worker or GitHub Actions secret for imports — never a `VITE_` / `NEXT_PUBLIC_` variable.

## What is not in git

`content/` (sheet extracts, Drive originals) and `scripts/` stay local. They feed a future import job; they are not required to run the frontend or apply migrations.
