import { describe, expect, it } from "vitest";
import { resolveHomeProgrammesBanner, resolveProgrammesHeroCovers } from "./resolve";
import {
  HOME_PROGRAMMES_BANNER_FALLBACK,
  PROGRAMMES_HERO_FALLBACK,
  type ProgrammesCover,
} from "./types";

const sample: ProgrammesCover[] = [
  { id: "a", image_url: "/a.jpg", sort_order: 0, show_on_home: false },
  { id: "b", image_url: "/b.jpg", sort_order: 1, show_on_home: true },
  { id: "c", image_url: "/c.jpg", sort_order: 2, show_on_home: false },
];

describe("resolveProgrammesHeroCovers", () => {
  it("returns static fallback when empty", () => {
    const result = resolveProgrammesHeroCovers([]);
    expect(result).toEqual([
      {
        id: "fallback",
        image_url: PROGRAMMES_HERO_FALLBACK,
        sort_order: 0,
        show_on_home: false,
      },
    ]);
  });

  it("returns covers unchanged when present", () => {
    expect(resolveProgrammesHeroCovers(sample)).toEqual(sample);
  });
});

describe("resolveHomeProgrammesBanner", () => {
  it("returns static fallback when empty", () => {
    expect(resolveHomeProgrammesBanner([])).toBe(HOME_PROGRAMMES_BANNER_FALLBACK);
  });

  it("picks the show_on_home cover", () => {
    expect(resolveHomeProgrammesBanner(sample)).toBe("/b.jpg");
  });

  it("falls back to first cover when none marked for home", () => {
    const covers = sample.map((cover) => ({ ...cover, show_on_home: false }));
    expect(resolveHomeProgrammesBanner(covers)).toBe("/a.jpg");
  });
});
