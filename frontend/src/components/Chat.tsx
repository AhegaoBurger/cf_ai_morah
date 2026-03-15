import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-12">
            <div className="text-5xl mb-3">🇮🇱</div>
            <div className="text-xl font-semibold mb-1 text-foreground">
              שלום! I'm Morah.
            </div>
            <div className="text-sm">
              Your Hebrew tutor. Say hello to get started.
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mr-2 mt-1">
              מ
            </div>
            <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-sm">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-6 py-4 border-t border-border"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 rounded-full px-4 h-10"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || loading}
          className="rounded-full h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
