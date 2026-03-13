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
