import { useState, useCallback } from "react";
import { Chat } from "./components/Chat";
import { AppSidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { useChat } from "./hooks/useChat";
import { useTheme } from "./components/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Button } from "./components/ui/button";
import { Sun, Moon } from "lucide-react";

export default function App() {
  const { messages, state, setState, loading, error, send } = useChat();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleReset = useCallback(async () => {
    window.location.reload();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        <AppSidebar state={state} onOpenSettings={() => setSettingsOpen(true)} />

        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">🇮🇱</span>
              <span className="font-bold text-lg">Morah</span>
              <span className="text-muted-foreground text-sm hidden sm:inline">
                — Hebrew Tutor for Olim
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </header>

          {error && (
            <div className="bg-destructive/10 text-destructive px-6 py-2 text-sm">
              {error}
            </div>
          )}

          <Chat messages={messages} loading={loading} onSend={send} />
        </main>

        <Settings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onReset={handleReset}
          state={state}
          onStateUpdate={setState}
        />
      </div>
    </SidebarProvider>
  );
}
