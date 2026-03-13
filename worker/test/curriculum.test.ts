import { describe, it, expect } from "vitest";
import { getChapter, CHAPTERS } from "../src/curriculum";

describe("curriculum", () => {
  it("has 10 chapters", () => {
    expect(CHAPTERS.length).toBe(10);
  });

  it("getChapter returns chapter by number", () => {
    const ch = getChapter(1);
    expect(ch.number).toBe(1);
    expect(ch.titleEn).toContain("Alphabet");
  });

  it("getChapter returns null for invalid chapter", () => {
    expect(getChapter(0)).toBeNull();
    expect(getChapter(11)).toBeNull();
  });
});
