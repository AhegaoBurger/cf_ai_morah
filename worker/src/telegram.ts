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

  // Look up which web user registered this bot token so we can share state
  const registryId = env.USER_AGENT.idFromName("tg-registry");
  const registry = env.USER_AGENT.get(registryId);
  const lookupRes = await registry.fetch(
    new Request(`http://internal/kv/${encodeURIComponent(token)}`, { method: "GET" })
  );
  const { value: userId } = await lookupRes.json<{ value: string | null }>();

  // Route to the web user's DO so Telegram and web UI share the same memory.
  // Fall back to a tg-scoped DO if no registration is found.
  const doName = userId ? `web:${userId}` : `tg:${chatId}`;
  const doId = env.USER_AGENT.idFromName(doName);
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
