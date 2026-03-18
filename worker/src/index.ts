import type { Env } from "./types";
import { handleTelegramWebhook, registerWebhook } from "./telegram";

export { UserAgent } from "./agent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
};

function getUserId(request: Request): string {
  return request.headers.get("X-User-Id") ?? crypto.randomUUID();
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
      const userId = getUserId(request);
      const workerUrl = `${url.protocol}//${url.hostname}`;

      // Store botToken → userId mapping so the webhook handler can route
      // Telegram messages to the correct web user's DO
      const registryId = env.USER_AGENT.idFromName("tg-registry");
      const registry = env.USER_AGENT.get(registryId);
      await registry.fetch(new Request("http://internal/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: botToken, value: userId }),
      }));

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
      },
    });
  },
};
