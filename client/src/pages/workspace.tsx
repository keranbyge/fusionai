import { useState } from "react";
import { Plus, MoreVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CoderPanel } from "@/components/CoderPanel";
import { ArtistPanel } from "@/components/ArtistPanel";
import { TutorPanel } from "@/components/TutorPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface Workspace {
  id: string;
  name: string;
  lastModified: string;
}

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "1", name: "My First Project", lastModified: "2 hours ago" },
    { id: "2", name: "Learning React", lastModified: "Yesterday" },
    { id: "3", name: "Portfolio Site", lastModified: "3 days ago" },
  ]);
  const [activeWorkspace, setActiveWorkspace] = useState("1");
  const [panelStates, setPanelStates] = useState({
    coder: true,
    artist: true,
    tutor: true,
  });

  const handleNewWorkspace = () => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: `Workspace ${workspaces.length + 1}`,
      lastModified: "Just now",
    };
    setWorkspaces([newWorkspace, ...workspaces]);
    setActiveWorkspace(newWorkspace.id);
  };

  const togglePanel = (panel: keyof typeof panelStates) => {
    setPanelStates((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const visiblePanels = Object.entries(panelStates).filter(([_, visible]) => visible).length;

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-sidebar flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sidebar-primary" />
            <span className="font-bold">CoCreate AI</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-4">
          <Button
            onClick={handleNewWorkspace}
            className="w-full justify-start gap-2"
            data-testid="button-new-workspace"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => setActiveWorkspace(workspace.id)}
                className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${
                  activeWorkspace === workspace.id
                    ? "bg-sidebar-accent"
                    : ""
                }`}
                data-testid={`workspace-${workspace.id}`}
              >
                <div className="font-medium text-sm">{workspace.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {workspace.lastModified}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b px-4 flex items-center justify-between bg-background">
          <h1 className="font-semibold">
            {workspaces.find((w) => w.id === activeWorkspace)?.name}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel("coder")}
              data-testid="toggle-coder"
            >
              Coder {!panelStates.coder && "(Hidden)"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel("artist")}
              data-testid="toggle-artist"
            >
              Artist {!panelStates.artist && "(Hidden)"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel("tutor")}
              data-testid="toggle-tutor"
            >
              Tutor {!panelStates.tutor && "(Hidden)"}
            </Button>
          </div>
        </header>

        {visiblePanels === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>All panels are hidden. Toggle a panel to start working.</p>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {panelStates.coder && (
              <>
                <ResizablePanel defaultSize={33} minSize={20}>
                  <CoderPanel onClose={() => togglePanel("coder")} />
                </ResizablePanel>
                {(panelStates.artist || panelStates.tutor) && <ResizableHandle />}
              </>
            )}

            {panelStates.artist && (
              <>
                <ResizablePanel defaultSize={33} minSize={20}>
                  <ArtistPanel onClose={() => togglePanel("artist")} />
                </ResizablePanel>
                {panelStates.tutor && <ResizableHandle />}
              </>
            )}

            {panelStates.tutor && (
              <ResizablePanel defaultSize={33} minSize={20}>
                <TutorPanel onClose={() => togglePanel("tutor")} />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        )}
      </main>
    </div>
  );
}
