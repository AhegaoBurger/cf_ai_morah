# Morah — Hebrew Tutor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a stateful Hebrew tutor agent for new olim on Cloudflare using Workers AI, Durable Objects, and Pages.

**Architecture:** A Cloudflare Worker routes `/chat`, `/profile`, `/reset`, and `/webhook/:token` to a per-user Durable Object. The DO holds all user state (profile, vocab, curriculum position, history) and calls Workers AI (Llama 3.3) with a rich system prompt. A React/Vite app on Cloudflare Pages provides the chat UI; Telegram is an optional second frontend sharing the same DO.

**Tech Stack:** TypeScript, Cloudflare Workers, Durable Objects, Workers AI (Llama 3.3 70B), Cloudflare Pages, React 18, Vite, Vitest, Telegram Bot API

---

## Project Structure

```
cf_ai_morah/
├── worker/
│   ├── src/
│   │   ├── index.ts          # Worker entry, routing
│   │   ├── agent.ts          # UserAgent Durable Object
│   │   ├── types.ts          # Shared TypeScript interfaces
│   │   ├── curriculum.ts     # Chapter/lesson data
│   │   ├── prompts.ts        # System prompt assembly
│   │   ├── tags.ts           # [REMEMBER:] / [VOCAB_*:] tag parser
│   │   └── telegram.ts       # Telegram webhook handler
│   ├── test/
│   │   ├── tags.test.ts
│   │   ├── prompts.test.ts
│   │   └── curriculum.test.ts
│   ├── wrangler.toml
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   ├── api.ts            # Typed fetch wrappers
│   │   └── types.ts          # Shared types (import from worker/src/types.ts or duplicate)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/plans/
├── README.md
└── PROMPTS.md
```

---

## Prerequisites

- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account (free tier is fine)
- `wrangler login`

---

### Task 1: Scaffold the Worker project

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`

**Step 1: Create worker directory and package.json**

```bash
mkdir -p worker/src worker/test
```

`worker/package.json`:
```json
{
  "name": "cf-ai-morah-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240725.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
```

**Step 2: Create tsconfig.json**

`worker/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*", "test/**/*"]
}
```

**Step 3: Create wrangler.toml**

`worker/wrangler.toml`:
```toml
name = "cf-ai-morah-worker"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "USER_AGENT"
class_name = "UserAgent"

[[migrations]]
tag = "v1"
new_classes = ["UserAgent"]

[vars]
ENVIRONMENT = "development"
```

**Step 4: Install dependencies**

```bash
cd worker && npm install
```

Expected: `node_modules` created, no errors.

**Step 5: Commit**

```bash
cd ..
git add worker/
git commit -m "feat: scaffold worker project"
```

---

### Task 2: Define TypeScript types

**Files:**
- Create: `worker/src/types.ts`

**Step 1: Write types**

`worker/src/types.ts`:
```ts
export interface CurriculumPosition {
  currentChapter: number;  // 1–10
  currentLesson: string;   // e.g. "alphabet-alef-bet"
  completedLessons: string[];
}

export interface UserProfile {
  name?: string;
  originCountry?: string;
  neighborhood?: string;
  occupation?: string;
  familySituation?: string;
  aliyahDate?: string;
  personalNotes: string[];
}

export interface VocabState {
  known: string[];
  struggling: string[];
  introduced: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface UserState {
  curriculum: CurriculumPosition;
  profile: UserProfile;
  vocab: VocabState;
  history: Message[];
  telegram?: TelegramConfig;
}

export interface ChatRequest {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  response: string;
  state: Pick<UserState, "curriculum" | "vocab" | "profile">;
}

// Cloudflare bindings
export interface Env {
  USER_AGENT: DurableObjectNamespace;
  AI: Ai;
}
```

**Step 2: Commit**

```bash
git add worker/src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: Curriculum data

**Files:**
- Create: `worker/src/curriculum.ts`
- Create: `worker/test/curriculum.test.ts`

**Step 1: Write the failing test**

`worker/test/curriculum.test.ts`:
```ts
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
```

**Step 2: Run to verify it fails**

```bash
cd worker && npx vitest run test/curriculum.test.ts
```
Expected: FAIL — "Cannot find module '../src/curriculum'"

**Step 3: Implement curriculum.ts**

`worker/src/curriculum.ts`:
```ts
export interface Chapter {
  number: number;
  titleEn: string;
  titleHe: string;
  titleRu: string;
  objectives: string[];
  lessons: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    titleEn: "Alphabet & Reading/Writing",
    titleHe: "לומדים לקרוא ולכתוב",
    titleRu: "Учимся читать и писать",
    objectives: ["Learn the Hebrew alphabet", "Read basic words with nikud", "Write letters"],
    lessons: ["alphabet-alef-bet", "alphabet-gimel-dalet", "alphabet-he-vav", "alphabet-reading-practice"],
  },
  {
    number: 2,
    titleEn: "Coming Home",
    titleHe: "מגיעים הביתה",
    titleRu: "Приходим домой",
    objectives: ["Greetings", "Family members", "Rooms of the house", "Basic verbs: to be, to have"],
    lessons: ["home-greetings", "home-family", "home-rooms", "home-verbs"],
  },
  {
    number: 3,
    titleEn: "Walk Around the Neighborhood",
    titleHe: "סיבוב בשכונה",
    titleRu: "Прогулка по району",
    objectives: ["Places in the neighborhood", "Asking for directions", "Numbers 1-20"],
    lessons: ["neighborhood-places", "neighborhood-directions", "neighborhood-numbers"],
  },
  {
    number: 4,
    titleEn: "Weekend in Jerusalem",
    titleHe: "סוף שבוע בירושלים",
    titleRu: "Выходные в Иерусалиме",
    objectives: ["Days of the week", "Telling time", "Ordering food", "Transportation"],
    lessons: ["jerusalem-days", "jerusalem-time", "jerusalem-food", "jerusalem-transport"],
  },
  {
    number: 5,
    titleEn: "Plans",
    titleHe: "תוכניות",
    titleRu: "Планы",
    objectives: ["Future tense basics", "Making plans", "Calendar and dates"],
    lessons: ["plans-future-tense", "plans-making-plans", "plans-calendar"],
  },
  {
    number: 6,
    titleEn: "At School",
    titleHe: "בבית הספר",
    titleRu: "В школе",
    objectives: ["School vocabulary", "Imperatives", "Colors and descriptions"],
    lessons: ["school-vocab", "school-imperatives", "school-descriptions"],
  },
  {
    number: 7,
    titleEn: "Family",
    titleHe: "המשפחה המורחבת",
    titleRu: "Родственники",
    objectives: ["Extended family", "Possessives", "Describing people"],
    lessons: ["family-extended", "family-possessives", "family-descriptions"],
  },
  {
    number: 8,
    titleEn: "Hanukkah",
    titleHe: "חנוכה",
    titleRu: "Ханука",
    objectives: ["Jewish holidays vocabulary", "Past tense", "Traditions and culture"],
    lessons: ["hanukkah-vocab", "hanukkah-past-tense", "hanukkah-culture"],
  },
  {
    number: 9,
    titleEn: "At the Clinic",
    titleHe: "בקופת חולים",
    titleRu: "В поликлинике купат холим",
    objectives: ["Body parts", "Medical vocabulary", "Describing symptoms", "Making appointments"],
    lessons: ["clinic-body", "clinic-medical", "clinic-symptoms", "clinic-appointments"],
  },
  {
    number: 10,
    titleEn: "Meetings",
    titleHe: "פגישות",
    titleRu: "Встречи",
    objectives: ["Formal introductions", "Work vocabulary", "Making and cancelling plans"],
    lessons: ["meetings-introductions", "meetings-work", "meetings-plans"],
  },
];

export function getChapter(number: number): Chapter | null {
  if (number < 1 || number > 10) return null;
  return CHAPTERS[number - 1];
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run test/curriculum.test.ts
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add worker/src/curriculum.ts worker/test/curriculum.test.ts
git commit -m "feat: add curriculum data with 10 chapters"
```

---

### Task 4: Tag parser

**Files:**
- Create: `worker/src/tags.ts`
- Create: `worker/test/tags.test.ts`

**Step 1: Write the failing tests**

`worker/test/tags.test.ts`:
```ts
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
```

**Step 2: Run to verify it fails**

```bash
npx vitest run test/tags.test.ts
```
Expected: FAIL — "Cannot find module '../src/tags'"

**Step 3: Implement tags.ts**

`worker/src/tags.ts`:
```ts
export interface ParsedTags {
  remember: string[];
  vocabKnown: string[];
  vocabStruggle: string[];
}

const REMEMBER_RE = /\[REMEMBER:\s*([^\]]+)\]/g;
const VOCAB_KNOWN_RE = /\[VOCAB_KNOWN:\s*([^\]]+)\]/g;
const VOCAB_STRUGGLE_RE = /\[VOCAB_STRUGGLE:\s*([^\]]+)\]/g;

function extractAll(text: string, re: RegExp): string[] {
  const results: string[] = [];
  for (const match of text.matchAll(re)) {
    results.push(match[1].trim());
  }
  return results;
}

export function parseTags(text: string): ParsedTags {
  return {
    remember: extractAll(text, REMEMBER_RE),
    vocabKnown: extractAll(text, VOCAB_KNOWN_RE),
    vocabStruggle: extractAll(text, VOCAB_STRUGGLE_RE),
  };
}

export function stripTags(text: string): string {
  return text
    .replace(REMEMBER_RE, "")
    .replace(VOCAB_KNOWN_RE, "")
    .replace(VOCAB_STRUGGLE_RE, "");
}
```

**Step 4: Run tests**

```bash
npx vitest run test/tags.test.ts
```
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add worker/src/tags.ts worker/test/tags.test.ts
git commit -m "feat: add tag parser for agent state updates"
```

---

### Task 5: System prompt assembly

**Files:**
- Create: `worker/src/prompts.ts`
- Create: `worker/test/prompts.test.ts`

**Step 1: Write the failing test**

`worker/test/prompts.test.ts`:
```ts
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
```

**Step 2: Run to verify it fails**

```bash
npx vitest run test/prompts.test.ts
```
Expected: FAIL

**Step 3: Implement prompts.ts**

`worker/src/prompts.ts`:
```ts
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
    ? "- Always write Hebrew WITH nikud (vowel marks) — the student is a beginner\n- Always include transliteration alongside Hebrew"
    : "- Hebrew without nikud is fine from chapter 4+\n- Reduce transliteration as the student advances";

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
```

**Step 4: Run tests**

```bash
npx vitest run test/prompts.test.ts
```
Expected: PASS (5 tests)

**Step 5: Run all tests**

```bash
npx vitest run
```
Expected: PASS (all tests in tags, prompts, curriculum)

**Step 6: Commit**

```bash
git add worker/src/prompts.ts worker/test/prompts.test.ts
git commit -m "feat: add system prompt assembly"
```

---

### Task 6: UserAgent Durable Object

**Files:**
- Create: `worker/src/agent.ts`

**Step 1: Write agent.ts**

`worker/src/agent.ts`:
```ts
import type { Env, UserState, Message } from "./types";
import { buildSystemPrompt } from "./prompts";
import { parseTags, stripTags } from "./tags";
import { getChapter } from "./curriculum";

const DEFAULT_STATE: UserState = {
  curriculum: {
    currentChapter: 1,
    currentLesson: "alphabet-alef-bet",
    completedLessons: [],
  },
  profile: {
    personalNotes: [],
  },
  vocab: {
    known: [],
    struggling: [],
    introduced: [],
  },
  history: [],
};

const MAX_HISTORY = 20;

export class UserAgent {
  private state: DurableObjectState;
  private env: Env;
  private userState: UserState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async load(): Promise<UserState> {
    if (this.userState) return this.userState;
    const stored = await this.state.storage.get<UserState>("state");
    this.userState = stored ?? structuredClone(DEFAULT_STATE);
    return this.userState;
  }

  private async save(): Promise<void> {
    await this.state.storage.put("state", this.userState);
  }

  private applyTagUpdates(us: UserState, rawResponse: string): void {
    const tags = parseTags(rawResponse);

    for (const note of tags.remember) {
      if (!us.profile.personalNotes.includes(note)) {
        us.profile.personalNotes.push(note);
      }
    }
    for (const word of tags.vocabKnown) {
      if (!us.vocab.known.includes(word)) us.vocab.known.push(word);
      us.vocab.struggling = us.vocab.struggling.filter(w => w !== word);
    }
    for (const word of tags.vocabStruggle) {
      if (!us.vocab.struggling.includes(word)) us.vocab.struggling.push(word);
    }
  }

  async chat(message: string): Promise<{ response: string; state: Pick<UserState, "curriculum" | "vocab" | "profile"> }> {
    const us = await this.load();

    us.history.push({ role: "user", content: message });
    if (us.history.length > MAX_HISTORY) {
      us.history = us.history.slice(-MAX_HISTORY);
    }

    const systemPrompt = buildSystemPrompt(us);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...us.history,
    ];

    const aiResponse = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as Parameters<Ai["run"]>[0],
      { messages } as Parameters<Ai["run"]>[1]
    ) as { response: string };

    const rawText = aiResponse.response;
    this.applyTagUpdates(us, rawText);
    const cleanResponse = stripTags(rawText).trim();

    us.history.push({ role: "assistant", content: cleanResponse });

    await this.save();

    return {
      response: cleanResponse,
      state: {
        curriculum: us.curriculum,
        vocab: us.vocab,
        profile: us.profile,
      },
    };
  }

  async getState(): Promise<UserState> {
    return this.load();
  }

  async setTelegram(botToken: string, chatId: string): Promise<void> {
    const us = await this.load();
    us.telegram = { botToken, chatId };
    await this.save();
  }

  async resetProgress(): Promise<void> {
    this.userState = structuredClone(DEFAULT_STATE);
    await this.save();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/chat" && request.method === "POST") {
      const { message } = await request.json<{ message: string }>();
      const result = await this.chat(message);
      return Response.json(result);
    }

    if (url.pathname === "/state" && request.method === "GET") {
      const state = await this.getState();
      return Response.json(state);
    }

    if (url.pathname === "/reset" && request.method === "POST") {
      await this.resetProgress();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/telegram" && request.method === "POST") {
      const { botToken, chatId } = await request.json<{ botToken: string; chatId: string }>();
      await this.setTelegram(botToken, chatId);
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}
```

**Step 2: Commit**

```bash
cd ..
git add worker/src/agent.ts
git commit -m "feat: implement UserAgent Durable Object"
```

---

### Task 7: Telegram handler

**Files:**
- Create: `worker/src/telegram.ts`

**Step 1: Write telegram.ts**

`worker/src/telegram.ts`:
```ts
import type { Env } from "./types";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string };
    text?: string;
  };
}

export async function handleTelegramWebhook(
  request: Request,
  token: string,
  env: Env
): Promise<Response> {
  const update = await request.json<TelegramUpdate>();

  if (!update.message?.text) {
    return Response.json({ ok: true });
  }

  const chatId = String(update.message.chat.id);
  const text = update.message.text;

  // Each Telegram chat_id gets its own DO
  const doId = env.USER_AGENT.idFromName(`tg:${chatId}`);
  const stub = env.USER_AGENT.get(doId);

  // Register telegram config on first message
  await stub.fetch(new Request("http://internal/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botToken: token, chatId }),
  }));

  const chatRes = await stub.fetch(new Request("http://internal/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  }));

  const { response } = await chatRes.json<{ response: string }>();

  // Send reply via Telegram API
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: response,
      parse_mode: "Markdown",
    }),
  });

  return Response.json({ ok: true });
}

export async function registerWebhook(
  workerUrl: string,
  botToken: string
): Promise<{ ok: boolean; description?: string }> {
  const webhookUrl = `${workerUrl}/webhook/${botToken}`;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}
```

**Step 2: Commit**

```bash
git add worker/src/telegram.ts
git commit -m "feat: add Telegram webhook handler"
```

---

### Task 8: Worker entry point

**Files:**
- Create: `worker/src/index.ts`

**Step 1: Write index.ts**

`worker/src/index.ts`:
```ts
import type { Env } from "./types";
import { handleTelegramWebhook, registerWebhook } from "./telegram";

export { UserAgent } from "./agent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getUserId(request: Request): string {
  // Use session cookie, fallback to IP-based ID for dev
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/morah_user=([^;]+)/);
  return match?.[1] ?? crypto.randomUUID();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Telegram webhook: POST /webhook/:token
    if (url.pathname.startsWith("/webhook/") && request.method === "POST") {
      const token = url.pathname.slice("/webhook/".length);
      return handleTelegramWebhook(request, token, env);
    }

    // Register Telegram webhook: POST /telegram/register
    if (url.pathname === "/telegram/register" && request.method === "POST") {
      const { botToken } = await request.json<{ botToken: string }>();
      const workerUrl = `${url.protocol}//${url.hostname}`;
      const result = await registerWebhook(workerUrl, botToken);
      return Response.json(result, { headers: CORS_HEADERS });
    }

    // All other routes: forward to user's Durable Object
    const userId = getUserId(request);
    const doId = env.USER_AGENT.idFromName(`web:${userId}`);
    const stub = env.USER_AGENT.get(doId);

    // Rewrite path to internal DO routes
    const internalUrl = new URL(url.pathname, "http://internal");
    const doResponse = await stub.fetch(new Request(internalUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" ? await request.text() : undefined,
    }));

    const body = await doResponse.text();
    return new Response(body, {
      status: doResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        // Set session cookie if new user
        "Set-Cookie": `morah_user=${userId}; Path=/; SameSite=None; Secure; Max-Age=31536000`,
      },
    });
  },
};
```

**Step 2: Run all tests**

```bash
cd worker && npx vitest run
```
Expected: PASS (all tests)

**Step 3: Commit**

```bash
cd ..
git add worker/src/index.ts
git commit -m "feat: add Worker entry point with routing"
```

---

### Task 9: Scaffold the frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`

**Step 1: Initialize Vite React project**

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```
Answer prompts: framework = React, variant = TypeScript

**Step 2: Update vite.config.ts to proxy to worker in dev**

`frontend/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/chat": "http://localhost:8787",
      "/state": "http://localhost:8787",
      "/reset": "http://localhost:8787",
      "/telegram": "http://localhost:8787",
    },
  },
});
```

**Step 3: Install dependencies**

```bash
npm install && npm install -D @types/node
```

**Step 4: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold React frontend with Vite"
```

---

### Task 10: API client and useChat hook

**Files:**
- Create: `frontend/src/api.ts`
- Create: `frontend/src/hooks/useChat.ts`

**Step 1: Write api.ts**

`frontend/src/api.ts`:
```ts
export interface ChatResponse {
  response: string;
  state: {
    curriculum: { currentChapter: number; currentLesson: string; completedLessons: string[] };
    vocab: { known: string[]; struggling: string[]; introduced: string[] };
    profile: { name?: string; originCountry?: string; neighborhood?: string; personalNotes: string[] };
  };
}

export interface UserState extends ChatResponse["state"] {}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function getState(): Promise<ChatResponse["state"]> {
  const res = await fetch("/state", { credentials: "include" });
  if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
  return res.json();
}

export async function resetProgress(): Promise<void> {
  await fetch("/reset", { method: "POST", credentials: "include" });
}

export async function registerTelegram(botToken: string): Promise<{ ok: boolean }> {
  const res = await fetch("/telegram/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botToken }),
    credentials: "include",
  });
  return res.json();
}
```

**Step 2: Write useChat.ts**

`frontend/src/hooks/useChat.ts`:
```ts
import { useState, useCallback, useEffect } from "react";
import { sendMessage, getState } from "../api";
import type { ChatResponse } from "../api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatResponse["state"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getState().then(setState).catch(() => null);
  }, []);

  const send = useCallback(async (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }]);
    setLoading(true);
    setError(null);
    try {
      const result = await sendMessage(content);
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      setState(result.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, state, loading, error, send };
}
```

**Step 3: Commit**

```bash
git add frontend/src/api.ts frontend/src/hooks/
git commit -m "feat: add API client and useChat hook"
```

---

### Task 11: Sidebar component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

**Step 1: Write Sidebar.tsx**

`frontend/src/components/Sidebar.tsx`:
```tsx
import type { ChatResponse } from "../api";

const CHAPTER_NAMES: Record<number, string> = {
  1: "Alphabet",
  2: "Coming Home",
  3: "Neighborhood",
  4: "Jerusalem",
  5: "Plans",
  6: "School",
  7: "Family",
  8: "Hanukkah",
  9: "Clinic",
  10: "Meetings",
};

interface SidebarProps {
  state: ChatResponse["state"] | null;
  onOpenSettings: () => void;
}

export function Sidebar({ state, onOpenSettings }: SidebarProps) {
  const chapter = state?.curriculum.currentChapter ?? 1;
  const progress = ((chapter - 1) / 10) * 100;

  return (
    <aside style={{
      width: 200,
      padding: "1rem",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      fontSize: 14,
      color: "#374151",
    }}>
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Progress</h3>
        <div style={{ fontWeight: 600 }}>Ch {chapter}: {CHAPTER_NAMES[chapter] ?? "—"}</div>
        <div style={{ marginTop: 6, background: "#e5e7eb", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${progress}%`, background: "#3b82f6", height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
        <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 12 }}>{chapter} / 10 chapters</div>
      </div>

      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Vocabulary</h3>
        <div>Known: <strong>{state?.vocab.known.length ?? 0}</strong> words</div>
        {(state?.vocab.struggling.length ?? 0) > 0 && (
          <div style={{ color: "#ef4444" }}>Struggling: <strong>{state!.vocab.struggling.length}</strong></div>
        )}
      </div>

      {state?.profile && (
        <div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Profile</h3>
          {state.profile.name && <div>{state.profile.name}</div>}
          {state.profile.neighborhood && <div>{state.profile.neighborhood}</div>}
          {state.profile.originCountry && <div>From: {state.profile.originCountry}</div>}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <button
          onClick={onOpenSettings}
          style={{ width: "100%", padding: "0.5rem", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          Settings ⚙
        </button>
      </div>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component"
```

---

### Task 12: Settings panel

**Files:**
- Create: `frontend/src/components/Settings.tsx`

**Step 1: Write Settings.tsx**

`frontend/src/components/Settings.tsx`:
```tsx
import { useState } from "react";
import { registerTelegram, resetProgress } from "../api";

interface SettingsProps {
  onClose: () => void;
  onReset: () => void;
}

export function Settings({ onClose, onReset }: SettingsProps) {
  const [token, setToken] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [resetting, setResetting] = useState(false);

  async function handleTelegramSave() {
    if (!token.trim()) return;
    setTelegramStatus("loading");
    try {
      const result = await registerTelegram(token.trim());
      setTelegramStatus(result.ok ? "ok" : "error");
    } catch {
      setTelegramStatus("error");
    }
  }

  async function handleReset() {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    setResetting(true);
    await resetProgress().catch(() => null);
    setResetting(false);
    onReset();
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "2rem", width: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 1.5rem", fontSize: 18 }}>Settings</h2>

        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 0.5rem" }}>Telegram Bot</h3>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 0.75rem" }}>
            Create a bot via @BotFather on Telegram, paste the token here, and chat with Morah directly from Telegram.
          </p>
          <input
            type="text"
            placeholder="1234567890:ABCdef..."
            value={token}
            onChange={e => setToken(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
          />
          <button
            onClick={handleTelegramSave}
            disabled={!token.trim() || telegramStatus === "loading"}
            style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            {telegramStatus === "loading" ? "Registering..." : telegramStatus === "ok" ? "Registered!" : "Register Bot"}
          </button>
          {telegramStatus === "error" && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>Failed — check your token.</div>}
        </section>

        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{ padding: "0.5rem 1rem", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            {resetting ? "Resetting..." : "Reset Progress"}
          </button>
        </section>

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Settings.tsx
git commit -m "feat: add Settings panel with Telegram registration"
```

---

### Task 13: Chat component

**Files:**
- Create: `frontend/src/components/Chat.tsx`
- Create: `frontend/src/components/MessageBubble.tsx`

**Step 1: Write MessageBubble.tsx**

`frontend/src/components/MessageBubble.tsx`:
```tsx
interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "0.75rem",
    }}>
      <div style={{
        maxWidth: "75%",
        padding: "0.625rem 1rem",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "#3b82f6" : "#f3f4f6",
        color: isUser ? "#fff" : "#111827",
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {content}
      </div>
    </div>
  );
}
```

**Step 2: Write Chat.tsx**

`frontend/src/components/Chat.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "../hooks/useChat";

interface ChatProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

export function Chat({ messages, loading, onSend }: ChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "3rem" }}>
            <div style={{ fontSize: 40, marginBottom: "0.5rem" }}>🇮🇱</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: "0.25rem" }}>שלום! I'm Morah.</div>
            <div>Your Hebrew tutor. Say hello to get started.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ padding: "0.625rem 1rem", background: "#f3f4f6", borderRadius: "18px 18px 18px 4px", color: "#6b7280", fontSize: 15 }}>
              Morah is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          style={{
            flex: 1, padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
            borderRadius: 24, fontSize: 15, outline: "none",
            background: loading ? "#f9fafb" : "#fff",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "0.625rem 1.25rem", background: "#3b82f6", color: "#fff",
            border: "none", borderRadius: 24, cursor: "pointer", fontSize: 15,
            opacity: (!input.trim() || loading) ? 0.5 : 1,
          }}
        >
          →
        </button>
      </form>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add Chat and MessageBubble components"
```

---

### Task 14: Assemble App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Write App.tsx**

`frontend/src/App.tsx`:
```tsx
import { useState, useCallback } from "react";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { useChat } from "./hooks/useChat";
import { getState } from "./api";

export default function App() {
  const { messages, state, loading, error, send } = useChat();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleReset = useCallback(async () => {
    // After reset, refetch state (messages are local, reload page for full reset)
    window.location.reload();
  }, []);

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#fff",
    }}>
      <Sidebar state={state} onOpenSettings={() => setSettingsOpen(true)} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span style={{ fontSize: 22 }}>🇮🇱</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Morah</span>
          <span style={{ color: "#9ca3af", fontSize: 14 }}>— Hebrew Tutor for Olim</span>
        </header>

        {error && (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.5rem 1.5rem", fontSize: 14 }}>
            {error}
          </div>
        )}

        <Chat messages={messages} loading={loading} onSend={send} />
      </main>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} onReset={handleReset} />}
    </div>
  );
}
```

**Step 2: Clean up Vite defaults**

Delete `frontend/src/App.css`, `frontend/src/index.css` and update `frontend/src/main.tsx` to remove CSS imports:

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: assemble App with Chat, Sidebar, Settings"
```

---

### Task 15: README and PROMPTS.md

**Files:**
- Create: `README.md`
- Create: `PROMPTS.md`

**Step 1: Write README.md**

`README.md`:
```markdown
# cf_ai_morah — Hebrew Tutor for New Olim

An AI-powered Hebrew tutor for immigrants making aliyah to Israel. Built on Cloudflare Workers, Durable Objects, and Workers AI (Llama 3.3).

## Features

- Starts from zero: Hebrew alphabet, reading, writing
- 10-chapter situational curriculum (inspired by Yes Hebrew)
- Agent builds a personal profile over time to personalize lessons
- Adapts to Russian, English, or Hebrew — whatever you write in
- Optional Telegram bot integration (same chat, same memory)

## Architecture

- **Workers AI (Llama 3.3 70B)** — LLM for tutoring conversations
- **Durable Objects** — Per-user stateful agent brain (profile, vocab, history)
- **Cloudflare Workers** — API routing layer
- **Cloudflare Pages** — React chat UI

## Running Locally

### Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account: `wrangler login`

### Worker
```bash
cd worker
npm install
wrangler dev
```
Worker runs at http://localhost:8787

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 (proxies API calls to worker)

## Deploying

```bash
# Deploy worker
cd worker && wrangler deploy

# Deploy frontend (set VITE_API_URL to your worker URL first)
cd frontend && npm run build && wrangler pages deploy dist
```

## Telegram Setup

1. Create a bot via @BotFather on Telegram
2. Open the web app → Settings ⚙
3. Paste your bot token → click Register Bot
4. Start chatting with your bot on Telegram — same memory as the web UI
```

**Step 2: Write PROMPTS.md**

`PROMPTS.md`:
```markdown
# AI Prompts Used

This file documents the prompts used to build cf_ai_morah with Claude Code.

---

## 1. Initial Project Brainstorming

**Prompt:**
> so i want to apply for the cloudflare internship and they have an assignment that applicants can do to get reviewed faster [...] lets go with an agent to learn hebrew for new repatriots. im planning on making aliyah to israel and learning hebrew is the first step to integration. i feel like an agent that has all of my context would be useful for that

**Purpose:** Defined the project concept, requirements, and core value proposition.

---

## 2. Architecture Design

**Prompt (via Claude Code brainstorming skill):**
> Since its for people starting from 0 like me it should cover the bare basics first and then be very practical [...] it should adapt, there's a reason we use LLMs and agents [...] it should build up a profile over time of whatever information it deems relevant

**Purpose:** Established the curriculum structure, agent behavior, language adaptation, and profile system.

---

## 3. Telegram Integration

**Prompt:**
> can we also have an option in the interface to drop in your telegram bot key so the agent can use telegram as the chat UI instead of the web?

**Purpose:** Added Telegram as a second frontend sharing the same Durable Object state.

---

## 4. Implementation Plan

**Prompt (via Claude Code writing-plans skill):**
> Full architecture and data model approved — generate implementation plan

**Purpose:** Generated all task-by-task implementation steps, TDD tests, and code.

---

## 5. System Prompt Design

The system prompt in `worker/src/prompts.ts` was designed with Claude Code using the following principles:
- Structured tags (`[REMEMBER:]`, `[VOCAB_KNOWN:]`, `[VOCAB_STRUGGLE:]`) for machine-parseable state updates
- Language auto-detection instruction for Russian/English/Hebrew support
- Progressive nikud/transliteration rules based on curriculum chapter
- Grounding instructions to use personal profile context
```

**Step 3: Commit**

```bash
git add README.md PROMPTS.md
git commit -m "docs: add README and PROMPTS.md for Cloudflare submission"
```

---

### Task 16: Local smoke test

**Step 1: Start the worker in dev mode**

```bash
cd worker && wrangler dev
```
Expected: Worker running at http://localhost:8787

Note: You will be prompted to log in to Cloudflare if not already. Workers AI requires a Cloudflare account even in dev.

**Step 2: Start the frontend**

In a separate terminal:
```bash
cd frontend && npm run dev
```
Expected: Vite dev server at http://localhost:5173

**Step 3: Test the chat**

Open http://localhost:5173. Type "Hello" and verify Morah responds.

**Step 4: Verify state persists**

Refresh the page. The sidebar should still show chapter 1. Send another message — Morah should remember context.

---

### Task 17: Deploy to Cloudflare

**Step 1: Deploy the worker**

```bash
cd worker && wrangler deploy
```
Expected: Worker deployed at `https://cf-ai-morah-worker.<your-subdomain>.workers.dev`

Note the deployed URL.

**Step 2: Update frontend proxy for production**

In `frontend/vite.config.ts`, the proxy is dev-only. For Pages deployment, the frontend calls the same-origin `/chat` etc. You need to either:
- Deploy Pages with a custom domain and route `/api/*` to the worker, OR
- Set an env variable for the worker URL and use it in `api.ts`

For simplicity: update `frontend/src/api.ts` to use an env variable:

```ts
const API_BASE = import.meta.env.VITE_API_URL ?? "";
// Replace all fetch("/chat") with fetch(`${API_BASE}/chat`) etc.
```

**Step 3: Build and deploy frontend**

```bash
cd frontend
VITE_API_URL=https://cf-ai-morah-worker.<your-subdomain>.workers.dev npm run build
wrangler pages deploy dist --project-name cf-ai-morah
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "deploy: add production API URL support"
```

---

## Done

The repo at this point satisfies all Cloudflare internship requirements:

| Requirement | ✓ |
|-------------|---|
| LLM (Llama 3.3 on Workers AI) | ✓ `worker/src/agent.ts` |
| Workflow/coordination (Durable Objects) | ✓ `worker/src/agent.ts` — `UserAgent` class |
| User input via chat (Pages) | ✓ `frontend/` |
| Memory or state | ✓ DO storage: profile, vocab, history |
| `cf_ai_` prefix | ✓ repo name `cf_ai_morah` |
| README.md | ✓ |
| PROMPTS.md | ✓ |
