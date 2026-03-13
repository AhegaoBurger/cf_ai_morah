import { describe, it, expect } from "vitest";
import { parseTags, stripTags } from "../src/tags";

describe("parseTags", () => {
  it("extracts REMEMBER tags", () => {
    const text = "Great job! [REMEMBER: lives in Tel Aviv]\nKeep going!";
    const result = parseTags(text);
    expect(result.remember).toEqual(["lives in Tel Aviv"]);
  });

  it("extracts VOCAB_KNOWN tags", () => {
    const text = "You know שלום well. [VOCAB_KNOWN: שלום]";
    const result = parseTags(text);
    expect(result.vocabKnown).toEqual(["שלום"]);
  });

  it("extracts VOCAB_STRUGGLE tags", () => {
    const text = "Let's practice more. [VOCAB_STRUGGLE: תודה]";
    const result = parseTags(text);
    expect(result.vocabStruggle).toEqual(["תודה"]);
  });

  it("extracts multiple tags of same type", () => {
    const text = "[VOCAB_KNOWN: שלום] and [VOCAB_KNOWN: תודה]";
    const result = parseTags(text);
    expect(result.vocabKnown).toEqual(["שלום", "תודה"]);
  });

  it("returns empty arrays when no tags", () => {
    const result = parseTags("Just a normal response.");
    expect(result.remember).toEqual([]);
    expect(result.vocabKnown).toEqual([]);
    expect(result.vocabStruggle).toEqual([]);
  });
});

describe("stripTags", () => {
  it("removes all tag patterns from text", () => {
    const text = "Great! [REMEMBER: lives in Haifa]\nYou know [VOCAB_KNOWN: שלום]";
    expect(stripTags(text)).toBe("Great! \nYou know ");
  });
});
