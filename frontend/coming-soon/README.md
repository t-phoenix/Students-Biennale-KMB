# Coming soon (custom domain)

Static full-bleed looping video for the public domain. Deployed as a **separate Vercel project** from the full site so `main` can keep shipping the React app on `*.vercel.app`.

## Files

| File | Role |
|---|---|
| `index.html` | Full-viewport muted autoplay loop |
| `sb-coming-soon.mp4` | URL-safe copy of the creative |
| `vercel.json` | Cache headers for the video |

## Vercel project settings

- **Root Directory:** `frontend/coming-soon`
- **Framework:** Other
- **Install / Build / Output:** leave dashboard **Override** off so [`vercel.json`](vercel.json) applies (skip install/build, output `.`). If Override is on with the monorepo `npm install --prefix frontend` command, the build fails looking for `frontend/coming-soon/frontend/package.json` — turn Override off or clear those fields.
- **Production Branch:** `main`
- Attach the **public custom domain only** to this project (not the full-site project) until launch

## Local preview

```bash
npx --yes serve frontend/coming-soon
```

## Manual: DNS (registrar + Vercel)

1. Vercel → this project → **Settings → Domains** → add apex (and `www` if used)
2. Copy the records Vercel shows (typical: apex **A** `76.76.21.21`; `www` **CNAME** `cname.vercel-dns.com`)
3. Apply them at your DNS registrar; wait for SSL **Valid**
4. Smoke-test: custom domain shows this video page

## Manual: internal full-site URL

1. Open the **existing** full-site Vercel project → **Deployments**
2. Copy Production `https://<project>.vercel.app` and share with the team
3. Optional: **Settings → Deployment Protection** → protect Preview deployments only

## Launch flip (later)

1. Remove the custom domain from this coming-soon project
2. Add it on the full-site project; confirm SSL Valid
3. Update Supabase Auth redirect URLs for the production domain
4. Archive or stop deploying this project

## Related

See [README Deploy](../../README.md#deploy) for the full two-project overview.
