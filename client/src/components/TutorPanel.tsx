import { useState } from "react";
import { GraduationCap, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface TutorPanelProps {
  onClose: () => void;
}

export function TutorPanel({ onClose }: TutorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your personalized learning assistant. I can help explain concepts, provide tutorials, and answer questions based on what you're working on. What would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Great question! In the full version, I'll provide detailed explanations and can reference your Coder and Artist interactions to give you contextual learning tailored to your current work.",
    };

    setMessages([...messages, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="h-12 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Tutor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="button-close-tutor"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
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
          />
          <Button
            size="icon"
            onClick={handleSend}
            data-testid="button-send-tutor"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
