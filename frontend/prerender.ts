/**
 * Build step (after `vite build`): writes one HTML file per public route, plus `sitemap.xml`.
 *
 * The app renders in the browser, and AI crawlers (ChatGPT, Claude, Perplexity) don't run
 * JavaScript, so without this every URL looks like the same generic page to them. Each file is
 * `dist/index.html` with that page's own title, description, canonical URL, share tags and
 * JSON-LD, plus the page's text inside `#root`. React replaces `#root` on load, so visitors see
 * the app exactly as before; the text is hidden by CSS so it never flashes before JS runs.
 *
 * Run: vite-node prerender.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { mapSnapshot, mergeCatalogues } from "./src/lib/catalogue/mappers";
import type { MappedCatalogue, SnapshotRow } from "./src/lib/catalogue/types";
import { getEditionOverview } from "./src/data/editions";

const ORIGIN = "https://www.studentsbiennale.org";
const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const SITE = "Students' Biennale";

type Crumb = { name: string; path: string };
type Page = {
  path: string;
  title: string;
  description: string;
  h1: string;
  paragraphs: string[];
  links?: { href: string; text: string }[];
  image?: string;
  jsonLd?: Record<string, unknown>[];
  crumbs?: Crumb[];
  lastmod?: string;
};

// ---------- text helpers ----------

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain text from CMS copy: drop markdown emphasis and HTML tags, collapse spaces. */
const plain = (s?: string | null) =>
  (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();

const paras = (s?: string | null) =>
  plain(s)
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Meta description: first ~155 characters, cut on a word boundary. */
function summary(...candidates: Array<string | null | undefined>): string {
  const text = candidates.map(plain).find(Boolean)?.replace(/\s+/g, " ") ?? "";
  if (text.length <= 158) return text;
  return text.slice(0, 155).replace(/\s+\S*$/, "") + "…";
}

const label = (years: string) => `${SITE} ${years.replace("-", "–")}`;
const abs = (path: string) => ORIGIN + path;

// ---------- data ----------

async function loadCatalogues(): Promise<MappedCatalogue[]> {
  const env = loadEnv(process.env.NODE_ENV ?? "production", ROOT, "VITE_");
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[prerender] Supabase env missing: using the built-in catalogue only.");
    return mergeCatalogues([]);
  }
  const res = await fetch(
    `${url}/rest/v1/catalogue_snapshots?select=edition_id,payload,search_index,generated_at`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`[prerender] catalogue fetch failed: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as SnapshotRow[];
  return mergeCatalogues(rows.filter((r) => r.payload?.edition).map(mapSnapshot));
}

// ---------- pages ----------

const ORG = { "@id": `${ORIGIN}/#org` };

function staticPages(cats: MappedCatalogue[]): Page[] {
  const editionLinks = cats.map((c) => ({ href: `/editions/${c.years}`, text: label(c.years) }));
  const explore = [
    { href: "/artworks", text: "All artworks" },
    ...editionLinks,
    { href: "/programmes", text: "Programmes" },
    { href: "/programmes/residencies", text: "Residencies" },
    { href: "/programmes/raza-scholarship", text: "Raza-Students' Biennale Scholarship" },
    { href: "/press", text: "Press" },
  ];
  return [
    {
      path: "/",
      title: "Students' Biennale | Kochi Biennale Foundation",
      description:
        "The Students' Biennale is the Kochi Biennale Foundation's platform for emerging artists from art schools across India, running alongside the Kochi-Muziris Biennale since 2014.",
      h1: "Students' Biennale",
      paragraphs: [
        "Established by the Kochi Biennale Foundation in 2014, the Students' Biennale is the foundation's flagship educational initiative and one of the most significant platforms for emerging artists in India. It runs parallel to each edition of the Kochi-Muziris Biennale in Kochi, Kerala, giving students and recent graduates from art institutions across India the chance to exhibit within an international contemporary art exhibition.",
        "The programme is both an exhibition and an evolving educational initiative: exhibitions, workshops, residencies, mentorship, public talks, research projects, awards and international exchanges.",
      ],
      links: explore,
    },
    {
      path: "/artworks",
      title: `Discover artworks | ${SITE}`,
      description:
        "Browse artworks by student artists from art schools across India, shown at the Students' Biennale alongside the Kochi-Muziris Biennale.",
      h1: "Discover artworks",
      paragraphs: ["Every artwork from the Students' Biennale, by student artists from art institutions across India."],
      links: cats.flatMap((c) => c.artworks.map((a) => ({ href: `/editions/${c.years}/artworks/${a.id}`, text: a.title }))),
      crumbs: [{ name: "Artworks", path: "/artworks" }],
    },
    {
      path: "/programmes",
      title: `Programmes: workshops, residencies and awards | ${SITE}`,
      description:
        "Workshops, residencies, mentorship and awards for art students and recent graduates in India, from the Kochi Biennale Foundation's Students' Biennale.",
      h1: "Programmes",
      paragraphs: [
        "Alongside each exhibition, the Students' Biennale runs workshops, residencies, mentorship programmes, public talks and awards for students and recent graduates of art schools across India.",
      ],
      links: explore,
      crumbs: [{ name: "Programmes", path: "/programmes" }],
    },
    {
      path: "/programmes/residencies",
      title: `Residencies | ${SITE}`,
      description: "Artist residencies for students and recent art graduates from the Kochi Biennale Foundation's Students' Biennale.",
      h1: "Residencies",
      paragraphs: ["Residencies offered through the Students' Biennale for emerging artists from art institutions across India."],
      crumbs: [
        { name: "Programmes", path: "/programmes" },
        { name: "Residencies", path: "/programmes/residencies" },
      ],
    },
    {
      path: "/programmes/raza-scholarship",
      title: `Raza-Students' Biennale Scholarship | ${SITE}`,
      description:
        "The Raza-Students' Biennale Scholarship: an international exchange award with the Raza Foundation, Institut Français India and Beaux-Arts de Marseille.",
      h1: "Raza-Students' Biennale Scholarship",
      paragraphs: [
        "An international exchange award for Students' Biennale artists, run with the Raza Foundation, Institut Français India and Beaux-Arts de Marseille.",
      ],
      crumbs: [
        { name: "Programmes", path: "/programmes" },
        { name: "Raza-Students' Biennale Scholarship", path: "/programmes/raza-scholarship" },
      ],
    },
    {
      path: "/press",
      title: `Press | ${SITE}`,
      description: "Press coverage, releases and media resources for the Students' Biennale, Kochi Biennale Foundation.",
      h1: "Press",
      paragraphs: ["Press coverage and media resources for the Students' Biennale."],
      crumbs: [{ name: "Press", path: "/press" }],
    },
  ];
}

function editionPages(c: MappedCatalogue): Page[] {
  const name = label(c.years);
  const base = `/editions/${c.years}`;
  const fallback = getEditionOverview(c.years);
  const overview = paras(c.overview).length ? paras(c.overview) : fallback.intro.map(plain);
  const lastmod = c.generatedAt?.slice(0, 10) || undefined;
  const edCrumb = { name, path: base };
  const event = {
    "@type": "ExhibitionEvent",
    "@id": abs(base) + "#event",
    name,
    url: abs(base),
    description: summary(overview.join(" ")),
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: "Kochi", address: { "@type": "PostalAddress", addressLocality: "Kochi", addressRegion: "Kerala", addressCountry: "IN" } },
    organizer: ORG,
    ...(c.heroUrl ? { image: c.heroUrl } : {}),
  };
  const sub = (seg: string, title: string) => ({ href: `${base}/${seg}`, text: `${title}, ${name}` });
  const pages: Page[] = [
    {
      path: base,
      title: `${name} | Kochi Biennale Foundation`,
      description: summary(overview.join(" ")),
      h1: name,
      paragraphs: overview,
      links: [sub("curators", "Curators"), sub("artworks", "Artworks"), sub("artists", "Artists"), sub("venue", "Venues")],
      image: c.heroUrl ?? undefined,
      jsonLd: [event],
      crumbs: [edCrumb],
      lastmod,
    },
  ];

  const curatorText = c.zones.length
    ? c.zones.map((z) => `${z.label}${z.states ? ` (${z.states})` : ""}: ${z.curators.map((k) => k.name).join(", ")}`)
    : (fallback.curatorBios ?? []).map((b) => plain(`${b.name}: ${b.bio}`));
  pages.push({
    path: `${base}/curators`,
    title: `Curators | ${name}`,
    description: summary(`The curators of the ${name}. ${curatorText.join(". ")}`),
    h1: `Curators, ${name}`,
    paragraphs: curatorText,
    links: c.curators.map((k) => ({ href: `${base}/curators/${k.id}`, text: k.name })),
    crumbs: [edCrumb, { name: "Curators", path: `${base}/curators` }],
    lastmod,
  });

  pages.push({
    path: `${base}/artworks`,
    title: `Artworks | ${name}`,
    description: summary(
      `Artworks by student artists at the ${name}${c.artworks.length ? `: ${c.artworks.slice(0, 6).map((a) => a.title).join(", ")} and more` : ""}.`,
    ),
    h1: `Artworks, ${name}`,
    paragraphs: c.artworks.map((a) => `${a.title}, by ${a.artists.map((x) => x.name).join(", ")}`),
    links: c.artworks.map((a) => ({ href: `${base}/artworks/${a.id}`, text: a.title })),
    crumbs: [edCrumb, { name: "Artworks", path: `${base}/artworks` }],
    lastmod,
  });

  const artistText = c.artists.length
    ? c.artists.map((a) => `${a.name}${a.institution ? `, ${a.institution}` : ""}`)
    : (fallback.institutionsWithArtists ?? []).map((i) => `${i.institution}: ${i.artists}`);
  const institutions = c.institutions.length ? c.institutions : fallback.institutions;
  pages.push({
    path: `${base}/artists`,
    title: `Artists and art schools | ${name}`,
    description: summary(
      `The student artists of the ${name}${institutions.length ? `, from ${institutions.length} art institutions across India including ${institutions.slice(0, 3).join(", ")}` : ""}.`,
    ),
    h1: `Artists, ${name}`,
    paragraphs: artistText.length ? artistText : institutions,
    crumbs: [edCrumb, { name: "Artists", path: `${base}/artists` }],
    lastmod,
  });

  pages.push({
    path: `${base}/venue`,
    title: `Venues | ${name}`,
    description: summary(
      `Where the ${name} was shown in Kochi${c.venues.length ? `: ${c.venues.map((v) => v.name).join(", ")}` : ""}.`,
    ),
    h1: `Venues, ${name}`,
    paragraphs: c.venues.map((v) => `${v.name}${v.address ? `, ${v.address}` : ""}`),
    links: c.venues.map((v) => ({ href: `${base}/venue/${v.id}`, text: v.name })),
    crumbs: [edCrumb, { name: "Venues", path: `${base}/venue` }],
    lastmod,
  });

  for (const a of c.artworks) {
    const path = `${base}/artworks/${a.id}`;
    const by = a.artists.map((x) => x.name).join(", ");
    const byShort = a.artists.length > 2 ? `${a.artists[0].name} and others` : by;
    const desc = paras(a.description);
    pages.push({
      path,
      title: `${a.title}${byShort ? ` by ${byShort}` : ""} | ${name}`,
      description: summary(desc.join(" "), `${a.title} by ${by}, shown at the ${name}.`),
      h1: a.title,
      paragraphs: [
        ...(by ? [`By ${a.artists.map((x) => (x.institution ? `${x.name} (${x.institution})` : x.name)).join(", ")}`] : []),
        ...desc,
        ...(a.materials.length ? [`Materials: ${a.materials.join("; ")}`] : []),
        ...(a.venue ? [`Venue: ${a.venue}`] : []),
      ],
      image: a.image,
      jsonLd: [
        {
          "@type": "VisualArtwork",
          "@id": abs(path) + "#artwork",
          name: a.title,
          url: abs(path),
          ...(desc.length ? { description: summary(desc.join(" ")) } : {}),
          creator: a.artists.map((x) => ({
            "@type": "Person",
            name: x.name,
            ...(x.institution ? { affiliation: { "@type": "EducationalOrganization", name: x.institution } } : {}),
          })),
          ...(a.materials.length ? { artMedium: a.materials.join("; ") } : {}),
          ...(a.image ? { image: a.image } : {}),
          isPartOf: { "@id": abs(base) + "#event" },
        },
      ],
      crumbs: [edCrumb, { name: "Artworks", path: `${base}/artworks` }, { name: a.title, path }],
      lastmod,
    });
  }

  for (const k of c.curators) {
    const path = `${base}/curators/${k.id}`;
    const bio = paras(k.bio);
    const note = paras(k.noteBody ?? k.note);
    pages.push({
      path,
      title: `${k.name}, curator | ${name}`,
      description: summary(bio.join(" "), note.join(" "), `${k.name}, curator at the ${name}.`),
      h1: k.name,
      paragraphs: [...(k.region ? [`Curator, ${k.region}`] : []), ...bio, ...note],
      image: k.image,
      jsonLd: [
        {
          "@type": "Person",
          "@id": abs(path) + "#person",
          name: k.name,
          url: abs(path),
          jobTitle: "Curator",
          ...(bio.length ? { description: summary(bio.join(" ")) } : {}),
          ...(k.image ? { image: k.image } : {}),
        },
      ],
      crumbs: [edCrumb, { name: "Curators", path: `${base}/curators` }, { name: k.name, path }],
      lastmod,
    });
  }

  for (const v of c.venues) {
    const path = `${base}/venue/${v.id}`;
    const history = paras(v.description);
    pages.push({
      path,
      title: `${v.name}, Kochi | ${name}`,
      description: summary(history.join(" "), `${v.name}, a venue of the ${name} in Kochi.`),
      h1: v.name,
      paragraphs: [...(v.address ? [v.address] : []), ...history],
      image: v.image,
      jsonLd: [
        {
          "@type": "Place",
          "@id": abs(path) + "#place",
          name: v.name,
          url: abs(path),
          ...(history.length ? { description: summary(history.join(" ")) } : {}),
          address: v.address || { "@type": "PostalAddress", addressLocality: "Kochi", addressRegion: "Kerala", addressCountry: "IN" },
          ...(v.image ? { image: v.image } : {}),
        },
      ],
      crumbs: [edCrumb, { name: "Venues", path: `${base}/venue` }, { name: v.name, path }],
      lastmod,
    });
  }
  return pages;
}

// ---------- HTML ----------

/** Replace exactly one match, or fail the build: index.html changed shape. */
function swap(html: string, re: RegExp, to: string): string {
  if (!re.test(html)) throw new Error(`[prerender] index.html no longer matches ${re}`);
  return html.replace(re, to);
}

function render(template: string, p: Page): string {
  const url = abs(p.path === "/" ? "/" : p.path);
  const meta = (attr: string, key: string) => new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  let html = template;
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);
  html = swap(html, meta("name", "description"), `$1${esc(p.description)}$2`);
  html = swap(html, meta("property", "og:title"), `$1${esc(p.title)}$2`);
  html = swap(html, meta("property", "og:description"), `$1${esc(p.description)}$2`);
  html = swap(html, meta("name", "twitter:title"), `$1${esc(p.title)}$2`);
  html = swap(html, meta("name", "twitter:description"), `$1${esc(p.description)}$2`);
  if (p.image) {
    html = swap(html, meta("property", "og:image"), `$1${esc(p.image)}$2`);
    html = swap(html, meta("name", "twitter:image"), `$1${esc(p.image)}$2`);
    // The default image's size and alt no longer apply.
    html = html.replace(/\s*<meta\s+property="og:image:(width|height|alt)"[^>]*\/>/g, "");
  }

  const graph: Record<string, unknown>[] = [
    { "@type": "WebPage", "@id": url, url, name: p.title, description: p.description, isPartOf: { "@id": `${ORIGIN}/#website` }, inLanguage: "en" },
    ...(p.jsonLd ?? []),
  ];
  if (p.crumbs?.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [{ name: SITE, path: "/" }, ...p.crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: abs(c.path),
      })),
    });
  }
  const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  // Home is also the fallback for routes without a file (e.g. workshop pages), so it names no URL.
  const isHome = p.path === "/";
  const head = [
    ...(isHome
      ? []
      : [
          `<link rel="canonical" href="${esc(url)}" />`,
          `<meta property="og:url" content="${esc(url)}" />`,
          `<script type="application/ld+json">${ld}</script>`,
        ]),
    // Crawler copy only; React replaces #root before anyone needs to read it.
    `<style>.sb-prerender{display:none}</style>`,
  ].join("\n    ");
  html = swap(html, /<\/head>/, `    ${head}\n  </head>`);

  const body = [
    `<main class="sb-prerender">`,
    p.crumbs?.length
      ? `<nav aria-label="Breadcrumb"><a href="/">${SITE}</a>${p.crumbs.map((c) => ` › <a href="${esc(c.path)}">${esc(c.name)}</a>`).join("")}</nav>`
      : "",
    `<h1>${esc(p.h1)}</h1>`,
    ...p.paragraphs.map((t) => `<p>${esc(t)}</p>`),
    p.links?.length ? `<ul>${p.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join("")}</ul>` : "",
    `</main>`,
  ]
    .filter(Boolean)
    .join("");
  return swap(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`);
}

function sitemap(pages: Page[]): string {
  // Older editions' tabs without catalogue data stay reachable, but aren't advertised.
  const urls = pages
    .filter((p) => p.paragraphs.length > 0)
    .map((p) => `  <url><loc>${esc(abs(p.path))}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// ---------- main ----------

const template = readFileSync(join(DIST, "index.html"), "utf8");
const cats = await loadCatalogues();
const pages = [...staticPages(cats), ...cats.flatMap(editionPages)];

const seen = new Set<string>();
for (const p of pages) {
  if (seen.has(p.path)) throw new Error(`[prerender] duplicate route ${p.path}`);
  seen.add(p.path);
  // "/" stays in dist/index.html so the SPA fallback for unknown URLs also carries the home copy.
  const file = p.path === "/" ? join(DIST, "index.html") : join(DIST, p.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(template, p));
}
writeFileSync(join(DIST, "sitemap.xml"), sitemap(pages));
console.log(`[prerender] ${pages.length} pages and sitemap.xml written`);
