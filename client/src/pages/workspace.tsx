import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, LogOut, User, BarChart3, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CoderPanel } from "@/components/CoderPanel";
import { ArtistPanel } from "@/components/ArtistPanel";
import { TutorPanel } from "@/components/TutorPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Workspace } from "@shared/schema";
import { Sparkles } from "lucide-react";

export default function WorkspacePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renamingWorkspaceId, setRenamingWorkspaceId] = useState<string | null>(null);
  const [panelStates, setPanelStates] = useState({
    coder: true,
    artist: true,
    tutor: true,
  });
  const workspaceCreatedRef = useRef(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: isAuthenticated, // Only fetch workspaces if authenticated
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
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/workspaces/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workspaces/${id}`);
      return id;
    },
    onSuccess: async (deletedId) => {
      if (activeWorkspace === deletedId) {
        const remaining = workspaces.filter(w => w.id !== deletedId);
        setActiveWorkspace(remaining.length > 0 ? remaining[0].id : null);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
    onError: (error) => {
      console.error('Delete workspace error:', error);
      alert('Failed to delete workspace. Please restart the server.');
    },
  });

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser") || "demo";
    const firstWorkspaceName = localStorage.getItem("firstWorkspace");
    const userFirstWorkspace = localStorage.getItem(`firstWorkspace_${currentUser}`);
    
    if ((firstWorkspaceName || userFirstWorkspace) && workspaces.length === 0 && !workspaceCreatedRef.current) {
      workspaceCreatedRef.current = true;
      const workspaceName = firstWorkspaceName || userFirstWorkspace || "My Workspace";
      createWorkspaceMutation.mutate(workspaceName);
      localStorage.removeItem("firstWorkspace");
    } else if (workspaces.length > 0 && !activeWorkspace) {
      const first = workspaces[0];
      setActiveWorkspace(first.id);
      setPanelStates(first.panelStates as any || { coder: true, artist: true, tutor: true });
    }
  }, [workspaces]);

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
      updateWorkspaceMutation.mutate({ id: activeWorkspace, updates: { panelStates: newStates } });
    }
  };

  const handleRenameWorkspace = (workspace: Workspace) => {
    setRenamingWorkspaceId(workspace.id);
    setRenameValue(workspace.name);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (renamingWorkspaceId && renameValue.trim()) {
      updateWorkspaceMutation.mutate({ id: renamingWorkspaceId, updates: { name: renameValue } });
      setRenameDialogOpen(false);
    }
  };

  const handleDeleteWorkspace = (id: string) => {
    if (confirm("Are you sure you want to delete this workspace?")) {
      deleteWorkspaceMutation.mutate(id);
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/auth");
    },
  });

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logoutMutation.mutate();
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
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sidebar-primary" />
              <span className="font-bold font-sixtyfour">Fusion.AI</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!sidebarCollapsed && <ThemeToggle />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4">
            <Button
              onClick={handleNewWorkspace}
              className="w-full justify-start gap-2 bg-[#a361ff] ml-[0px] mr-[0px] text-center font-extrabold"
              data-testid="button-new-workspace"
              disabled={createWorkspaceMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="relative group">
                <button
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${
                    activeWorkspace === workspace.id ? "bg-sidebar-accent" : ""
                  }`}
                  data-testid={`workspace-${workspace.id}`}
                >
                  {sidebarCollapsed ? (
                    <div className="flex justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-sm pr-16">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(workspace.updatedAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </button>
                {!sidebarCollapsed && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameWorkspace(workspace);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkspace(workspace.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-2`}>
                <User className="h-4 w-4" />
                {!sidebarCollapsed && <span>{localStorage.getItem("userName") || "Demo User"}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b px-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">
              {currentWorkspace?.name || "Select a workspace"}
            </h1>
            <Link href="/stats">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Stats
              </Button>
            </Link>
            <Link href="/reminders">
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-reminders">
                <Bell className="h-4 w-4" />
                Reminders
              </Button>
            </Link>
          </div>
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

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            placeholder="Workspace name"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
