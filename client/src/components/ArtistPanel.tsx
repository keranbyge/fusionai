import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Download, ZoomIn, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import mermaid from "mermaid";

interface ArtistPanelProps {
  onClose: () => void;
}

export function ArtistPanel({ onClose }: ArtistPanelProps) {
  const [input, setInput] = useState("");
  const [diagram, setDiagram] = useState("");
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    if (diagram && diagramRef.current) {
      diagramRef.current.innerHTML = "";
      const id = `mermaid-${Date.now()}`;
      const element = document.createElement("div");
      element.className = "mermaid";
      element.textContent = diagram;
      diagramRef.current.appendChild(element);
      mermaid.run({ nodes: [element] });
    }
  }, [diagram]);

  const handleGenerateDiagram = () => {
    if (!input.trim()) return;

    const exampleDiagram = `graph TD
    A[Start] --> B{User Input}
    B -->|Code| C[Coder Panel]
    B -->|Diagram| D[Artist Panel]
    B -->|Learn| E[Tutor Panel]
    C --> F[AI Processing]
    D --> F
    E --> F
    F --> G[Response]
    G --> H[Save to Memory]`;

    setDiagram(exampleDiagram);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="h-12 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Artist</span>
        </div>
        <div className="flex items-center gap-1">
          {diagram && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="button-download-diagram"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="button-reset-diagram"
                onClick={() => setDiagram("")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
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
        {diagram ? (
          <div className="w-full h-full flex items-center justify-center">
            <div ref={diagramRef} className="w-full" />
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
          />
          <Button
            size="icon"
            onClick={handleGenerateDiagram}
            data-testid="button-generate-diagram"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
