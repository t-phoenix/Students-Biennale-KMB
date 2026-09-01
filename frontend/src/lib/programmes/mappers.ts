import type { ArtworkCard, PastWorkshop } from "../../data/site";
import type { ResidencySlide } from "../../components/ResidenciesBand";
import { EMPTY_PROGRAMMES } from "./fallbacks";
import type {
  AwardWinnerCard,
  AwardWinnerRow,
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

export function parseAwardees(
  body: string | null,
): { name: string; artwork: string; institution: string; image?: string }[] {
  const raw = (body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const winners: { name: string; artwork: string; institution: string; image?: string }[] = [];
  let pending: { name: string; artwork: string; institution: string; image?: string } | null = null;

  const extractImage = (line: string) => {
    const match = line.match(/^(.+?)\s+\[img:(.+?)\]\s*$/);
    if (!match) return { text: line, image: undefined as string | undefined };
    return { text: match[1].trim(), image: match[2].trim() };
  };

  const flush = () => {
    if (pending?.name) winners.push(pending);
    pending = null;
  };

  for (const line of raw) {
    const { text: strippedLine, image: lineImage } = extractImage(line.replace(/^[-•]\s*/, "").trim());
    const stripped = strippedLine;
    if (/^tata trusts/i.test(stripped) || /^format/i.test(stripped)) continue;

    const withInst = stripped.match(/^(.+?)\s+[—–-]\s+(.+?)\s+\((.+?)\)\.?$/);
    const withoutInst = stripped.match(/^(.+?)\s+[—–-]\s+(.+)$/);

    if (withInst) {
      flush();
      winners.push({
        name: oneLine(withInst[1]),
        artwork: oneLine(withInst[2]),
        institution: oneLine(withInst[3]).replace(/\.$/, ""),
        image: lineImage,
      });
      continue;
    }
    if (withoutInst) {
      flush();
      pending = {
        name: oneLine(withoutInst[1]),
        artwork: oneLine(withoutInst[2]),
        institution: "",
        image: lineImage,
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

export function serializeAwardees(
  heading: string,
  winners: { name: string; artwork: string; institution: string; image?: string }[],
): string {
  const lines = winners.map((winner) => {
    const core = `- ${winner.name} — ${winner.artwork}`;
    const withInst = winner.institution ? `${core} (${winner.institution})` : core;
    return winner.image ? `${withInst} [img:${winner.image}]` : withInst;
  });
  return `${heading}\n\n${lines.join("\n")}`;
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
  if (stripS(na) === stripS(nb)) return true;
  // "Expression of Fragility" ↔ "Expressions of Fragility"
  const compact = (value: string) => stripS(value).replace(/\s+/g, "");
  return compact(na) === compact(nb);
}

export function enrichAwardWinners(
  winners: AwardWinnerCard[],
  artworks: ArtworkCard[],
): AwardWinnerCard[] {
  return winners.map((winner) => {
    const artwork = winner.artworkId
      ? artworks.find((item) => item.id === winner.artworkId)
      : artworks.find((item) => titlesMatch(item.title, winner.artwork));

    const linkedArtists =
      winner.artists?.map((artist) => {
        const fromArt = artwork?.artists.find((item) => namesMatch(item.name, artist.name));
        return {
          name: fromArt?.name ?? artist.name,
          institution: fromArt?.institution || artist.institution || "",
        };
      }) ?? [];

    const artists =
      linkedArtists.length > 0
        ? linkedArtists
        : artwork?.artists.map((a) => ({ name: a.name, institution: a.institution })) ??
          [{ name: winner.name, institution: winner.institution }];

    const primary = artists[0] ?? { name: winner.name, institution: winner.institution };

    return {
      ...winner,
      name: primary.name,
      artwork: artwork?.title ?? winner.artwork,
      institution: primary.institution,
      artworkId: winner.artworkId || artwork?.id || slugify(winner.artwork),
      image: artwork?.image || winner.image || AWARD_FALLBACK_IMAGE,
      artists,
      venue: artwork?.venue || winner.venue,
      year: artwork?.year || winner.year,
      dimensions: artwork?.dimensions || winner.dimensions,
      materials: artwork?.materials?.length ? artwork.materials : winner.materials,
      description: artwork?.description || winner.description,
    };
  });
}

function mapAwardWinnerRows(rows: AwardWinnerRow[]): AwardWinnerCard[] {
  return rows.map((row) => {
    const artists = row.artists.map((artist) => ({
      name: artist.name,
      institution: artist.institution ?? "",
      personId: artist.person_id,
    }));
    const primary = artists[0] ?? { name: "", institution: "" };
    return {
      id: row.id,
      name: primary.name,
      artwork: row.artwork_title || "",
      institution: primary.institution,
      artworkId: row.artwork_id,
      image: "",
      artists,
    };
  });
}

function awardsForProgramme(
  programme: ProgrammeRow | undefined,
  winners: AwardWinnerRow[],
): AwardWinnerCard[] {
  if (!programme) return [];
  const structured = winners
    .filter((row) => row.programme_id === programme.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (structured.length) return mapAwardWinnerRows(structured);
  return parseAwardees(programme.body ?? null).map((winner) => ({
    ...winner,
    artworkId: slugify(winner.artwork),
    image: winner.image || AWARD_FALLBACK_IMAGE,
    artists: [{ name: winner.name, institution: winner.institution }],
  }));
}

function mapWorkshop(row: ProgrammeRow, assets: ProgrammeAsset[]): PastWorkshop {
  const cover = firstAsset(row.id, assets, ["hero", "cover"]);
  const gallery = assetsFor(row.id, assets, "gallery");
  return {
    id: row.slug,
    title: row.title,
    year: oneLine(row.dates) || "",
    facilitators: formatFacilitators(row),
    location: oneLine(row.place) || undefined,
    heroImage: cover,
    description: (row.body ?? "").trim() || undefined,
    galleryImages: gallery.length ? gallery : undefined,
  };
}

function mapUpcoming(row: ProgrammeRow, assets: ProgrammeAsset[]): UpcomingWorkshop {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: oneLine(row.dates),
    place: oneLine(row.place),
    blurb: oneLine(row.summary) || oneLine((row.body ?? "").split(/\n\s*\n/)[0]),
    image: firstAsset(row.id, assets, ["cover", "hero"]) ?? "",
  };
}

/** Build residencies-band teaser from full description until it fills the card. */
function residencyCardCopy(description: string, maxChars = 480): string {
  const prose = oneLine(description.replace(/\n+/g, " "));
  if (!prose) return "";
  if (prose.length <= maxChars) return prose;
  const slice = prose.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (lastSpace > Math.floor(maxChars * 0.6) ? slice.slice(0, lastSpace) : slice).trim();
  return `${clipped}…`;
}

function mapResidency(row: ProgrammeRow, assets: ProgrammeAsset[]): ResidencyProgramme {
  const cover = firstAsset(row.id, assets, ["hero", "cover"]);
  const gallery = assetsFor(row.id, assets, "gallery");
  const description = (row.body ?? "").trim();

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    host: oneLine(row.host) || formatFacilitators(row),
    period: oneLine(row.dates),
    venue: oneLine(row.place),
    awardees: oneLine(row.awardees),
    copy: residencyCardCopy(description),
    description,
    heroImage: cover || "",
    galleryImages: gallery,
    moreHref: `/programmes/residencies?residency=${row.slug}`,
  };
}

function scholarImage(name: string): string {
  const slug = slugify(name);
  return RAZA_PHOTOS[slug] ?? `/programmes/raza-${slug}.jpg`;
}

export function parseRazaProgramme(row: ProgrammeRow | undefined): RazaProgramme {
  const empty = EMPTY_PROGRAMMES.raza;
  if (!row) return empty;

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
    title: row.title || empty.title,
    subtitle: RAZA_SUBTITLE,
    intro: intro.length ? intro : empty.intro,
    scholars: scholars.length ? scholars : empty.scholars,
    closing: closing.length ? closing : empty.closing,
  };
}

export function mapProgrammes(
  rows: ProgrammeRow[],
  assets: ProgrammeAsset[],
  awardWinners: AwardWinnerRow[] = [],
): MappedProgrammes {
  const sorted = [...rows].sort((a, b) => sortKey(a) - sortKey(b) || a.title.localeCompare(b.title));
  const workshops = sorted.filter((row) => row.subtype === "workshop");
  const upcoming = workshops.filter((row) => row.state === "upcoming");
  const past = workshops.filter((row) => row.state !== "upcoming");
  const residencies = sorted
    .filter((row) => row.subtype === "residency")
    .map((row) => mapResidency(row, assets));
  const razaRow = sorted.find((row) => isRazaResidency(row));
  const national = sorted.find((row) => row.subtype === "national-award");
  const international = sorted.find((row) => row.subtype === "international-award");

  return {
    upcomingWorkshops: upcoming.map((row) => mapUpcoming(row, assets)),
    pastWorkshops: past.map((row) => mapWorkshop(row, assets)),
    awardsInternational: awardsForProgramme(international, awardWinners),
    awardsNational: awardsForProgramme(national, awardWinners),
    raza: parseRazaProgramme(razaRow),
    residencies,
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
