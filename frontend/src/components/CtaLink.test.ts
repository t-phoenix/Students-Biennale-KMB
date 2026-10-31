import { describe, it, expect } from "vitest";
import { resolveCtaSpacing, resolveCtaDirection } from "./CtaLink";

describe("CtaLink typography & Figma tokens resolution", () => {
  it("resolves Explore Edition with exact Figma letter-spacing (nodes 1445-316)", () => {
    // Line 1: EXPLORE = 13.5%, Line 2: EDITION = 20%
    const spacing = resolveCtaSpacing(["EXPLORE", "EDITION"]);
    expect(spacing).toEqual(["0.135em", "0.2em"]);
  });

  it("resolves View More with exact Figma letter-spacing and direction (node 1445-352)", () => {
    // Line 1: VIEW = 24%, Line 2: MORE = 13.5%
    const spacing = resolveCtaSpacing(["VIEW", "MORE"]);
    expect(spacing).toEqual(["0.24em", "0.135em"]);
    expect(resolveCtaDirection(["VIEW", "MORE"])).toBe("down");
  });

  it("resolves Read More with exact Figma letter-spacing (node 1445-297)", () => {
    // Line 1: READ = 22%, Line 2: MORE = 13.5%
    const spacing = resolveCtaSpacing(["READ", "MORE"]);
    expect(spacing).toEqual(["0.22em", "0.135em"]);
    expect(resolveCtaDirection(["READ", "MORE"])).toBe("right");
  });

  it("resolves Next Artwork with exact Figma letter-spacing (node 1445-371)", () => {
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
