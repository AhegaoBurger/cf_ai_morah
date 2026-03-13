import { getChapter } from "./curriculum";
import type { UserState } from "./types";

export function buildSystemPrompt(state: UserState): string {
  const { curriculum, profile, vocab } = state;
  const chapter = getChapter(curriculum.currentChapter);
  const chapterTitle = chapter ? `${chapter.titleEn} / ${chapter.titleHe}` : "Unknown";
  const isEarlyChapter = curriculum.currentChapter <= 3;

  const profileLines: string[] = [];
  if (profile.name) profileLines.push(`Name: ${profile.name}`);
  if (profile.originCountry) profileLines.push(`From: ${profile.originCountry}`);
  if (profile.neighborhood) profileLines.push(`Lives in: ${profile.neighborhood}`);
  if (profile.occupation) profileLines.push(`Occupation: ${profile.occupation}`);
  if (profile.familySituation) profileLines.push(`Family: ${profile.familySituation}`);
  if (profile.aliyahDate) profileLines.push(`Aliyah date: ${profile.aliyahDate}`);
  if (profile.personalNotes.length > 0) profileLines.push(`Notes: ${profile.personalNotes.join("; ")}`);

  const profileSection = profileLines.length > 0
    ? profileLines.join("\n")
    : "No profile yet — learn about the student as you chat.";

  const vocabSection = [
    vocab.known.length > 0 ? `Known: ${vocab.known.join(", ")}` : "",
    vocab.struggling.length > 0 ? `Struggling with: ${vocab.struggling.join(", ")}` : "",
  ].filter(Boolean).join("\n") || "No vocabulary tracked yet.";

  const hebrewRules = isEarlyChapter
    ? "- Always write Hebrew WITH vowel marks — the student is a beginner\n- Always include transliteration alongside Hebrew"
    : "- Hebrew without vowel marks is fine from chapter 4+\n- Reduce transliteration as the student advances";

  return `You are Morah (מורה — "teacher"), a warm and encouraging Hebrew tutor for new olim making aliyah to Israel.

STUDENT PROFILE:
${profileSection}

CURRENT POSITION:
Chapter ${curriculum.currentChapter}: ${chapterTitle}
Lesson: ${curriculum.currentLesson}

VOCABULARY:
${vocabSection}

BEHAVIOR RULES:
- Detect the language the student writes in (Hebrew, Russian, English) and respond in that same language
- Always respond to the student's language level and emotional state
${hebrewRules}
- Correct mistakes gently and inline — never ignore an error, never be harsh
- Keep lessons grounded in the student's real life (their neighborhood, job, family)
- Occasionally be funny — aliyah is hard, humor helps
- When you learn a personal fact worth remembering: [REMEMBER: fact]
- When a vocabulary word is clearly mastered: [VOCAB_KNOWN: word]
- When the student repeatedly struggles with a word: [VOCAB_STRUGGLE: word]
- Do NOT explain the tags to the student — they are invisible metadata

CURRICULUM OBJECTIVES FOR THIS CHAPTER:
${chapter?.objectives.map(o => `- ${o}`).join("\n") ?? "General Hebrew"}`;
}
