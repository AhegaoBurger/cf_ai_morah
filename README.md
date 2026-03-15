# cf_ai_morah — Hebrew Tutor for New Olim

An AI-powered Hebrew tutor for immigrants making aliyah to Israel. Built on Cloudflare Workers, Durable Objects, and Workers AI.

## Features

- Starts from zero: Hebrew alphabet, reading, writing
- 10-chapter situational curriculum (inspired by Yes Hebrew)
- Agent builds a personal profile over time to personalize lessons
- Adapts to Russian, English, or Hebrew — whatever you write in
- Knowledge management UI — view, edit, and delete everything the tutor knows about you
- Optional Telegram bot integration (same chat, same memory)
- Dark mode with system preference detection

## Architecture

- **Workers AI (Llama 4 Scout 17B)** — MoE LLM for tutoring conversations
- **Durable Objects (SQLite-backed)** — Per-user stateful agent brain (profile, vocab, curriculum progress, chat history)
- **Cloudflare Workers** — API routing layer with CORS support
- **Cloudflare Pages** — React + shadcn/ui + Tailwind CSS v4 frontend

## Tech Stack

### Backend
- Cloudflare Workers + Durable Objects
- Workers AI (`@cf/meta/llama-4-scout-17b-16e-instruct`)
- Structured tag parsing for state updates (`[REMEMBER:]`, `[VOCAB_KNOWN:]`, `[VOCAB_STRUGGLE:]`)

### Frontend
- React 18 + TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Vite 5 build tooling
- Light/dark theme with localStorage persistence

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
cd frontend && npm run build && wrangler pages deploy dist --project-name cf-ai-morah
```

## Telegram Setup

1. Create a bot via @BotFather on Telegram
2. Open the web app → Settings (gear icon in sidebar)
3. Paste your bot token → click Register Bot
4. Start chatting with your bot on Telegram — same memory as the web UI

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Send a message, get AI response + updated state |
| GET | `/state` | Fetch current user state (profile, vocab, curriculum) |
| PUT | `/profile` | Update profile fields or vocabulary |
| POST | `/reset` | Reset all user progress |
| POST | `/telegram/register` | Register a Telegram bot token |
| POST | `/telegram/webhook/*` | Telegram webhook handler |

All endpoints require an `X-User-Id` header for user identification.

## Roadmap / Future Features

- [ ] **Generative UI** — Dynamic lesson components rendered via JSON (Vercel AI SDK `json-renderer`), so the AI can output interactive exercises, flashcards, and quizzes instead of plain text
- [ ] **More data/context connectors** — Pull in external sources (e.g. user's calendar, local news, government forms) to ground lessons in real-life context
- [ ] **Voice mode** — Speech-to-text input and text-to-speech responses for pronunciation practice and hands-free study
- [ ] **Domain-specific features** — Deeper specialisation in areas like:
  - Language learning: spaced-repetition vocab drills, conjugation tables, dictation exercises
  - Aliyah context: bureaucratic Hebrew (Misrad HaPnim, Bituach Leumi), housing/rental vocab, bank and healthcare phrases
