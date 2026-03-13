export interface ChatResponse {
  response: string;
  state: {
    curriculum: { currentChapter: number; currentLesson: string; completedLessons: string[] };
    vocab: { known: string[]; struggling: string[]; introduced: string[] };
    profile: { name?: string; originCountry?: string; neighborhood?: string; personalNotes: string[] };
  };
}

export type UserState = ChatResponse["state"];

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getUserId(): string {
  let id = localStorage.getItem("morah_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("morah_user_id", id);
  }
  return id;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "X-User-Id": getUserId(), ...extra };
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function getState(): Promise<ChatResponse["state"]> {
  const res = await fetch(`${API_BASE}/state`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
  return res.json();
}

export async function resetProgress(): Promise<void> {
  await fetch(`${API_BASE}/reset`, { method: "POST", headers: authHeaders() });
}

export async function registerTelegram(botToken: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/telegram/register`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ botToken }),
  });
  return res.json();
}
