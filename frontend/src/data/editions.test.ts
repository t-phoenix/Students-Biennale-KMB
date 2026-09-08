import { describe, expect, it } from "vitest";
import { getEditionOverview } from "./editions";

describe("editions data", () => {
  it("provides clean schema and chronological nextId for all editions", () => {
    const ed2014 = getEditionOverview("2014-15");
    expect(ed2014.id).toBe("2014-15");
    expect(ed2014.nextId).toBe("2016-17");
    expect(ed2014.team.length).toBe(3); // 3 columns
    expect(ed2014.institutions.length).toBe(38);
    expect(ed2014.galleryImages.length).toBe(8);

    const ed2016 = getEditionOverview("2016-17");
    expect(ed2016.id).toBe("2016-17");
    expect(ed2016.nextId).toBe("2018-19");
    expect(ed2016.title).toBe("Later the atelier ate her");
    expect(ed2016.team.length).toBe(2); // 2 columns
    expect(ed2016.galleryImages.length).toBe(8);

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
  });
});
