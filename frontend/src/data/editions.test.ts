import { describe, expect, it } from "vitest";
import { TEAM_COLS, getEditionOverview } from "./editions";

describe("editions data", () => {
  it("includes correct 2025-26 team members with correct spellings", () => {
    const allMembers = TEAM_COLS.flatMap((col) => col.flatMap(([, ...people]) => people));
    expect(allMembers).toContain("Ananthan Suresh");
    expect(allMembers).toContain("Abhinil Agarwal");
    expect(allMembers).toContain("Mario D'Souza");
    expect(allMembers).toContain("Mashoor Ali M");
    expect(allMembers).toContain("Rebecca Martin");
    expect(allMembers).toContain("Nikhita Thevanoor");
    expect(allMembers).toContain("Maanav Jalan");
    expect(allMembers).toContain("Harshada Vijay");
    expect(allMembers).toContain("DC Charan");
    expect(allMembers).toContain("Hiran Unnikrishnan");
    expect(allMembers).toContain("Niyas Issahak");
    expect(allMembers).toContain("Anzil Muhammed K");
    expect(allMembers).toContain("Mishal MA");
    expect(allMembers).toContain("Anand Peter");
    expect(allMembers).toContain("Prajesh MP");
    expect(allMembers).toContain("Vishnulal CR");
  });

  it("contains all 3 columns with matching roles", () => {
    expect(TEAM_COLS).toHaveLength(3);
    const col1Roles = TEAM_COLS[0].map(([r]) => r);
    const col2Roles = TEAM_COLS[1].map(([r]) => r);
    const col3Roles = TEAM_COLS[2].map(([r]) => r);

    expect(col1Roles).toEqual([
      "Director of Programmes",
      "Programme Managers",
      "Programmes Assistants",
    ]);
    expect(col2Roles).toEqual([
      "Production Managers",
      "Production Assistants",
      "Accounts Manager",
    ]);
    expect(col3Roles).toEqual([
      "Social Media and Catalogue",
      "Web Design and Services",
    ]);
  });

  it("provides overview data for 2025-26 edition with team", () => {
    const overview = getEditionOverview("2025-26");
    expect(overview.team).toEqual(TEAM_COLS);
  });
});
