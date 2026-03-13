export interface ChatResponse {
  response: string;
  state: {
    curriculum: { currentChapter: number; currentLesson: string; completedLessons: string[] };
    vocab: { known: string[]; struggling: string[]; introduced: string[] };
    profile: { name?: string; originCountry?: string; neighborhood?: string; personalNotes: string[] };
  };
}

export type UserState = ChatResponse["state"];

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
