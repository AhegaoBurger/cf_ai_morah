import { useState } from "react";
import { registerTelegram, resetProgress } from "../api";

interface SettingsProps {
  onClose: () => void;
  onReset: () => void;
}

export function Settings({ onClose, onReset }: SettingsProps) {
  const [token, setToken] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [resetting, setResetting] = useState(false);

  async function handleTelegramSave() {
    if (!token.trim()) return;
    setTelegramStatus("loading");
    try {
      const result = await registerTelegram(token.trim());
      setTelegramStatus(result.ok ? "ok" : "error");
    } catch {
      setTelegramStatus("error");
    }
  }

  async function handleReset() {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    setResetting(true);
    await resetProgress().catch(() => null);
    setResetting(false);
    onReset();
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "2rem", width: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 1.5rem", fontSize: 18 }}>Settings</h2>

        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 0.5rem" }}>Telegram Bot</h3>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 0.75rem" }}>
            Create a bot via @BotFather on Telegram, paste the token here, and chat with Morah directly from Telegram.
          </p>
          <input
            type="text"
            placeholder="1234567890:ABCdef..."
            value={token}
            onChange={e => setToken(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
          />
          <button
            onClick={handleTelegramSave}
            disabled={!token.trim() || telegramStatus === "loading"}
            style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            {telegramStatus === "loading" ? "Registering..." : telegramStatus === "ok" ? "Registered!" : "Register Bot"}
          </button>
          {telegramStatus === "error" && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>Failed — check your token.</div>}
        </section>

        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{ padding: "0.5rem 1rem", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            {resetting ? "Resetting..." : "Reset Progress"}
          </button>
        </section>

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
      </div>
    </div>
  );
}
