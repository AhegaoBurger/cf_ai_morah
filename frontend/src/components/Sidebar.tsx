import type { ChatResponse } from "../api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "./ui/sidebar";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Settings, BookOpen, Globe, User } from "lucide-react";

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

interface AppSidebarProps {
  state: ChatResponse["state"] | null;
  onOpenSettings: () => void;
}

export function AppSidebar({ state, onOpenSettings }: AppSidebarProps) {
  const chapter = state?.curriculum.currentChapter ?? 1;
  const progress = ((chapter - 1) / 10) * 100;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <span className="text-xl">🇮🇱</span>
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            Morah
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Progress</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 group-data-[collapsible=icon]:hidden">
            <div className="space-y-2">
              <div className="font-semibold text-sm">
                Ch {chapter}: {CHAPTER_NAMES[chapter] ?? "—"}
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {chapter} / 10 chapters
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Vocabulary</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 group-data-[collapsible=icon]:hidden">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span>Known</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {state?.vocab.known.length ?? 0}
                </Badge>
              </div>
              {(state?.vocab.struggling.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Struggling</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {state!.vocab.struggling.length}
                  </Badge>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {state?.profile && (state.profile.name || state.profile.neighborhood || state.profile.originCountry) && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Profile</span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2 group-data-[collapsible=icon]:hidden">
              <div className="space-y-1 text-sm">
                {state.profile.name && <div className="font-medium">{state.profile.name}</div>}
                {state.profile.neighborhood && (
                  <div className="text-muted-foreground">{state.profile.neighborhood}</div>
                )}
                {state.profile.originCountry && (
                  <div className="text-muted-foreground">From: {state.profile.originCountry}</div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
