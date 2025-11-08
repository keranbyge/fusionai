import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X, Send, Mic, MicOff, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { voiceManager } from "@/lib/voiceManager";

interface ArtistPanelProps {
  workspaceId: string;
  onClose: () => void;
}

interface CanvasImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ArtistPanel({ workspaceId, onClose }: ArtistPanelProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      console.log("Sending image generation request:", prompt);
      const res = await apiRequest("POST", "/api/ai/generate-image", { prompt });
      const data = await res.json();
      console.log("Received image generation response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Image generation success:", data);
      if (data.imageUrl) {
        const newImage: CanvasImage = {
          id: Date.now().toString(),
          url: data.imageUrl,
          x: 100,
          y: 100,
          width: 512,
          height: 512,
        };
        console.log("Adding image to canvas:", newImage);
        setImages([...images, newImage]);
      } else {
        console.error("No imageUrl in response:", data);
        alert("Failed to generate image: " + (data.error || "Unknown error"));
      }
      setInput("");
    },
    onError: (error) => {
      console.error("Image generation error:", error);
      alert("Failed to generate image: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (!input.trim() || generateImageMutation.isPending) return;
    generateImageMutation.mutate(input);
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const deleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
    if (selectedImage === id) setSelectedImage(null);
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm">
      <header className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Artist Canvas</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-move"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 19px, hsl(var(--border)) 19px, hsl(var(--border)) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, hsl(var(--border)) 19px, hsl(var(--border)) 20px)",
          backgroundColor: "hsl(var(--muted))",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              className={`absolute cursor-pointer border-2 ${
                selectedImage === img.id ? "border-primary" : "border-transparent"
              } hover:border-primary/50`}
              style={{
                left: img.x,
                top: img.y,
                width: img.width,
                height: img.height,
              }}
              onClick={() => setSelectedImage(img.id)}
            >
              <img
                src={img.url}
                alt="Generated"
                className="w-full h-full object-cover"
                draggable={false}
              />
              {selectedImage === img.id && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(img.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {generateImageMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-lg shadow-lg">
              <p className="text-sm">Generating image...</p>
            </div>
          </div>
        )}

        {images.length === 0 && !generateImageMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center max-w-md">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Create AI Art</h3>
              <p className="text-sm text-muted-foreground">
                Describe the image you want to create and I'll generate it for you.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            placeholder="Describe the image you want to create..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={generateImageMutation.isPending}
          />
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={toggleVoiceInput}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            onClick={handleGenerate}
            disabled={generateImageMutation.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
