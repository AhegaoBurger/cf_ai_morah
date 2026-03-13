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
