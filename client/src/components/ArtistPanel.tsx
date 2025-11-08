import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, X, Send, Mic, MicOff, Trash2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { voiceManager } from "@/lib/voiceManager";
import mermaid from "mermaid";
import type { Diagram } from "@shared/schema";

interface ArtistPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function ArtistPanel({ workspaceId, onClose }: ArtistPanelProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const mermaidRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#4f46e5',
        lineColor: '#8b5cf6',
        secondaryColor: '#ec4899',
        tertiaryColor: '#14b8a6',
        background: '#1e1e2e',
        mainBkg: '#1e1e2e',
        secondBkg: '#2d2d3d',
        tertiaryBkg: '#3d3d4d',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, []);

  // Fetch diagrams for this workspace
  const { data: diagrams = [], isLoading: diagramsLoading } = useQuery<Diagram[]>({
    queryKey: [`/api/workspaces/${workspaceId}/diagrams`],
  });

  // Generate diagram mutation
  const generateDiagramMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/ai/artist", { 
        workspaceId,
        prompt 
      });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/diagrams`] });
      setInput("");
    },
    onError: (error) => {
      console.error("Diagram generation error:", error);
      alert("Failed to generate diagram. Please try again.");
    },
  });

  // Delete diagram mutation
  const deleteDiagramMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      try {
        const res = await apiRequest("DELETE", `/api/diagrams/${diagramId}`, {});
        return await res.json();
      } catch (error) {
        console.error("Diagram deletion error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/diagrams`] });
    },
    onError: (error) => {
      console.error("Diagram deletion error:", error);
      alert("Failed to delete diagram. Please try again.");
    },
  });

  // Render Mermaid diagrams when they change
  useEffect(() => {
    if (diagrams.length > 0) {
      diagrams.forEach(async (diagram) => {
        const element = mermaidRefs.current[diagram.id];
        if (element && diagram.mermaidCode) {
          try {
            element.innerHTML = '';
            const { svg } = await mermaid.render(`mermaid-${diagram.id}`, diagram.mermaidCode);
            element.innerHTML = svg;
          } catch (error) {
            console.error("Mermaid render error:", error);
            element.innerHTML = `<div class="text-destructive p-4">Failed to render diagram</div>`;
          }
        }
      });
    }
  }, [diagrams]);

  const handleGenerate = () => {
    if (!input.trim() || generateDiagramMutation.isPending) return;
    generateDiagramMutation.mutate(input);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      voiceManager.stop();
      setIsListening(false);
    } else {
      const started = voiceManager.start((text) => setInput(text));
      setIsListening(started);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(voiceManager.getIsListening());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const downloadDiagram = (diagramId: string) => {
    const element = mermaidRefs.current[diagramId];
    if (!element) return;

    const svg = element.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${diagramId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const regenerateDiagram = (diagram: Diagram) => {
    generateDiagramMutation.mutate(diagram.prompt);
  };

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
      <header className="h-12 border-b border-border px-4 flex items-center justify-between bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Artist Canvas</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          data-testid="button-close-artist"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {diagramsLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading diagrams...</div>
          </div>
        )}

        {!diagramsLoading && diagrams.length === 0 && !generateDiagramMutation.isPending && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Create AI Diagrams</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Describe a flowchart, sequence diagram, or any other diagram you want to create.
              </p>
              <div className="text-xs text-muted-foreground space-y-1 text-left bg-muted/50 p-3 rounded-md">
                <p><strong>Examples:</strong></p>
                <p>• "Create a flowchart for a user login process"</p>
                <p>• "Show me a sequence diagram for API authentication"</p>
                <p>• "Draw a class diagram for a social media app"</p>
                <p>• "Make a state diagram for order processing"</p>
              </div>
            </div>
          </div>
        )}

        {generateDiagramMutation.isPending && (
          <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg border border-border">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Generating diagram...</p>
            </div>
          </div>
        )}

        {diagrams.map((diagram) => (
          <div
            key={diagram.id}
            className={`bg-card border rounded-lg overflow-hidden transition-all ${
              selectedDiagram === diagram.id ? "border-primary shadow-lg" : "border-border"
            }`}
            onClick={() => setSelectedDiagram(diagram.id)}
            data-testid={`diagram-${diagram.id}`}
          >
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{diagram.prompt}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    regenerateDiagram(diagram);
                  }}
                  data-testid={`button-regenerate-${diagram.id}`}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDiagram(diagram.id);
                  }}
                  data-testid={`button-download-${diagram.id}`}
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this diagram?")) {
                      deleteDiagramMutation.mutate(diagram.id);
                    }
                  }}
                  disabled={deleteDiagramMutation.isPending}
                  data-testid={`button-delete-${diagram.id}`}
                >
                  {deleteDiagramMutation.isPending ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-6 bg-background/50 min-h-[200px] flex items-center justify-center overflow-x-auto">
              <div
                ref={(el) => (mermaidRefs.current[diagram.id] = el)}
                className="mermaid-diagram w-full"
                data-testid={`mermaid-render-${diagram.id}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 bg-card/80 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            placeholder="Describe the diagram you want to create (or use voice)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={generateDiagramMutation.isPending}
            data-testid="input-diagram-prompt"
          />
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={toggleVoiceInput}
            data-testid="button-voice-toggle"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            onClick={handleGenerate}
            disabled={generateDiagramMutation.isPending || !input.trim()}
            data-testid="button-generate-diagram"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
