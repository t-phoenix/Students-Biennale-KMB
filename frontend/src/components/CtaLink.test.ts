import { describe, it, expect } from "vitest";
import { resolveCtaSpacing, resolveCtaDirection, JUSTIFIED_LOCKUPS } from "./CtaLink";

describe("CtaLink typography & justified lockups", () => {
  it("identifies EXPLORE EDITION as a justified lockup aligning first E with E and last E with N", () => {
    const config = JUSTIFIED_LOCKUPS["EXPLORE EDITION"];
    expect(config).toBeDefined();
    expect(config.baseIndex).toBe(0); // EXPLORE sets the container width
    expect(config.justifiedIndex).toBe(1); // EDITION stretches to align E with E and N with E
    expect(config.baseSpacing).toBe("0.135em");
  });

  it("identifies VIEW MORE as a justified lockup aligning first V with M and last W with E", () => {
    const config = JUSTIFIED_LOCKUPS["VIEW MORE"];
    expect(config).toBeDefined();
    expect(config.baseIndex).toBe(1); // MORE sets the container width
    expect(config.justifiedIndex).toBe(0); // VIEW stretches to align V with M and W with E
    expect(config.baseSpacing).toBe("0.135em");
    expect(resolveCtaDirection(["VIEW", "MORE"])).toBe("down");
  });

  it("identifies READ MORE as a justified lockup aligning first R with M and last D with E", () => {
    const config = JUSTIFIED_LOCKUPS["READ MORE"];
    expect(config).toBeDefined();
    expect(config.baseIndex).toBe(1); // MORE sets the container width
    expect(config.justifiedIndex).toBe(0); // READ stretches to align R with M and D with E
    expect(config.baseSpacing).toBe("0.135em");
    expect(resolveCtaDirection(["READ", "MORE"])).toBe("right");
  });

  it("resolves NEXT ARTWORK with exact Figma letter-spacing (node 1445-371)", () => {
    // Line 1: NEXT = 13.5%, Line 2: ARTWORK = 13.5%
    const spacing = resolveCtaSpacing(["NEXT", "ARTWORK"]);
    expect(spacing).toEqual(["0.135em", "0.135em"]);
    expect(resolveCtaDirection(["NEXT", "ARTWORK"])).toBe("right");
  });

  it("resolves Next Edition and Discover Artworks correctly", () => {
    expect(resolveCtaSpacing(["NEXT", "EDITION"])).toEqual(["0.135em", "0.2em"]);
    expect(resolveCtaSpacing(["DISCOVER", "ARTWORKS"])).toEqual(["0.135em", "0.135em"]);
  });

  it("resolves single word line like NEXT", () => {
    expect(resolveCtaSpacing(["NEXT"])).toEqual(["0.135em"]);
  });

  it("honors explicit spacing overrides when provided", () => {
    const custom = ["0.1em", "0.1em"];
    expect(resolveCtaSpacing(["Students' Biennale", "2023-24"], custom)).toEqual(custom);
  });
});
