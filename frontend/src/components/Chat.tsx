import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "../hooks/useChat";

interface ChatProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

export function Chat({ messages, loading, onSend }: ChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "3rem" }}>
            <div style={{ fontSize: 40, marginBottom: "0.5rem" }}>🇮🇱</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: "0.25rem" }}>שלום! I'm Morah.</div>
            <div>Your Hebrew tutor. Say hello to get started.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ padding: "0.625rem 1rem", background: "#f3f4f6", borderRadius: "18px 18px 18px 4px", color: "#6b7280", fontSize: 15 }}>
              Morah is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          style={{
            flex: 1, padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
            borderRadius: 24, fontSize: 15, outline: "none",
            background: loading ? "#f9fafb" : "#fff",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "0.625rem 1.25rem", background: "#3b82f6", color: "#fff",
            border: "none", borderRadius: 24, cursor: "pointer", fontSize: 15,
            opacity: (!input.trim() || loading) ? 0.5 : 1,
          }}
        >
          →
        </button>
      </form>
    </div>
  );
}
