import { describe, expect, it } from "vitest";
import { getEditionOverview } from "./editions";

describe("editions data", () => {
  it("provides clean schema and chronological nextId for all editions", () => {
    const ed2014 = getEditionOverview("2014-15");
    expect(ed2014.id).toBe("2014-15");
    expect(ed2014.nextId).toBe("2016-17");
    expect(ed2014.team.length).toBe(3); // 3 columns
    expect(ed2014.institutions.length).toBe(38);
    // Gallery images come from catalogue snapshots / assets, not static fallbacks.
    expect(ed2014.galleryImages.length).toBe(0);

    const ed2016 = getEditionOverview("2016-17");
    expect(ed2016.id).toBe("2016-17");
    expect(ed2016.nextId).toBe("2018-19");
    expect(ed2016.title).toBe("Later the atelier ate her");
    expect(ed2016.team.length).toBe(2); // 2 columns
    expect(ed2016.galleryImages.length).toBe(0);

    const ed2018 = getEditionOverview("2018-19");
    expect(ed2018.id).toBe("2018-19");
    expect(ed2018.nextId).toBe("2020-21");
    expect(ed2018.title).toBe("Making as Thinking");
    expect(ed2018.curatorialNote).toBeDefined();
    expect(ed2018.curatorialNote?.paragraphs.length).toBe(4);
    expect(ed2018.downloads?.length).toBe(2);

    const ed2020 = getEditionOverview("2020-21");
    expect(ed2020.id).toBe("2020-21");
    expect(ed2020.nextId).toBe("2022-23");
    expect(ed2020.title).toBe("States of Disarray: Practice as Restitution");
    expect(ed2020.curatorBios?.length).toBe(5);

    const ed2022 = getEditionOverview("2022-23");
    expect(ed2022.id).toBe("2022-23");
    expect(ed2022.nextId).toBe("2025-26");
    expect(ed2022.title).toBe("In the Making");
    expect(ed2022.curatorBios?.length).toBe(7);
    expect(ed2022.institutionsWithArtists?.length).toBe(54);
    expect(ed2022.downloads?.length).toBe(1);

    const ed2025 = getEditionOverview("2025-26");
    expect(ed2025.id).toBe("2025-26");
    expect(ed2025.nextId).toBeUndefined();
    expect(ed2025.team.length).toBe(3);
    // Column 1: Director of Programmes, Programme Managers, Programmes Assistants
    expect(ed2025.team[0][0][0]).toBe("Director of Programmes");
    expect(ed2025.team[0][1][0]).toBe("Programme Managers");
    expect(ed2025.team[0][2][0]).toBe("Programmes Assistants");
    // Column 2: Production Managers, Production Assistants, Accounts Manager
    expect(ed2025.team[1][0][0]).toBe("Production Managers");
    expect(ed2025.team[1][1][0]).toBe("Production Assistants");
    expect(ed2025.team[1][2][0]).toBe("Accounts Manager");
    // Column 3: Social Media and Catalogue, Web Design and Services
    expect(ed2025.team[2][0][0]).toBe("Social Media and Catalogue");
    expect(ed2025.team[2][1][0]).toBe("Web Design and Services");
    // Current org team is frontend-authoritative (not CMS).
    expect(ed2025.team[0][2]).toEqual([
      "Programmes Assistants",
      "Nikhita Thevannoor",
      "Maanav Jalan",
    ]);
    expect(ed2025.team[2][1].slice(1)).toEqual([
      "Abhinil Agarwal",
      "Anand Peter",
      "Prajesh MP",
      "Vishnulal CR",
    ]);
  });
});

