import { describe, expect, it } from "vitest";
import { resolveHomeProgrammesBanner, resolveProgrammesHeroCovers } from "./resolve";
import type { ProgrammesCover } from "./types";

const sample: ProgrammesCover[] = [
  { id: "a", image_url: "/a.jpg", sort_order: 0, show_on_home: false },
  { id: "b", image_url: "/b.jpg", sort_order: 1, show_on_home: true },
  { id: "c", image_url: "/c.jpg", sort_order: 2, show_on_home: false },
];

describe("resolveProgrammesHeroCovers", () => {
  it("returns empty array when no covers", () => {
    expect(resolveProgrammesHeroCovers([])).toEqual([]);
  });

  it("returns covers unchanged when present", () => {
    expect(resolveProgrammesHeroCovers(sample)).toEqual(sample);
  });
});

describe("resolveHomeProgrammesBanner", () => {
  it("returns null when empty", () => {
    expect(resolveHomeProgrammesBanner([])).toBeNull();
  });

  it("picks the show_on_home cover", () => {
    expect(resolveHomeProgrammesBanner(sample)).toBe("/b.jpg");
  });

  it("falls back to first cover when none marked for home", () => {
    const covers = sample.map((cover) => ({ ...cover, show_on_home: false }));
    expect(resolveHomeProgrammesBanner(covers)).toBe("/a.jpg");
  });
});
