# Vercel audit — studentsbiennale.org

Audited 25 Nov 2026 against the live site, the repo (`main` @ `ad2f4d0`) and the Vercel dashboard (team `tphoenixs-projects`, Pro plan).

## What the project is today

| Area | Current state |
|---|---|
| App | Vite + React SPA, fully static. No Vercel Functions, no server code. Data comes from Supabase (separate host). |
| Root directory | `frontend` → **`frontend/vercel.json` is the live config**. The repo-root `vercel.json` is ignored. |
| Domains | `www.studentsbiennale.org` (primary), `studentsbiennale.org` → 308 to www, `students-biennale-kmb.vercel.app` also serves the full site. |
| Build | Node 24.x, Elastic build machine, production builds prioritised. |
| Web Analytics | Enabled, receiving data. `<Analytics />` in `App.tsx`. |
| Speed Insights | Enabled, receiving data. `<SpeedInsights />` in `App.tsx`. Billing shows Speed Insights Plus on 1 project. |
| Observability | Default. Only CDN requests to look at (no functions). 16K CDN requests in the last 6h. |
| Firewall | Vercel's automatic DDoS mitigation only. No custom rules, no IP blocks, Attack Mode off. Managed rulesets need the $200/mo "Priority" add-on. |
| Deployment protection | Previews behind Vercel login (custom domains public). Fine. |
| Retention | All deployment types deleted after 30 days. |
| Billing | Flat Rate CDN tier: **1M CDN requests + 1 TB / month**. $0.78 of $20 credit used. No drains. |
| Env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (preview + production). Fine. |

## Findings, ranked

### 1. Nothing is cached in the browser (high: performance + bill)
Every file, including hashed JS bundles and the 938 KB `home/hero.jpg`, is served with `cache-control: public, max-age=0, must-revalidate`. Each page view revalidates every file. Each revalidation is a CDN request, so returning visitors load slower **and** use up the 1M-request Flat Rate tier. Going over the tier moves you to the next tier next billing cycle.

**Fix (code, `frontend/vercel.json`):**
- `/assets/*` (hashed by Vite): `public, max-age=31536000, immutable`.
- Images, fonts and icons in `public/` (not hashed): `public, max-age=86400, stale-while-revalidate=604800`. Changing an image shows up within a day at most.
- HTML stays `max-age=0` so new deploys show up straight away.

### 2. No security headers (medium)
HSTS is already on. Missing: `X-Content-Type-Options`, `Referrer-Policy`, a clickjacking guard (`X-Frame-Options` or `frame-ancestors`) and `Permissions-Policy`.

**Fix (code):** add these four headers for all paths. I am **not** proposing a full Content-Security-Policy yet. With Supabase, GSAP inline styles and Vercel scripts it needs care, and a wrong CSP breaks the site on launch day. That can be a later step in report-only mode.

### 3. `students-biennale-kmb.vercel.app` duplicates the site (medium: SEO)
Search engines can index the same pages on two hosts.

**Fix (code):** a host-based 308 redirect from that hostname to `https://www.studentsbiennale.org`. Preview URLs use different hostnames and are not affected.

### 4. `robots.txt` and `sitemap.xml` return the HTML app (medium: SEO)
The SPA rewrite catches them. Crawlers get HTML where they expect a robots file.

**Fix (code):** add a static `frontend/public/robots.txt` (allow all, disallow `/admin`). A sitemap needs a list of every artwork and edition URL generated from Supabase. That is a bigger piece of work, so I'm listing it as a follow-up rather than doing it now.

### 5. No link-preview or description tags (medium: sharing)
`index.html` only has a `<title>`. Links shared on WhatsApp, Instagram DMs or X show no image or description.

**Fix (code):** add `description`, Open Graph and Twitter card tags with one share image. **Needs your copy and image choice.** I won't invent wording.

### 6. Admin traffic pollutes Analytics (low)
`/admin` page views are counted as visitors.

**Fix (code):** a `beforeSend` filter on `<Analytics />` that drops `/admin` URLs.

### 7. Front-end crashes are invisible (low/medium)
`ErrorBoundary` only writes to the browser console. Vercel Observability only covers server-side work, so a crash on a visitor's phone leaves no trace anywhere.

**Option A (free, ~3 lines):** send a Web Analytics custom event `error` (message + path) from `ErrorBoundary`. You'll see crash counts per page in Analytics → Events. Pro includes custom events.
**Option B:** a real error tracker such as Sentry (stack traces, devices). It's outside Vercel and not proposed unless you want it.

### 8. Production deployments are deleted after 30 days (low)
Instant Rollback can only go back to deployments that still exist.

**Fix (dashboard):** set production retention to 1 year. Keep the others at 30 days.

### 9. No usage or failure notifications (medium for a launch)
**Fix (dashboard, your account settings):** turn on email notifications for failed deployments and usage or spend alerts. Notifications are per-user, so you may want to do this yourself in Account → Notifications. I can walk through it.

### 10. Firewall (for a traffic spike)
Default DDoS protection is active and enough for a static site. Recommended:
- **Know where Attack Mode is.** Firewall → Rules → Danger Zone → Enable Attack Mode. Use it only if you see a bot flood. Nothing to change now.
- **Optional, your call: block AI crawlers** (GPTBot, ClaudeBot, CCBot, Bytespider, PerplexityBot, Google-Extended…) with one free custom rule. Relevant because the site publishes students' artworks. It does not affect Google or Bing search indexing.
- Not recommended: the managed rulesets ($200/mo Priority add-on) and rate limiting. A static SPA has no login or API on Vercel to protect; Supabase is on its own host.

### 11. Clean-up (low)
- Delete the unused repo-root `vercel.json`. It duplicates `frontend/vercel.json` but Vercel never reads it, which invites editing the wrong file.
- `netlify.toml` and `.netlify/` are leftovers from Netlify. I'm leaving them; mentioned for your awareness.

## Checked and left as is

- **Speed Insights / Web Analytics:** already on and receiving data.
- **Web Analytics Plus ($10/mo):** only worth it if you run UTM-tagged campaigns and want campaign breakdowns or longer history. Optional.
- **Observability Plus, log drains, OIDC:** no functions or server logs exist to make them useful.
- **Skew Protection:** a Vite SPA doesn't send the deployment ID, and `lazyWithRetry` already handles stale chunks after a deploy.
- **Rolling Releases, Deployment Checks:** extra ceremony for a small team.
- **Vercel Image Optimization:** could resize the 0.5–1 MB JPEGs per device. It needs every `<img>` to go through `/_vercel/image` and costs per transformation, so it's a follow-up. The existing `npm run optimize-images` script is the cheaper first step.
- **Build machine, Node version, env vars, Git settings:** fine.

## Proposed changes

| # | Change | Where | Needs your input |
|---|---|---|---|
| 1 | Cache headers | `frontend/vercel.json` | — |
| 2 | Security headers | `frontend/vercel.json` | — |
| 3 | vercel.app → www redirect | `frontend/vercel.json` | — |
| 4 | `robots.txt` | `frontend/public/` | — |
| 5 | Meta + Open Graph tags | `frontend/index.html` | description text + share image |
| 6 | Drop `/admin` from Analytics | `App.tsx` | — |
| 7 | Crash → custom event | `ErrorBoundary.tsx` | yes/no |
| 8 | Production retention 1 year | Dashboard | — |
| 9 | Notifications | Dashboard (your account) | — |
| 10 | Block AI crawlers | Dashboard firewall rule | yes/no |
| 11 | Delete root `vercel.json` | repo | — |

Code changes (1–7, 11) ship in one commit to `main`, which auto-deploys. I'll verify the live headers after the deploy.

---

# Implementation status (25 Nov 2026)

Shipped to production in commit `9d1a2e7`. Tested on a preview deployment first, then live headers checked on `www.studentsbiennale.org`.

| # | Change | Status |
|---|---|---|
| 1 | Caching: `/assets/*` immutable for 1 year; images, fonts and video 1 day + `stale-while-revalidate` 7 days | ✅ live |
| 2 | Security headers: CSP, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy, COOP | ✅ live, no CSP violations on home, artworks, edition and admin pages |
| 3 | `students-biennale-kmb.vercel.app/*` → 308 → `www.studentsbiennale.org/*` | ✅ live |
| 4 | `robots.txt`, `sitemap.xml` (35 URLs), `llms.txt` | ✅ live |
| 5 | Meta description, Open Graph and Twitter cards, `/og/og-image.jpg` (1200×630), apple-touch-icon, JSON-LD Organization/WebSite, `<noscript>` summary for crawlers that don't run JavaScript | ✅ live. Alternative share image at `/og/og-image-alt.jpg` |
| 6 | `/admin` excluded from Web Analytics and Speed Insights | ✅ live |
| 7 | React crashes reported as Web Analytics event `crash` (`path`, `message`) | ✅ live. See Analytics → Events |
| 8 | Production deployment retention: 30 days → 1 year | ✅ done |
| 9 | Notifications | ⏳ you: Account Settings → Notifications (per-user setting) |
| 10 | AI crawlers: allowed to read text, blocked from images | ✅ robots.txt + firewall rule "Deny AI bots accessing media files" (tested: GPTBot gets 403 on `.jpg`, 200 on pages; browsers and OAI-SearchBot unaffected) |
| 11 | Root `vercel.json` deleted; `npm audit fix` for dev-only packages | ✅ |

## AI crawler policy

- **Search and answer engines** (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot): full access.
- **Training crawlers** (GPTBot, ClaudeBot, CCBot, Bytespider, meta-externalagent, cohere, Diffbot, Google-Extended, Applebot-Extended): text allowed, images disallowed in `robots.txt`. Requests from crawlers that identify themselves are **denied by the Vercel firewall**.
- Every image response carries `X-Robots-Tag: noimageai`, and the page carries `noimageai`. This is a signal only; not every crawler honours it.
- **Limit:** catalogue artwork images are served from Supabase (`ozexvctgofwxcikvcxwg.supabase.co`), not from this domain, so `robots.txt` and the firewall don't cover them. Only 2048px web copies are public; HD originals are in a private bucket. Covering them too would mean serving Supabase images through a `/media/*` rewrite on this domain. That's a follow-up.

## GEO/AEO limit to know about
The site is rendered in the browser. Most AI crawlers don't run JavaScript, so they see only `index.html`: the site-wide description, JSON-LD, `<noscript>` summary and `llms.txt`. They do not see artwork, artist or curator text. Every URL also shares one title and description. Pre-rendering each route to HTML at build time is the next real step for SEO, GEO and per-page link previews.

# Security review

## Infrastructure

| Check | Result |
|---|---|
| HTTPS / HSTS | ✅ Vercel-managed certs, HSTS 2 years |
| DDoS | ✅ Vercel automatic mitigation. Attack Mode is in Firewall → Rules → Danger Zone if you see a bot flood |
| Preview deployments | ✅ behind Vercel login (custom domains public) |
| Source maps | ✅ not shipped, and protected by Vercel if added |
| Env vars | ✅ only the Supabase URL and anon key, which are public by design. No service-role key anywhere |
| Secrets in git history | ✅ none found (repo is public on GitHub) |
| Supabase sign-ups | ✅ disabled; anonymous sign-in disabled |
| Supabase RLS | ✅ anon sees only published rows (checked live on programmes, press, about); `import_sources` denied; writes require `app_metadata.role` = cms/admin (not user-editable) |
| HD originals bucket | ✅ private |
| **Public bucket listing** | ❌ **Anyone can list every file in `sb-assets-public`**, which makes bulk-downloading all artworks a one-liner. Fix written: `database/supabase/migrations/20261125120000_close_public_bucket_listing.sql`. **Not applied yet** (see below) |

## Code

| Check | Result |
|---|---|
| XSS sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`) | ✅ none |
| CSP | ✅ added, so injected scripts can't run |
| Clickjacking | ✅ `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Production dependencies | ✅ `npm audit --omit=dev`: 0 vulnerabilities |
| Dev dependencies | ✅ nanoid and source-map-js fixed. vitest and sharp still flagged; they're build-time only and the fix needs major upgrades |
| External links | ✅ `target="_blank"` links use `rel="noreferrer"` |
| CMS links | ⚠️ CMS editors could save a `javascript:` URL in a link field. Only trusted admins can write, and the CSP blocks it, so this is low risk |

## Still to do (you)

1. **Apply the storage migration.** The Supabase migration history has drifted: two migrations exist only on the server, and two exist only locally (`20260927120000`, `20261001121542`). `supabase db push` would try to re-run old ones. The safe route is to paste the migration's SQL into the Supabase SQL Editor once.
2. **Supabase Auth hardening** for CMS accounts: turn on leaked-password protection and MFA (Authentication → Settings).
3. **Vercel notifications:** turn on failed deployments and usage alerts.
