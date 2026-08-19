import type { ArtworkCard, PastWorkshop } from "../../data/site";
import type { ResidencySlide } from "../../components/ResidenciesBand";
import { FALLBACK_PROGRAMMES } from "./fallbacks";
import type {
  AwardWinnerCard,
  MappedProgrammes,
  ProgrammeAsset,
  ProgrammeRow,
  RazaProgramme,
  RazaScholar,
  ResidencyProgramme,
  UpcomingWorkshop,
} from "./types";

const AWARD_FALLBACK_IMAGE = "/programmes/award.jpg";
const RAZA_SUBTITLE = "te(a)m-plurality, curatorial note by GABAA";
const WORKSHOP_CARD_IMAGES = [
  "/programmes/workshop-1.jpg",
  "/programmes/workshop-2.jpg",
  "/programmes/workshop-3.jpg",
];
const JORAHAAL_SLUG = "anga-art-collective";
const JORAHAAL_HERO = "/programmes/workshop-detail-hero.jpg";
const JORAHAAL_GALLERY = [
  "/programmes/workshop-gallery-1.jpg",
  "/programmes/workshop-gallery-2.jpg",
  "/programmes/workshop-gallery-3.jpg",
  "/programmes/workshop-gallery-4.jpg",
  "/programmes/workshop-gallery-5.jpg",
  "/programmes/workshop-gallery-6.jpg",
  "/programmes/workshop-gallery-7.jpg",
  "/programmes/workshop-gallery-8.jpg",
];
const RESIDENCY_GALLERY = [
  "/programmes/residency-1.jpg",
  "/programmes/residency-2.jpg",
  "/programmes/residency-3.jpg",
  "/programmes/residency-4.jpg",
  "/programmes/residency-5.jpg",
];
const RAZA_PHOTOS: Record<string, string> = {
  "kaki-weiss": "/programmes/raza-kaki-weiss.jpg",
  "nina-durel": "/programmes/raza-nina-durel.jpg",
};

function sortKey(row: ProgrammeRow): number {
  return row.sort_order ?? 9999;
}

function oneLine(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function rawParagraphs(value: string | null | undefined): string[] {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function paragraphs(value: string | null | undefined): string[] {
  return rawParagraphs(value).map((part) => oneLine(part)).filter(Boolean);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatFacilitators(row: ProgrammeRow): string {
  const names = [...(row.programme_facilitators ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => oneLine(item.display_name))
    .filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function assetsFor(id: string, assets: ProgrammeAsset[], role: string): string[] {
  return assets
    .filter((asset) => asset.entityId === id && asset.role === role && asset.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((asset) => asset.url);
}

function firstAsset(id: string, assets: ProgrammeAsset[], roles: string[]): string | undefined {
  for (const role of roles) {
    const found = assetsFor(id, assets, role);
    if (found[0]) return found[0];
  }
  return undefined;
}

function isRazaResidency(row: ProgrammeRow): boolean {
  const blob = `${row.slug} ${row.title} ${row.body ?? ""}`.toLowerCase();
  return (
    blob.includes("marseille") ||
    blob.includes("beaux") ||
    blob.includes("raza") ||
    row.slug.includes("marsei")
  );
}

export function parseAwardees(body: string | null): { name: string; artwork: string; institution: string }[] {
  const raw = (body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const winners: { name: string; artwork: string; institution: string }[] = [];
  let pending: { name: string; artwork: string; institution: string } | null = null;

  const flush = () => {
    if (pending?.name) winners.push(pending);
    pending = null;
  };

  for (const line of raw) {
    const stripped = line.replace(/^[-•]\s*/, "").trim();
    if (/^tata trusts/i.test(stripped) || /^format/i.test(stripped)) continue;

    const withInst = stripped.match(/^(.+?)\s+[—–-]\s+(.+?)\s+\((.+?)\)\.?$/);
    const withoutInst = stripped.match(/^(.+?)\s+[—–-]\s+(.+)$/);

    if (withInst) {
      flush();
      winners.push({
        name: oneLine(withInst[1]),
        artwork: oneLine(withInst[2]),
        institution: oneLine(withInst[3]).replace(/\.$/, ""),
      });
      continue;
    }
    if (withoutInst) {
      flush();
      pending = {
        name: oneLine(withoutInst[1]),
        artwork: oneLine(withoutInst[2]),
        institution: "",
      };
      continue;
    }
    if (pending && stripped.length < 140) {
      pending.institution = oneLine(stripped).replace(/\.$/, "");
      flush();
      continue;
    }
  }
  flush();
  return winners;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[a.length][b.length];
}

function normalizePerson(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizePerson(a);
  const nb = normalizePerson(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = na.split(" ");
  const tb = nb.split(" ");
  const lastA = ta[ta.length - 1];
  const lastB = tb[tb.length - 1];
  const firstA = ta[0];
  const firstB = tb[0];
  if (firstA === firstB && (lastA === lastB || levenshtein(lastA, lastB) <= 2)) return true;
  if (lastA === lastB && firstA[0] === firstB[0] && levenshtein(firstA, firstB) <= 2) return true;
  return false;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[,:]/g, " ")
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const stripS = (value: string) => value.replace(/s\b/g, "");
  return stripS(na) === stripS(nb);
}

export function enrichAwardWinners(
  winners: { name: string; artwork: string; institution: string }[],
  artworks: ArtworkCard[],
): AwardWinnerCard[] {
  return winners.map((winner) => {
    const nameHits = artworks.filter((artwork) =>
      artwork.artists.some((artist) => namesMatch(artist.name, winner.name)),
    );
    const artwork =
      nameHits.find((item) => titlesMatch(item.title, winner.artwork)) ??
      artworks.find((item) => titlesMatch(item.title, winner.artwork) && nameHits.includes(item)) ??
      nameHits[0] ??
      artworks.find((item) => titlesMatch(item.title, winner.artwork));

    const matchedArtist = artwork?.artists.find((artist) => namesMatch(artist.name, winner.name));
    return {
      name: matchedArtist?.name ?? winner.name,
      artwork: artwork?.title ?? winner.artwork,
      institution: matchedArtist?.institution || winner.institution,
      artworkId: artwork?.id ?? slugify(winner.artwork),
      image: artwork?.image || AWARD_FALLBACK_IMAGE,
    };
  });
}

function mapWorkshop(row: ProgrammeRow, assets: ProgrammeAsset[]): PastWorkshop {
  const cover = firstAsset(row.id, assets, ["hero", "cover"]);
  const gallery = assetsFor(row.id, assets, "gallery");
  const isJorahaal = row.slug === JORAHAAL_SLUG || /jorahaal/i.test(row.title);
  return {
    id: row.slug,
    title: row.title,
    year: oneLine(row.dates) || "",
    facilitators: formatFacilitators(row),
    location: oneLine(row.place) || undefined,
    heroImage: cover || (isJorahaal ? JORAHAAL_HERO : undefined),
    description: (row.body ?? "").trim() || undefined,
    galleryImages: gallery.length ? gallery : isJorahaal ? JORAHAAL_GALLERY : undefined,
  };
}

function mapUpcoming(row: ProgrammeRow, assets: ProgrammeAsset[], index: number): UpcomingWorkshop {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: oneLine(row.dates),
    place: oneLine(row.place),
    blurb: oneLine(row.summary) || oneLine((row.body ?? "").split(/\n\s*\n/)[0]),
    image: firstAsset(row.id, assets, ["cover", "hero"]) ?? WORKSHOP_CARD_IMAGES[index % WORKSHOP_CARD_IMAGES.length],
  };
}

function parseResidencyMeta(row: ProgrammeRow): Pick<
  ResidencyProgramme,
  "host" | "period" | "venue" | "awardees" | "description" | "copy"
> {
  const rawLines = (row.body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  let host = formatFacilitators(row);
  let period = oneLine(row.dates);
  let venue = oneLine(row.place);
  let awardees = "";
  const rest: string[] = [];

  for (const line of rawLines) {
    const hostMatch = line.match(/^(?:residency\s+)?host:\s*(.+)$/i);
    const periodMatch = line.match(/^(?:residency\s+)?period:\s*(.+)$/i);
    const venueMatch = line.match(/^venue:\s*(.+)$/i);
    const awardeesMatch = line.match(/^awardees:\s*(.+)$/i);
    if (hostMatch) {
      host = oneLine(hostMatch[1]);
      continue;
    }
    if (periodMatch) {
      period = oneLine(periodMatch[1]);
      continue;
    }
    if (venueMatch) {
      venue = oneLine(venueMatch[1]);
      continue;
    }
    if (awardeesMatch) {
      awardees = oneLine(awardeesMatch[1]);
      continue;
    }
    if (line && line !== row.title) rest.push(line);
  }

  const description = rest.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const firstPara = paragraphs(description)[0] ?? oneLine(row.summary);
  const copy = firstPara.length > 320 ? `${firstPara.slice(0, 319).trim()}…` : firstPara;
  return { host, period, venue, awardees, description, copy };
}

function mapResidency(row: ProgrammeRow, assets: ProgrammeAsset[]): ResidencyProgramme {
  const meta = parseResidencyMeta(row);
  const cover = firstAsset(row.id, assets, ["hero", "cover"]);
  const gallery = assetsFor(row.id, assets, "gallery");
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    host: meta.host,
    period: meta.period,
    venue: meta.venue,
    awardees: meta.awardees,
    copy: meta.copy,
    description: meta.description,
    heroImage: cover || "/programmes/residency-1.jpg",
    galleryImages: gallery.length ? gallery : RESIDENCY_GALLERY,
    moreHref: "/programmes/residencies",
  };
}

function scholarImage(name: string): string {
  const slug = slugify(name);
  return RAZA_PHOTOS[slug] ?? `/programmes/raza-${slug}.jpg`;
}

export function parseRazaProgramme(row: ProgrammeRow | undefined): RazaProgramme {
  const fallback = FALLBACK_PROGRAMMES.raza;
  if (!row) return fallback;

  const skipPara = (para: string) =>
    para === row.title ||
    /^students. biennale 2025/i.test(para) ||
    /^a special residency/i.test(para) ||
    /^(kaki weiss|nina durel):\s*$/i.test(para);

  const intro: string[] = [];
  const scholars: RazaScholar[] = [];
  const closing: string[] = [];
  let phase: "intro" | "names" | "closing" = "intro";

  for (const para of rawParagraphs(row.body)) {
    const collapsed = oneLine(para);
    if (skipPara(collapsed)) continue;

    const nameLines = para
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !skipPara(oneLine(line)));
    const looksLikeNames =
      nameLines.length > 0 &&
      nameLines.every((line) => line.length < 48 && !/[.]/.test(line)) &&
      (phase === "names" || nameLines.some((line) => /weiss|durel/i.test(line)));

    if (phase === "intro" && /were:\s*$/i.test(collapsed)) {
      intro.push(collapsed);
      phase = "names";
      continue;
    }
    if (looksLikeNames) {
      for (const name of nameLines) {
        if (!scholars.some((scholar) => scholar.name.toLowerCase() === name.toLowerCase())) {
          scholars.push({ id: slugify(name), name, image: scholarImage(name) });
        }
      }
      phase = "closing";
      continue;
    }
    if (phase === "closing" || scholars.length) {
      phase = "closing";
      closing.push(collapsed);
      continue;
    }
    intro.push(collapsed);
  }

  return {
    title: row.title || fallback.title,
    subtitle: RAZA_SUBTITLE,
    intro: intro.length ? intro : fallback.intro,
    scholars: scholars.length ? scholars : fallback.scholars,
    closing: closing.length ? closing : fallback.closing,
  };
}

export function mapProgrammes(rows: ProgrammeRow[], assets: ProgrammeAsset[]): MappedProgrammes {
  const sorted = [...rows].sort((a, b) => sortKey(a) - sortKey(b) || a.title.localeCompare(b.title));
  const workshops = sorted.filter((row) => row.subtype === "workshop");
  const upcoming = workshops.filter((row) => row.state === "upcoming");
  const past = workshops.filter((row) => row.state !== "upcoming");
  const residencies = sorted.filter((row) => row.subtype === "residency" && !isRazaResidency(row));
  const razaRow = sorted.find((row) => row.subtype === "residency" && isRazaResidency(row));
  const national = sorted.find((row) => row.subtype === "national-award");
  const international = sorted.find((row) => row.subtype === "international-award");

  return {
    upcomingWorkshops: upcoming.map((row, index) => mapUpcoming(row, assets, index)),
    pastWorkshops: past.map((row) => mapWorkshop(row, assets)),
    awardsInternational: parseAwardees(international?.body ?? null).map((winner) => ({
      ...winner,
      artworkId: slugify(winner.artwork),
      image: AWARD_FALLBACK_IMAGE,
    })),
    awardsNational: parseAwardees(national?.body ?? null).map((winner) => ({
      ...winner,
      artworkId: slugify(winner.artwork),
      image: AWARD_FALLBACK_IMAGE,
    })),
    raza: parseRazaProgramme(razaRow),
    residencies: residencies.map((row) => mapResidency(row, assets)),
  };
}

export function withCatalogueAwards(data: MappedProgrammes, artworks: ArtworkCard[]): MappedProgrammes {
  if (!artworks.length) return data;
  return {
    ...data,
    awardsInternational: enrichAwardWinners(data.awardsInternational, artworks),
    awardsNational: enrichAwardWinners(data.awardsNational, artworks),
  };
}

export function toResidencySlides(residencies: ResidencyProgramme[]): ResidencySlide[] {
  return residencies.map((item) => ({
    id: item.id,
    title: item.title,
    host: item.host,
    period: item.period,
    venue: item.venue,
    awardees: item.awardees,
    copy: item.copy,
    image: item.heroImage,
    moreHref: item.moreHref,
  }));
}

export function findWorkshop(workshops: PastWorkshop[], id: string): number {
  return workshops.findIndex((item) => item.id === id);
}
