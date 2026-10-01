import { describe, expect, it } from "vitest";
import { enrichAwardWinners, mapProgrammes } from "./mappers";
import type { ProgrammeAsset, ProgrammeRow } from "./types";
import type { ArtworkCard } from "../../data/site";

describe("programmes upcoming workshops mapping", () => {
  it("correctly separates single upcoming workshop from past workshops", () => {
    const rows: ProgrammeRow[] = [
      {
        id: "ws-1",
        slug: "workshop-1",
        title: "workshop 01",
        dates: "12 - 14 March 2026",
        place: "Jogen Das, Anga Art Collective",
        summary: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        body: "Lorem Ipsum is simply dummy text...",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "upcoming",
        sort_order: 1,
      },
      {
        id: "ws-2",
        slug: "workshop-2",
        title: "workshop 02",
        dates: "2025",
        place: "Assam",
        summary: "Past workshop summary",
        body: "Past workshop body",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "past",
        sort_order: 2,
      },
    ];

    const assets: ProgrammeAsset[] = [
      {
        entityId: "ws-1",
        role: "cover",
        url: "/programmes/single-workshop.jpg",
        sortOrder: 0,
      },
    ];

    const result = mapProgrammes(rows, assets);
    expect(result.upcomingWorkshops.length).toBe(1);
    expect(result.upcomingWorkshops[0].title).toBe("workshop 01");
    expect(result.upcomingWorkshops[0].date).toBe("12 - 14 March 2026");
    expect(result.upcomingWorkshops[0].place).toBe("Jogen Das, Anga Art Collective");
    expect(result.upcomingWorkshops[0].image).toBe("/programmes/single-workshop.jpg");
    expect(result.pastWorkshops.length).toBe(1);
  });

  it("handles multiple upcoming workshops", () => {
    const rows: ProgrammeRow[] = [
      {
        id: "ws-1",
        slug: "workshop-1",
        title: "workshop 01",
        dates: "12 - 14 March 2026",
        place: "Delhi",
        summary: "Summary 1",
        body: "",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "upcoming",
        sort_order: 1,
      },
      {
        id: "ws-2",
        slug: "workshop-2",
        title: "workshop 02",
        dates: "20 - 22 April 2026",
        place: "Jaipur",
        summary: "Summary 2",
        body: "",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "upcoming",
        sort_order: 2,
      },
    ];

    const result = mapProgrammes(rows, []);
    expect(result.upcomingWorkshops.length).toBe(2);
    expect(result.upcomingWorkshops[0].title).toBe("workshop 01");
    expect(result.upcomingWorkshops[1].title).toBe("workshop 02");
  });

  it("orders past workshop gallery images and leaves upcoming workshops unchanged", () => {
    const rows: ProgrammeRow[] = [
      {
        id: "ws-upcoming",
        slug: "upcoming-workshop",
        title: "Upcoming workshop",
        dates: "12 - 14 March 2026",
        place: "Delhi",
        summary: "Upcoming summary",
        body: "Upcoming body",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "upcoming",
        sort_order: 1,
      },
      {
        id: "ws-past",
        slug: "past-workshop",
        title: "Past workshop",
        dates: "2025",
        place: "Kochi",
        summary: "Past summary",
        body: "Past body",
        host: null,
        awardees: null,
        published: true,
        programme_facilitators: null,
        subtype: "workshop",
        state: "past",
        sort_order: 2,
      },
    ];
    const assets: ProgrammeAsset[] = [
      { entityId: "ws-upcoming", role: "cover", url: "/programmes/upcoming-cover.jpg", sortOrder: 0 },
      { entityId: "ws-upcoming", role: "gallery", url: "/programmes/upcoming-gallery.jpg", sortOrder: 1 },
      { entityId: "ws-past", role: "gallery", url: "/programmes/gallery-second.jpg", sortOrder: 2 },
      { entityId: "ws-past", role: "cover", url: "/programmes/past-cover.jpg", sortOrder: 0 },
      { entityId: "ws-past", role: "gallery", url: "/programmes/gallery-first.jpg", sortOrder: 1 },
    ];

    const result = mapProgrammes(rows, assets);

    expect(result.upcomingWorkshops).toHaveLength(1);
    expect(result.upcomingWorkshops[0]).toMatchObject({
      title: "Upcoming workshop",
      date: "12 - 14 March 2026",
      place: "Delhi",
      image: "/programmes/upcoming-cover.jpg",
    });
    expect(result.pastWorkshops).toHaveLength(1);
    expect(result.pastWorkshops[0].heroImage).toBe("/programmes/past-cover.jpg");
    expect(result.pastWorkshops[0].galleryImages).toEqual([
      "/programmes/gallery-first.jpg",
      "/programmes/gallery-second.jpg",
    ]);
  });
});

describe("award card images", () => {
  const artwork = {
    id: "artwork-ginning-justice",
    title: "Ginning Justice",
    venue: "BMS Warehouse",
    year: "2025 – 26",
    description: "",
    artists: [{ name: "Kailash Khanjode", institution: "Nagpur" }],
    materials: [],
    dimensions: "",
    image: "/covers/ginning-cover.jpg",
  } satisfies ArtworkCard;

  it("uses a chosen artwork image ahead of the catalogue cover", () => {
    const [card] = enrichAwardWinners(
      [
        {
          name: "Kailash Khanjode",
          artwork: "Ginning Justice",
          institution: "Nagpur",
          artworkId: artwork.id,
          image: "/covers/ginning-detail.jpg",
        },
      ],
      [artwork],
    );
    expect(card.image).toBe("/covers/ginning-detail.jpg");
  });

  it("keeps the catalogue cover when no award image is chosen", () => {
    const [card] = enrichAwardWinners(
      [
        {
          name: "Kailash Khanjode",
          artwork: "Ginning Justice",
          institution: "Nagpur",
          artworkId: artwork.id,
          image: "",
        },
      ],
      [artwork],
    );
    expect(card.image).toBe("/covers/ginning-cover.jpg");
  });
});
