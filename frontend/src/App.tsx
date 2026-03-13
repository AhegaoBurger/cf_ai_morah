import { useState, useCallback } from "react";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { useChat } from "./hooks/useChat";

export default function App() {
  const { messages, state, loading, error, send } = useChat();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleReset = useCallback(async () => {
    // After reset, refetch state (messages are local, reload page for full reset)
    window.location.reload();
  }, []);

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#fff",
    }}>
      <Sidebar state={state} onOpenSettings={() => setSettingsOpen(true)} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span style={{ fontSize: 22 }}>🇮🇱</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Morah</span>
          <span style={{ color: "#9ca3af", fontSize: 14 }}>— Hebrew Tutor for Olim</span>
        </header>

        {error && (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.5rem 1.5rem", fontSize: 14 }}>
            {error}
          </div>
        )}

        <Chat messages={messages} loading={loading} onSend={send} />
      </main>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} onReset={handleReset} />}
    </div>
  );
}
