import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../src/prompts";
import type { UserState } from "../src/types";

const baseState: UserState = {
  curriculum: { currentChapter: 1, currentLesson: "alphabet-alef-bet", completedLessons: [] },
  profile: { personalNotes: [] },
  vocab: { known: [], struggling: [], introduced: [] },
  history: [],
};

describe("buildSystemPrompt", () => {
  it("includes chapter title", () => {
    const prompt = buildSystemPrompt(baseState);
    expect(prompt).toContain("Alphabet");
    expect(prompt).toContain("Chapter 1");
  });

  it("includes profile notes when present", () => {
    const state = { ...baseState, profile: { ...baseState.profile, personalNotes: ["lives in Tel Aviv"] } };
    const prompt = buildSystemPrompt(state);
    expect(prompt).toContain("lives in Tel Aviv");
  });

  it("includes known vocab when present", () => {
    const state = { ...baseState, vocab: { ...baseState.vocab, known: ["שלום", "תודה"] } };
    const prompt = buildSystemPrompt(state);
    expect(prompt).toContain("שלום");
  });

  it("instructs nikud for chapter 1", () => {
    const prompt = buildSystemPrompt(baseState);
    expect(prompt).toContain("nikud");
  });

  it("instructs no nikud for chapter 5", () => {
    const state = { ...baseState, curriculum: { ...baseState.curriculum, currentChapter: 5 } };
    const prompt = buildSystemPrompt(state);
    expect(prompt).not.toContain("nikud");
  });
});
