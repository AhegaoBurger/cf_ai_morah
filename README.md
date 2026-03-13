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
