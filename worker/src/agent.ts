import type { Env, UserState } from "./types";
import { buildSystemPrompt } from "./prompts";
import { parseTags, stripTags } from "./tags";

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
    return structuredClone(await this.load());
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
      let message: string;
      try {
        const body = await request.json<{ message: string }>();
        if (!body.message || typeof body.message !== "string") {
          return new Response("message is required", { status: 400 });
        }
        message = body.message;
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }
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
      let botToken: string, chatId: string;
      try {
        const body = await request.json<{ botToken: string; chatId: string }>();
        botToken = body.botToken;
        chatId = body.chatId;
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }
      await this.setTelegram(botToken, chatId);
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}
