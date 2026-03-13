export interface CurriculumPosition {
  currentChapter: number;  // 1–10
  currentLesson: string;   // e.g. "alphabet-alef-bet"
  completedLessons: string[];
}

export interface UserProfile {
  name?: string;
  originCountry?: string;
  neighborhood?: string;
  occupation?: string;
  familySituation?: string;
  aliyahDate?: string;
  personalNotes: string[];
}

export interface VocabState {
  known: string[];
  struggling: string[];
  introduced: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface UserState {
  curriculum: CurriculumPosition;
  profile: UserProfile;
  vocab: VocabState;
  history: Message[];
  telegram?: TelegramConfig;
}

export interface ChatRequest {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  response: string;
  state: Pick<UserState, "curriculum" | "vocab" | "profile">;
}

// Cloudflare bindings
export interface Env {
  USER_AGENT: DurableObjectNamespace;
  AI: Ai;
}
