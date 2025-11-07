import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, X, Send, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Diagram } from "@shared/schema";
import mermaid from "mermaid";

interface ArtistPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function ArtistPanel({ workspaceId, onClose }: ArtistPanelProps) {
  const [input, setInput] = useState("");
  const [currentDiagram, setCurrentDiagram] = useState<string>("");
  const diagramRef = useRef<HTMLDivElement>(null);

  const { data: diagrams = [] } = useQuery<Diagram[]>({
    queryKey: ["/api/workspaces", workspaceId, "diagrams"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/diagrams`);
      if (!res.ok) throw new Error("Failed to fetch diagrams");
      return res.json();
    },
  });

  const generateDiagramMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/ai/artist", { workspaceId, prompt });
      return await res.json();
    },
    onSuccess: (diagram: Diagram) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "diagrams"] });
      setCurrentDiagram(diagram.mermaidCode);
      setInput("");
    },
  });

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    if (diagrams.length > 0 && !currentDiagram) {
      setCurrentDiagram(diagrams[0].mermaidCode);
    }
  }, [diagrams, currentDiagram]);

  useEffect(() => {
    if (currentDiagram && diagramRef.current) {
      diagramRef.current.innerHTML = "";
      const element = document.createElement("div");
      element.className = "mermaid";
      element.textContent = currentDiagram;
      diagramRef.current.appendChild(element);
      mermaid.run({ nodes: [element] }).catch(err => {
        console.error("Mermaid rendering error:", err);
        diagramRef.current!.innerHTML = `<p class="text-destructive">Error rendering diagram. Please try a different description.</p>`;
      });
    }
  }, [currentDiagram]);

  const handleGenerateDiagram = () => {
    if (!input.trim() || generateDiagramMutation.isPending) return;
    generateDiagramMutation.mutate(input);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="h-12 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Artist</span>
        </div>
        <div className="flex items-center gap-1">
          {currentDiagram && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid="button-reset-diagram"
              onClick={() => setCurrentDiagram("")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="button-close-artist"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        {currentDiagram ? (
          <div className="w-full h-full flex items-center justify-center">
            <div ref={diagramRef} className="w-full" />
          </div>
        ) : generateDiagramMutation.isPending ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Generating diagram...</p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Create a Diagram</h3>
              <p className="text-sm text-muted-foreground">
                Describe the flowchart, wireframe, or mind map you want to create, and I'll generate it using Mermaid.js.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Describe your diagram..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateDiagram()}
            data-testid="input-artist-prompt"
            disabled={generateDiagramMutation.isPending}
          />
          <Button
            size="icon"
            onClick={handleGenerateDiagram}
            data-testid="button-generate-diagram"
            disabled={generateDiagramMutation.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
