import { useState } from "react";
import { registerTelegram, resetProgress, updateProfile } from "../api";
import type { UserState } from "../api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Pencil, X, Plus, Loader2 } from "lucide-react";

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function EditableField({
  label,
  value,
  onSave,
  onDelete,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onSave(draft.trim());
              setEditing(false);
            }
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          placeholder={label}
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (draft.trim()) {
              onSave(draft.trim());
              setEditing(false);
            }
          }}
          className="h-8 text-xs"
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="h-8 text-xs text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-2 text-sm group">
      <span className="text-muted-foreground min-w-[100px]">{label}:</span>
      <span className="flex-1">{value}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

function EditableTag({
  value,
  onSave,
  onDelete,
  variant = "default",
}: {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
  variant?: "default" | "warning";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onSave(draft.trim());
              setEditing(false);
            }
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="h-6 text-xs w-24"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (draft.trim()) {
              onSave(draft.trim());
              setEditing(false);
            }
          }}
          className="h-6 text-xs px-2"
        >
          OK
        </Button>
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`cursor-pointer gap-1 ${
        variant === "warning"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      }`}
    >
      <span
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </span>
      <button
        onClick={onDelete}
        className="ml-0.5 hover:text-destructive transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function AddField({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (val: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  if (!adding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAdding(true)}
        className="text-xs mt-1 h-7 gap-1"
      >
        <Plus className="h-3 w-3" /> Add
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onAdd(draft.trim());
            setDraft("");
            setAdding(false);
          }
          if (e.key === "Escape") {
            setDraft("");
            setAdding(false);
          }
        }}
        placeholder={placeholder}
        className="flex-1 h-8 text-sm"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (draft.trim()) {
            onAdd(draft.trim());
            setDraft("");
            setAdding(false);
          }
        }}
        className="h-8 text-xs"
      >
        Add
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setDraft("");
          setAdding(false);
        }}
        className="h-8 text-xs text-muted-foreground"
      >
        Cancel
      </Button>
    </div>
  );
}

export function Settings({
  open,
  onOpenChange,
  onReset,
  state,
  onStateUpdate,
}: SettingsProps) {
  const [token, setToken] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
    setResetting(true);
    await resetProgress().catch(() => null);
    setResetting(false);
    setConfirmReset(false);
    onReset();
    onOpenChange(false);
  }

  const profile = state?.profile;
  const vocab = state?.vocab;
  const notes = profile?.personalNotes ?? [];
  const knownWords = vocab?.known ?? [];
  const strugglingWords = vocab?.struggling ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Settings
              {saving && (
                <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> saving...
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Knowledge section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">What Morah knows about you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile fields */}
              <div>
                <h4 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold mb-2">
                  Profile
                </h4>
                {PROFILE_FIELDS.map(({ key, label }) => {
                  const value = profile?.[key];
                  if (key === "personalNotes") return null;
                  if (typeof value === "string" && value) {
                    return (
                      <EditableField
                        key={key}
                        label={label}
                        value={value}
                        onSave={(v) => saveProfileField(key, v)}
                        onDelete={() => saveProfileField(key, null)}
                      />
                    );
                  }
                  return null;
                })}
                {PROFILE_FIELDS.filter(
                  ({ key }) => key !== "personalNotes" && !profile?.[key]
                ).length > 0 && (
                  <div className="mt-1">
                    {PROFILE_FIELDS.filter(
                      ({ key }) => key !== "personalNotes" && !profile?.[key]
                    ).map(({ key, label }) => (
                      <AddField
                        key={key}
                        placeholder={label}
                        onAdd={(v) => saveProfileField(key, v)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Personal notes */}
              <div>
                <h4 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold mb-2">
                  Memories
                </h4>
                {notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No memories yet — Morah learns about you as you chat.
                  </p>
                )}
                {notes.map((note, i) => (
                  <EditableField
                    key={`${note}-${i}`}
                    label={`#${i + 1}`}
                    value={note}
                    onSave={(v) => {
                      const updated = [...notes];
                      updated[i] = v;
                      saveNotes(updated);
                    }}
                    onDelete={() => saveNotes(notes.filter((_, j) => j !== i))}
                  />
                ))}
                <AddField
                  placeholder="Add a note..."
                  onAdd={(v) => saveNotes([...notes, v])}
                />
              </div>

              <Separator />

              {/* Known vocabulary */}
              <div>
                <h4 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold mb-2">
                  Known vocabulary
                </h4>
                {knownWords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No words tracked yet.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {knownWords.map((word, i) => (
                    <EditableTag
                      key={`${word}-${i}`}
                      value={word}
                      onSave={(v) => {
                        const updated = [...knownWords];
                        updated[i] = v;
                        saveVocab("known", updated);
                      }}
                      onDelete={() =>
                        saveVocab(
                          "known",
                          knownWords.filter((_, j) => j !== i)
                        )
                      }
                    />
                  ))}
                </div>
                <AddField
                  placeholder="Add a word..."
                  onAdd={(v) => saveVocab("known", [...knownWords, v])}
                />
              </div>

              <Separator />

              {/* Struggling vocabulary */}
              <div>
                <h4 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold mb-2">
                  Struggling with
                </h4>
                {strugglingWords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No struggling words.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {strugglingWords.map((word, i) => (
                    <EditableTag
                      key={`${word}-${i}`}
                      value={word}
                      variant="warning"
                      onSave={(v) => {
                        const updated = [...strugglingWords];
                        updated[i] = v;
                        saveVocab("struggling", updated);
                      }}
                      onDelete={() =>
                        saveVocab(
                          "struggling",
                          strugglingWords.filter((_, j) => j !== i)
                        )
                      }
                    />
                  ))}
                </div>
                <AddField
                  placeholder="Add a word..."
                  onAdd={(v) =>
                    saveVocab("struggling", [...strugglingWords, v])
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Telegram section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Telegram Bot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Create a bot via @BotFather on Telegram, paste the token here,
                and chat with Morah directly from Telegram.
              </p>
              <Input
                type="text"
                placeholder="1234567890:ABCdef..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mb-2"
              />
              <Button
                onClick={handleTelegramSave}
                disabled={!token.trim() || telegramStatus === "loading"}
                size="sm"
              >
                {telegramStatus === "loading"
                  ? "Registering..."
                  : telegramStatus === "ok"
                    ? "Registered!"
                    : "Register Bot"}
              </Button>
              {telegramStatus === "error" && (
                <p className="text-destructive text-sm mt-1">
                  Failed — check your token.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reset section */}
          <Card className="border-destructive/20">
            <CardContent className="pt-6">
              {!confirmReset ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                >
                  Reset Progress
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-destructive font-medium">
                    Reset all progress? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReset}
                      disabled={resetting}
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />{" "}
                          Resetting...
                        </>
                      ) : (
                        "Yes, reset everything"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
