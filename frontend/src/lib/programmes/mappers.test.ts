import { describe, expect, it } from "vitest";
import { mapProgrammes } from "./mappers";
import type { ProgrammeRow, ProgrammeAsset } from "./types";

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
});
