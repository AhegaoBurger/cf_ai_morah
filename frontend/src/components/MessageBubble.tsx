interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "0.75rem",
    }}>
      <div style={{
        maxWidth: "75%",
        padding: "0.625rem 1rem",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "#3b82f6" : "#f3f4f6",
        color: isUser ? "#fff" : "#111827",
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        dir: "auto",
      }}>
        {content}
      </div>
    </div>
  );
}
