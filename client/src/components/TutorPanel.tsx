import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GraduationCap, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface TutorPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function TutorPanel({ workspaceId, onClose }: TutorPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/workspaces", workspaceId, "messages", "tutor"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/messages/tutor`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ai/tutor", { workspaceId, message });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "messages", "tutor"] });
      setInput("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="h-12 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Tutor</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid="button-close-tutor"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything to start learning!</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`px-4 py-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
            </div>
          ))}
          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <Card className="px-4 py-3 bg-card">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a learning question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            data-testid="input-tutor-message"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            data-testid="button-send-tutor"
            disabled={sendMessageMutation.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
