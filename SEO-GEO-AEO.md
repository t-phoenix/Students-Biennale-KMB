# Search and AI visibility (SEO, GEO, AEO)

How studentsbiennale.org gets found on Google and Bing (SEO), and gets cited by AI answer
engines such as ChatGPT, Google AI Overviews, Perplexity and Claude (GEO / AEO). Written
2026-11-25.

## How each engine finds the site

| Where people ask | What it reads | Runs JavaScript? | What decides if we show up |
|---|---|---|---|
| Google Search, AI Overviews, AI Mode, Gemini | Googlebot's index | Yes | Normal SEO. Google says no special AI files or markup are needed. |
| ChatGPT search | Bing's index + OpenAI's `OAI-SearchBot` / `ChatGPT-User` | No | Being indexed and ranking on **Bing**, and readable HTML |
| Microsoft Copilot | Bing's index | Partly | Bing |
| Perplexity | `PerplexityBot` + its own index | No | Readable HTML |
| Claude | `Claude-SearchBot` / `Claude-User` | No | Readable HTML |

The site is a React app, so before this change every URL arrived at ChatGPT, Perplexity and
Claude as the same page with one generic title. Only Google saw the real content.

## What is now automated (runs on every deploy)

`frontend/prerender.ts` runs after `vite build` and writes an HTML file for each of
**138 public pages**: home, Discover, programmes, press, every edition and its tabs, and every
2025–26 artwork, curator and venue. Each file has:

- its own `<title>`, meta description, canonical URL and share preview (artwork, curator and venue pages use their own photo);
- the page's text (artwork description, artists and their art schools, materials, curator bios, venue history, edition overview) for crawlers that don't run JavaScript. It is hidden and React replaces it on load, so visitors see no change;
- structured data (JSON-LD): `ExhibitionEvent` for editions, `VisualArtwork` with each artist and their school, `Person` for curators, `Place` for venues, and `BreadcrumbList` on every inner page.

`sitemap.xml` is generated from the same list (122 URLs with last-modified dates). Older
editions' tabs with no catalogue data are left out so search engines aren't pointed at
near-empty pages.

Already in place before this change: `robots.txt` (search and AI answer crawlers allowed;
training crawlers kept off artwork images), `llms.txt`, and site-wide Organization JSON-LD.

## Manual steps (need an account owner)

1. **Google Search Console.** Add `studentsbiennale.org` as a Domain property (DNS TXT record at the domain registrar). Submit `https://www.studentsbiennale.org/sitemap.xml`. AI Overviews and AI Mode clicks are counted in its Performance report.
2. **Bing Webmaster Tools.** Sign in and import the site from Search Console, then submit the sitemap. This is the most important step for ChatGPT and Copilot.
3. **Refresh pages when the catalogue changes.** Pages are built at deploy time, so CMS edits reach crawlers only after the next deploy. Create a Vercel Deploy Hook (Project → Settings → Git → Deploy Hooks) and either call it after publishing or schedule it daily.
4. **Vercel firewall.** Confirm the "deny AI bots on media" rule only matches training bots, and that `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot` and `Bingbot` get 200 on pages.
5. **Links and mentions from other sites.** These are the strongest signal for both rankings and AI citations: a link from kochimuzirisbiennale.org, participating art schools' sites, press coverage, and a Wikipedia / Wikidata entry for the Students' Biennale. Send the URLs of any other official profiles (Facebook, YouTube, X, Wikipedia) so they can be added to the site's `sameAs` data.
6. **Content only the team can write.** AI answers favour pages that answer a question directly. The questions people ask most ("How do I apply to the Students' Biennale?", "Who can take part?", "When is the next open call?") have no page on the site yet. One open-call / how-to-participate page would do more for answer engines than any technical change.

## Keywords

Realistic first place: the name in all its spellings ("Students' Biennale", "Students Biennale
Kochi"), each edition ("Students' Biennale 2025–26"), and the names of artists, curators,
artworks and venues, which now each have their own page. Competitive terms ("student art
exhibition India", "emerging artists India", "art school exhibition Kerala") depend mostly on
links from other sites (step 5); no technical change can guarantee them.

## How to track it

- **Google, including AI Overviews:** Search Console → Performance (queries, positions, clicks).
- **Bing, ChatGPT, Copilot:** Bing Webmaster Tools → Search Performance.
- **Visits from AI assistants:** Vercel Web Analytics → Referrers: look for `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`.
- **Citations:** once a month, ask ChatGPT, Perplexity and Gemini the questions above and note whether the site is cited. Paid tools (Profound, Peec AI, Semrush's AI toolkit) automate this if it becomes worth paying for.

## Not covered yet

- Past-workshop pages (`/programmes/past-workshops/:id`) and individual press items load from separate CMS tables and are not pre-rendered. They still work for visitors and Google.
- Production routing of the new files is checked after deploy: `curl -A GPTBot https://www.studentsbiennale.org/editions/2025-26/curators` should return "Curators, Students' Biennale 2025–26", not the home page.
