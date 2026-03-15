import { useState, useCallback, useEffect } from "react";
import { sendMessage, getState } from "../api";
import type { ChatResponse } from "../api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatResponse["state"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getState().then(setState).catch(() => null);
  }, []);

  const send = useCallback(async (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }]);
    setLoading(true);
    setError(null);
    try {
      const result = await sendMessage(content);
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      setState(result.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, state, setState, loading, error, send };
}
