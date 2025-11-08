import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Code2, X, Send, Mic, MicOff, BookOpen, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { voiceManager } from "@/lib/voiceManager";
import ReactMarkdown from "react-markdown";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CoderPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function CoderPanel({ workspaceId, onClose }: CoderPanelProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(voiceManager.getIsListening());
  const [quizzes, setQuizzes] = useState<Array<{ title: string; topics: string[] }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/workspaces", workspaceId, "messages", "coder"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/messages/coder`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ai/coder", { workspaceId, message });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "messages", "coder"] });
      setInput("");
    },
  });

  const syncToArtistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/sync-to-artist", { workspaceId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/diagrams`] });
      toast({
        title: "Synced to Artist Canvas",
        description: "A diagram has been generated from your latest code discussion.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message || "Could not sync to Artist Canvas. Try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const topics = messages
        .filter(m => m.role === "user")
        .map(m => m.content.toLowerCase());
      
      const recommendations = [];
      if (topics.some(t => t.includes("react") || t.includes("component") || t.includes("hook"))) {
        recommendations.push({ title: "React Fundamentals Quiz", topics: ["Components", "Hooks", "State Management"] });
      }
      if (topics.some(t => t.includes("typescript") || t.includes("type") || t.includes("interface"))) {
        recommendations.push({ title: "TypeScript Mastery Quiz", topics: ["Types", "Interfaces", "Generics"] });
      }
      if (topics.some(t => t.includes("api") || t.includes("fetch") || t.includes("async"))) {
        recommendations.push({ title: "Async JavaScript Quiz", topics: ["Promises", "Async/Await", "API Calls"] });
      }
      if (topics.some(t => t.includes("css") || t.includes("style") || t.includes("tailwind"))) {
        recommendations.push({ title: "CSS & Styling Quiz", topics: ["Flexbox", "Grid", "Responsive Design"] });
      }
      if (topics.some(t => t.includes("algorithm") || t.includes("data structure") || t.includes("complexity"))) {
        recommendations.push({ title: "Algorithms & Data Structures Quiz", topics: ["Arrays", "Trees", "Big O"] });
      }
      setQuizzes(recommendations.slice(0, 3));
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
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

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm">
      <header className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Coder</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => syncToArtistMutation.mutate()}
            disabled={syncToArtistMutation.isPending || messages.length === 0}
            data-testid="button-sync-to-artist"
          >
            <RefreshCw className={`h-3 w-3 ${syncToArtistMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="text-xs">Sync to Artist</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="button-close-coder"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a coding conversation!</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`px-4 py-3 max-w-[80%] border-white/20 ${
                  message.role === "user"
                    ? "bg-blue-500/20 backdrop-blur-md text-white border-blue-400/30"
                    : "bg-white/10 backdrop-blur-md border-white/20"
                }`}
              >
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </Card>
            </div>
          ))}
          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <Card className="px-4 py-3 bg-white/10 backdrop-blur-md border-white/20">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </Card>
            </div>
          )}
          {quizzes.length > 0 && (
            <Card className="border-purple-400/30 bg-purple-500/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Recommended Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizzes.map((quiz, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {quiz.topics.join(" • ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => {
                        const time = prompt("Set reminder (e.g., '2 hours', '1 day', 'tomorrow'):");
                        if (time) alert(`Reminder set for ${quiz.title} in ${time}`);
                      }}
                    >
                      <Bell className="h-3 w-3" />
                      Remind
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            placeholder="Ask for code help..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            data-testid="input-coder-message"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={toggleVoiceInput}
            data-testid="button-voice-coder"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            data-testid="button-send-coder"
            disabled={sendMessageMutation.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
