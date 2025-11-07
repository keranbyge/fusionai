import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CoderPanel } from "@/components/CoderPanel";
import { ArtistPanel } from "@/components/ArtistPanel";
import { TutorPanel } from "@/components/TutorPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { Workspace } from "@shared/schema";
import { Sparkles } from "lucide-react";

export default function WorkspacePage() {
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [panelStates, setPanelStates] = useState({
    coder: true,
    artist: true,
    tutor: true,
  });

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/workspaces", { name });
      return await res.json();
    },
    onSuccess: (newWorkspace: Workspace) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setActiveWorkspace(newWorkspace.id);
      setPanelStates(newWorkspace.panelStates as any || { coder: true, artist: true, tutor: true });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, panelStates }: { id: string; panelStates: any }) => {
      const res = await apiRequest("PATCH", `/api/workspaces/${id}`, { panelStates });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspace) {
      const first = workspaces[0];
      setActiveWorkspace(first.id);
      setPanelStates(first.panelStates as any || { coder: true, artist: true, tutor: true });
    }
  }, [workspaces, activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      const workspace = workspaces.find(w => w.id === activeWorkspace);
      if (workspace) {
        setPanelStates(workspace.panelStates as any || { coder: true, artist: true, tutor: true });
      }
    }
  }, [activeWorkspace, workspaces]);

  const handleNewWorkspace = () => {
    const name = `Workspace ${workspaces.length + 1}`;
    createWorkspaceMutation.mutate(name);
  };

  const togglePanel = (panel: keyof typeof panelStates) => {
    const newStates = { ...panelStates, [panel]: !panelStates[panel] };
    setPanelStates(newStates);
    if (activeWorkspace) {
      updateWorkspaceMutation.mutate({ id: activeWorkspace, panelStates: newStates });
    }
  };

  const visiblePanels = Object.entries(panelStates).filter(([_, visible]) => visible).length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading workspaces...</p>
      </div>
    );
  }

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);

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
            disabled={createWorkspaceMutation.isPending}
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
                  {new Date(workspace.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b px-4 flex items-center justify-between bg-background">
          <h1 className="font-semibold">
            {currentWorkspace?.name || "Select a workspace"}
          </h1>
          {activeWorkspace && (
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
          )}
        </header>

        {!activeWorkspace ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Create or select a workspace to get started</p>
          </div>
        ) : visiblePanels === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>All panels are hidden. Toggle a panel to start working.</p>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {panelStates.coder && (
              <>
                <ResizablePanel defaultSize={33} minSize={20}>
                  <CoderPanel workspaceId={activeWorkspace} onClose={() => togglePanel("coder")} />
                </ResizablePanel>
                {(panelStates.artist || panelStates.tutor) && <ResizableHandle />}
              </>
            )}

            {panelStates.artist && (
              <>
                <ResizablePanel defaultSize={33} minSize={20}>
                  <ArtistPanel workspaceId={activeWorkspace} onClose={() => togglePanel("artist")} />
                </ResizablePanel>
                {panelStates.tutor && <ResizableHandle />}
              </>
            )}

            {panelStates.tutor && (
              <ResizablePanel defaultSize={33} minSize={20}>
                <TutorPanel workspaceId={activeWorkspace} onClose={() => togglePanel("tutor")} />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        )}
      </main>
    </div>
  );
}
