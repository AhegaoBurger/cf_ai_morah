import { useState } from "react";
import { registerTelegram, resetProgress, updateProfile } from "../api";
import type { UserState } from "../api";

interface SettingsProps {
  onClose: () => void;
  onReset: () => void;
  state: UserState | null;
  onStateUpdate: (state: UserState) => void;
}

const PROFILE_FIELDS: { key: keyof UserState["profile"]; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "originCountry", label: "Country of origin" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "occupation", label: "Occupation" },
  { key: "familySituation", label: "Family situation" },
  { key: "aliyahDate", label: "Aliyah date" },
];

function EditableField({ label, value, onSave, onDelete }: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && draft.trim()) { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          placeholder={label}
          style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={() => { if (draft.trim()) { onSave(draft.trim()); setEditing(false); } }} style={smallBtn}>Save</button>
        <button onClick={() => { setDraft(value); setEditing(false); }} style={{ ...smallBtn, color: "#6b7280" }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: "#6b7280", minWidth: 100 }}>{label}:</span>
      <span style={{ flex: 1 }}>{value}</span>
      <button onClick={() => { setDraft(value); setEditing(true); }} style={iconBtn} title="Edit">✎</button>
      <button onClick={onDelete} style={{ ...iconBtn, color: "#ef4444" }} title="Delete">×</button>
    </div>
  );
}

function EditableTag({ value, onSave, onDelete }: {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && draft.trim()) { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          style={{ padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, width: 100 }}
        />
        <button onClick={() => { if (draft.trim()) { onSave(draft.trim()); setEditing(false); } }} style={smallBtn}>OK</button>
      </span>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#f3f4f6", borderRadius: 12, padding: "3px 10px", fontSize: 12, margin: 2,
    }}>
      <span onClick={() => { setDraft(value); setEditing(true); }} style={{ cursor: "pointer" }}>{value}</span>
      <button onClick={onDelete} style={{ ...iconBtn, fontSize: 14, color: "#9ca3af", padding: 0 }}>×</button>
    </span>
  );
}

function AddField({ placeholder, onAdd }: { placeholder: string; onAdd: (val: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  if (!adding) {
    return <button onClick={() => setAdding(true)} style={{ ...smallBtn, color: "#3b82f6", marginTop: 4 }}>+ Add</button>;
  }

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && draft.trim()) { onAdd(draft.trim()); setDraft(""); setAdding(false); }
          if (e.key === "Escape") { setDraft(""); setAdding(false); }
        }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
      />
      <button onClick={() => { if (draft.trim()) { onAdd(draft.trim()); setDraft(""); setAdding(false); } }} style={smallBtn}>Add</button>
      <button onClick={() => { setDraft(""); setAdding(false); }} style={{ ...smallBtn, color: "#6b7280" }}>Cancel</button>
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 6px", color: "#3b82f6",
};

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "0 2px", color: "#9ca3af",
};

const sectionHeading: React.CSSProperties = {
  fontSize: 12, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1, margin: "0 0 8px", fontWeight: 600,
};

export function Settings({ onClose, onReset, state, onStateUpdate }: SettingsProps) {
  const [token, setToken] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(updates: Parameters<typeof updateProfile>[0]) {
    setSaving(true);
    try {
      const newState = await updateProfile(updates);
      onStateUpdate(newState);
    } catch {
      // silently fail — state stays stale until next refresh
    } finally {
      setSaving(false);
    }
  }

  function saveProfileField(key: string, value: string | null) {
    save({ profile: { [key]: value } });
  }

  function saveNotes(notes: string[]) {
    save({ profile: { personalNotes: notes } });
  }

  function saveVocab(key: "known" | "struggling", words: string[]) {
    save({ vocab: { [key]: words } });
  }

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

  const profile = state?.profile;
  const vocab = state?.vocab;
  const notes = profile?.personalNotes ?? [];
  const knownWords = vocab?.known ?? [];
  const strugglingWords = vocab?.struggling ?? [];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "1.5rem", width: 480, maxHeight: "80vh",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflowY: "auto", position: "relative",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>

        <h2 style={{ margin: "0 0 1.25rem", fontSize: 18 }}>Settings</h2>

        {/* Knowledge section */}
        <section style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: 15, margin: "0 0 1rem", fontWeight: 600 }}>
            What Morah knows about you
            {saving && <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>saving...</span>}
          </h3>

          {/* Profile fields */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={sectionHeading}>Profile</h4>
            {PROFILE_FIELDS.map(({ key, label }) => {
              const value = profile?.[key];
              if (key === "personalNotes") return null;
              if (typeof value === "string" && value) {
                return (
                  <EditableField
                    key={key}
                    label={label}
                    value={value}
                    onSave={v => saveProfileField(key, v)}
                    onDelete={() => saveProfileField(key, null)}
                  />
                );
              }
              return null;
            })}
            {/* Show add buttons for empty fields */}
            {PROFILE_FIELDS.filter(({ key }) => key !== "personalNotes" && !profile?.[key]).length > 0 && (
              <div style={{ marginTop: 6 }}>
                {PROFILE_FIELDS.filter(({ key }) => key !== "personalNotes" && !profile?.[key]).map(({ key, label }) => (
                  <AddField
                    key={key}
                    placeholder={label}
                    onAdd={v => saveProfileField(key, v)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Personal notes */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={sectionHeading}>Memories</h4>
            {notes.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No memories yet — Morah learns about you as you chat.</div>}
            {notes.map((note, i) => (
              <EditableField
                key={`${note}-${i}`}
                label={`#${i + 1}`}
                value={note}
                onSave={v => { const updated = [...notes]; updated[i] = v; saveNotes(updated); }}
                onDelete={() => saveNotes(notes.filter((_, j) => j !== i))}
              />
            ))}
            <AddField placeholder="Add a note..." onAdd={v => saveNotes([...notes, v])} />
          </div>

          {/* Vocabulary */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={sectionHeading}>Known vocabulary</h4>
            {knownWords.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No words tracked yet.</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {knownWords.map((word, i) => (
                <EditableTag
                  key={`${word}-${i}`}
                  value={word}
                  onSave={v => { const updated = [...knownWords]; updated[i] = v; saveVocab("known", updated); }}
                  onDelete={() => saveVocab("known", knownWords.filter((_, j) => j !== i))}
                />
              ))}
            </div>
            <AddField placeholder="Add a word..." onAdd={v => saveVocab("known", [...knownWords, v])} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={sectionHeading}>Struggling with</h4>
            {strugglingWords.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No struggling words.</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {strugglingWords.map((word, i) => (
                <EditableTag
                  key={`${word}-${i}`}
                  value={word}
                  onSave={v => { const updated = [...strugglingWords]; updated[i] = v; saveVocab("struggling", updated); }}
                  onDelete={() => saveVocab("struggling", strugglingWords.filter((_, j) => j !== i))}
                />
              ))}
            </div>
            <AddField placeholder="Add a word..." onAdd={v => saveVocab("struggling", [...strugglingWords, v])} />
          </div>
        </section>

        {/* Telegram section */}
        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.25rem", marginBottom: "1.25rem" }}>
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

        {/* Reset section */}
        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.25rem" }}>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{ padding: "0.5rem 1rem", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            {resetting ? "Resetting..." : "Reset Progress"}
          </button>
        </section>
      </div>
    </div>
  );
}
