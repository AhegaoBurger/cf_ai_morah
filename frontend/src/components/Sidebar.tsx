import type { ChatResponse } from "../api";

const CHAPTER_NAMES: Record<number, string> = {
  1: "Alphabet",
  2: "Coming Home",
  3: "Neighborhood",
  4: "Jerusalem",
  5: "Plans",
  6: "School",
  7: "Family",
  8: "Hanukkah",
  9: "Clinic",
  10: "Meetings",
};

interface SidebarProps {
  state: ChatResponse["state"] | null;
  onOpenSettings: () => void;
}

export function Sidebar({ state, onOpenSettings }: SidebarProps) {
  const chapter = state?.curriculum.currentChapter ?? 1;
  const progress = ((chapter - 1) / 10) * 100;

  return (
    <aside style={{
      width: 200,
      padding: "1rem",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      fontSize: 14,
      color: "#374151",
    }}>
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Progress</h3>
        <div style={{ fontWeight: 600 }}>Ch {chapter}: {CHAPTER_NAMES[chapter] ?? "—"}</div>
        <div style={{ marginTop: 6, background: "#e5e7eb", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${progress}%`, background: "#3b82f6", height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
        <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 12 }}>{chapter} / 10 chapters</div>
      </div>

      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Vocabulary</h3>
        <div>Known: <strong>{state?.vocab.known.length ?? 0}</strong> words</div>
        {(state?.vocab.struggling.length ?? 0) > 0 && (
          <div style={{ color: "#ef4444" }}>Struggling: <strong>{state!.vocab.struggling.length}</strong></div>
        )}
      </div>

      {state?.profile && (
        <div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 13, textTransform: "uppercase", color: "#9ca3af", letterSpacing: 1 }}>Profile</h3>
          {state.profile.name && <div>{state.profile.name}</div>}
          {state.profile.neighborhood && <div>{state.profile.neighborhood}</div>}
          {state.profile.originCountry && <div>From: {state.profile.originCountry}</div>}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <button
          onClick={onOpenSettings}
          style={{ width: "100%", padding: "0.5rem", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          Settings ⚙
        </button>
      </div>
    </aside>
  );
}
