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

**Purpose:** Generated all task-by-task implementation steps, TDD tests, and code in a 17-task plan covering worker scaffold, types, curriculum, tag parser, system prompt, Durable Object, Telegram handler, worker entry point, frontend scaffold, API client, and all UI components.

---

## 5. System Prompt Design

The system prompt in `worker/src/prompts.ts` was designed with Claude Code using the following principles:
- Structured tags (`[REMEMBER:]`, `[VOCAB_KNOWN:]`, `[VOCAB_STRUGGLE:]`) for machine-parseable state updates — the LLM emits these inline and the Worker strips them before showing the response to the user
- Language auto-detection instruction for Russian/English/Hebrew support
- Progressive nikud/transliteration rules based on curriculum chapter (chapters 1-3 always use nikud, chapter 4+ without)
- Grounding instructions to use personal profile context (neighborhood, job, family)

---

## 6. Subagent-Driven Execution

**Prompt (via Claude Code subagent-driven-development skill):**
> start the execution of the plan as per the second option

**Purpose:** Used Claude Code's subagent-driven development workflow to execute all 15 implementation tasks. Each task was dispatched to a fresh subagent with the full task spec, followed by a two-stage review (spec compliance, then code quality). Issues found by reviewers were fixed before proceeding. Tasks 11-13 (Sidebar, Settings, Chat components) were executed in parallel since they had no dependencies on each other.

---

## 7. Deployment Debugging

**Prompts:**
> npx wrangler deploy [...] error: In order to use Durable Objects with a free plan, you must create a namespace using a `new_sqlite_classes` migration

> Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource [...] Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'

**Purpose:** Fixed two deployment issues iteratively:
1. Cloudflare free tier requires SQLite-backed Durable Objects (`new_sqlite_classes` instead of `new_classes` in `wrangler.toml`)
2. Cross-origin cookie auth doesn't work with `Access-Control-Allow-Origin: *` — replaced cookie-based user identification with `localStorage` + a custom `X-User-Id` header to avoid CORS credential restrictions entirely

---

## 8. Diagnosing Weird AI Responses

**Prompt:**
> look at this conversation, why are the responses so weird? hi → שָׁלוֹם (Shalom) - Hi! I'm Morah... ok lets start → נְפָלָא (Nifla) - Great! Let's dive into the Alef-Bet...

**Purpose:** Diagnosed issues with AI response quality: robotic/formulaic tone, no medium awareness (asking users to "write a letter" in a chat app), immediate curriculum drilling without rapport building, and repetitive transliteration patterns.

---

## 9. Model Upgrade & System Prompt Improvements

**Prompts:**
> i dont think transliterations are that big a deal but the first two are good ideas, especially the system prompt improvements. for cloudflare models search online which are available for a free tier

> considering this is a project that i will submit for an internship application at cloudflare what do you think

**Purpose:** Researched Cloudflare Workers AI free tier models and upgraded from `llama-3.3-70b-instruct-fp8-fast` to `llama-4-scout-17b-16e-instruct` (Meta's latest, MoE architecture, better for a CF internship submission). Reworked the system prompt with:
- Medium awareness ("you are in a TEXT CHAT app")
- Conversation style rules (short responses, no repetitive patterns)
- First interaction flow (build rapport before drilling curriculum)
- Medium constraints (never ask to "write a letter" or "repeat after me")
- Teaching through conversation, not drills

---

## 10. Knowledge Management UI

**Prompt:**
> we should add a ui in the settings where the user can see all the context that is known about him and delete it if needed, edit or add it there, sorta like the ui chatgpt has for memories

> every part of the knowledge should be able to be deleted, edited and added

**Purpose:** Added a "What Morah knows about you" section to Settings, inspired by ChatGPT's memory management UI. Includes:
- Profile fields (name, country, neighborhood, occupation, family, aliyah date) — inline edit, delete, add
- Personal notes/memories — edit, delete, add
- Vocabulary (known + struggling) — pill tags with edit/delete, add
- New `PUT /profile` backend endpoint for partial updates to all user data
