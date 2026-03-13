# Morah — Hebrew Tutor for New Olim: Design Document

**Date:** 2026-03-13
**Project:** `cf_ai_morah`
**Status:** Approved

---

## Overview

Morah (מורה — "teacher") is an AI-powered Hebrew tutor built for new olim (immigrants) making aliyah to Israel. It starts from zero — Hebrew alphabet, reading and writing — then progresses through practical, situational lessons grounded in the student's real life. The agent builds a profile over time, deciding what personal context is worth remembering to maximize learning and engagement.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Pages (React chat UI)                   │
│  - Chat window, message history display             │
│  - Lesson progress sidebar                          │
│  - Settings: paste Telegram bot token               │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / streaming SSE
┌────────────────────▼────────────────────────────────┐
│  Cloudflare Worker (API layer)                      │
│  - Routes /chat, /profile, /reset, /webhook/:token  │
│  - Derives user ID from session cookie OR tg chat_id│
│  - Forwards to user's Durable Object                │
└────────────────────┬────────────────────────────────┘
                     │ DO RPC
┌────────────────────▼────────────────────────────────┐
│  Durable Object (1 per user) — the "agent brain"    │
│  - Stores: profile, vocab, curriculum position,     │
│    recent conversation history (last 20 msgs)       │
│  - Assembles context → calls Workers AI             │
│  - Parses [REMEMBER:] / [VOCAB_*:] tags             │
│  - Updates profile after each turn                  │
└──────────┬──────────────────────────────────────────┘
           │ Workers AI binding
┌──────────▼──────────────────────────────────────────┐
│  Workers AI — Llama 3.3 70B                         │
│  - Receives: system prompt + profile + history      │
│  - Returns: Hebrew tutor response (streamed)        │
└─────────────────────────────────────────────────────┘
```

### Telegram Integration

When the user pastes a bot token in the web settings:
1. Worker calls Telegram's `setWebhook` API to register `POST /webhook/:token`
2. Telegram sends all messages to that endpoint
3. Worker maps Telegram `chat_id` → user's Durable Object
4. Same DO handles both web and Telegram — shared history and profile

---

## Data Model

Single JSON blob stored per Durable Object instance:

```ts
interface UserState {
  // Curriculum
  curriculum: {
    currentChapter: number;        // 1–10
    currentLesson: string;         // e.g. "alphabet-alef-bet"
    completedLessons: string[];
  };

  // Profile — agent-managed, grows over time
  profile: {
    name?: string;
    originCountry?: string;
    neighborhood?: string;
    occupation?: string;
    familySituation?: string;
    aliyahDate?: string;
    personalNotes: string[];       // free-form facts the agent decides to keep
  };

  // Vocabulary tracking
  vocab: {
    known: string[];               // demonstrated knowledge
    struggling: string[];          // repeated errors
    introduced: string[];          // shown but not yet tested
  };

  // Conversation
  history: { role: "user" | "assistant"; content: string }[]; // last 20 msgs
  preferredLanguage: "ru" | "en" | "he" | "auto";

  // Telegram integration
  telegram?: {
    botToken: string;
    chatId: string;
  };
}
```

---

## Curriculum Structure

Based on the Yes Hebrew course structure:

| Chapter | Topic (RU / HE) |
|---------|-----------------|
| 1 | Alphabet & reading/writing — לומדים לקרוא ולכתוב |
| 2 | Coming home — מגיעים הביתה |
| 3 | Walk around the neighborhood — סיבוב בשכונה |
| 4 | Weekend in Jerusalem — סוף שבוע בירושלים |
| 5 | Plans — תוכניות |
| — | Test: chapters 1–5 |
| 6 | At school — בבית הספר |
| 7 | Family — המשפחה המורחבת |
| 8 | Hanukkah — חנוכה |
| 9 | At the clinic — בקופת חולים |
| 10 | Meetings — פגישות |
| — | Test: chapters 1–10 |

---

## Agent Behavior & System Prompt

The Durable Object assembles a full context on every turn:

```
You are Morah (מורה), a Hebrew tutor for new olim making aliyah.

STUDENT PROFILE:
- Name: {name}, from {originCountry}, living in {neighborhood}
- Current chapter: {currentChapter} — "{chapterTitle}"
- Known vocabulary: {known}
- Struggling with: {struggling}
- Personal notes: {personalNotes}

BEHAVIOR RULES:
- Detect the language the student wrote in and respond in that language
- Include Hebrew text WITH nikud (vowel marks) for beginners (chapters 1-3)
- Provide transliteration alongside Hebrew until chapter 4
- Correct mistakes gently, inline — never ignore an error
- When you learn a personal fact worth remembering: [REMEMBER: ...]
- When a vocab word is clearly known: [VOCAB_KNOWN: word]
- When student is struggling: [VOCAB_STRUGGLE: word]
- Ground lessons in the student's real life (neighborhood, job, family)
- Be warm, encouraging, occasionally funny — aliyah is hard
```

The Worker strips `[REMEMBER:]` / `[VOCAB_*:]` tags from the response, updates the DO state, then streams the clean text to the UI.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  🇮🇱 Morah — Hebrew Tutor          [Settings ⚙]        │
├──────────────────┬──────────────────────────────────────┤
│  Progress        │                                      │
│  Ch 1: Alphabet  │   [chat messages stream here]        │
│  ▓▓▓░░░░░ 40%    │                                      │
│                  │                                      │
│  Vocabulary      │                                      │
│  Known: 12 words │                                      │
│  Struggling: 3   │                                      │
│                  │  ┌──────────────────────────────┐   │
│  Profile         │  │ Type a message...         [→] │   │
│  Tel Aviv        │  └──────────────────────────────┘   │
│  From: Russia    │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**Settings panel:**
- Paste Telegram bot token → auto-registers webhook
- Reset progress
- View/edit raw profile notes

Responses stream token-by-token via SSE.

---

## Cloudflare Requirements Checklist

| Requirement | Implementation |
|-------------|----------------|
| LLM | Workers AI — Llama 3.3 70B |
| Workflow / coordination | Durable Object orchestrates context assembly, LLM call, state update |
| User input via chat | Cloudflare Pages (React) + SSE streaming |
| Memory or state | Durable Object JSON state — profile, vocab, history, curriculum |

---

## Out of Scope (v1)

- Voice input/output (planned v2)
- Multi-user accounts / auth (session cookie only for v1)
- Spaced repetition scheduling
