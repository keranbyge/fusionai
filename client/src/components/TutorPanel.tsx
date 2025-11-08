import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GraduationCap, X, Send, Mic, MicOff, Volume2, VolumeX, Square, BookOpen, Bell, Clock, Calendar, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { voiceManager } from "@/lib/voiceManager";
import ReactMarkdown from "react-markdown";
import type { Message, Diagram } from "@shared/schema";

interface TutorPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function TutorPanel({ workspaceId, onClose }: TutorPanelProps) {
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(voiceManager.getIsListening());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [quizzes, setQuizzes] = useState<Array<{ title: string; topics: string[] }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/workspaces", workspaceId, "messages", "tutor"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/messages/tutor`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  // Fetch coder messages to show context awareness
  const { data: coderMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/workspaces", workspaceId, "messages", "coder"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/messages/coder`);
      if (!res.ok) throw new Error("Failed to fetch coder messages");
      return res.json();
    },
  });

  // Fetch diagrams to show context awareness
  const { data: diagrams = [] } = useQuery<Diagram[]>({
    queryKey: [`/api/workspaces/${workspaceId}/diagrams`],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/diagrams`);
      if (!res.ok) throw new Error("Failed to fetch diagrams");
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ai/tutor", { workspaceId, message });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "messages", "tutor"] });
      setInput("");
      
      if (data.assistantMessage?.content) {
        speakText(data.assistantMessage.content);
      }
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const generateRecommendations = () => {
      if (messages.length === 0) {
        setRecommendations([
          "💡 Start by asking about any topic you want to learn",
          "📚 I can explain concepts, provide tutorials, or answer questions",
          "🎯 Try asking: 'Explain how async/await works in JavaScript'"
        ]);
        return;
      }

      const topics = messages
        .filter(m => m.role === "user")
        .map(m => m.content.toLowerCase());

      const suggestions: string[] = [];
      const quizRecommendations = [];

      if (topics.some(t => t.includes("javascript") || t.includes("js"))) {
        suggestions.push("📖 Next: Learn about JavaScript Promises and Error Handling");
        suggestions.push("🔍 Deep dive: ES6+ features and modern JavaScript");
        quizRecommendations.push({ title: "JavaScript Fundamentals Quiz", topics: ["Variables", "Functions", "Async/Await"] });
      }
      if (topics.some(t => t.includes("python"))) {
        suggestions.push("📖 Next: Explore Python decorators and generators");
        suggestions.push("🔍 Deep dive: Python data structures and algorithms");
        quizRecommendations.push({ title: "Python Mastery Quiz", topics: ["Data Types", "OOP", "Decorators"] });
      }
      if (topics.some(t => t.includes("react") || t.includes("component"))) {
        suggestions.push("📖 Next: Learn React Hooks and State Management");
        suggestions.push("🔍 Deep dive: React performance optimization");
        quizRecommendations.push({ title: "React Fundamentals Quiz", topics: ["Components", "Hooks", "State"] });
      }
      if (topics.some(t => t.includes("api") || t.includes("backend"))) {
        suggestions.push("📖 Next: RESTful API design best practices");
        suggestions.push("🔍 Deep dive: Authentication and security patterns");
        quizRecommendations.push({ title: "API Design Quiz", topics: ["REST", "Authentication", "Security"] });
      }
      if (topics.some(t => t.includes("algorithm") || t.includes("data structure"))) {
        quizRecommendations.push({ title: "Algorithms & Data Structures Quiz", topics: ["Arrays", "Trees", "Sorting"] });
      }
      if (topics.some(t => t.includes("database") || t.includes("sql"))) {
        quizRecommendations.push({ title: "Database Fundamentals Quiz", topics: ["SQL", "Normalization", "Indexing"] });
      }

      if (suggestions.length === 0) {
        suggestions.push(
          "💡 Based on your questions, consider exploring related advanced topics",
          "📚 Review the concepts we discussed to reinforce your learning",
          "🎯 Practice by building a small project using what you learned"
        );
      }

      setRecommendations(suggestions.slice(0, 3));
      setQuizzes(quizRecommendations.slice(0, 3));
    };

    generateRecommendations();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      startListening();
    };
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    startListening();
  };

  const startListening = () => {
    const started = voiceManager.start((text) => {
      setInput(text);
    });
    setIsListening(started);
  };

  const toggleVoiceMode = () => {
    const newVoiceMode = !voiceMode;
    setVoiceMode(newVoiceMode);
    
    if (newVoiceMode) {
      startListening();
    } else {
      voiceManager.stop();
      synthRef.current?.cancel();
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  const toggleManualListening = () => {
    if (isListening) {
      voiceManager.stop();
      setIsListening(false);
      if (input.trim() && !sendMessageMutation.isPending) {
        sendMessageMutation.mutate(input);
      }
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (!isListening && input.trim() && !sendMessageMutation.isPending && !isSpeaking) {
      const timer = setTimeout(() => {
        if (input.trim()) {
          sendMessageMutation.mutate(input);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isListening, input]);

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
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Tutor</span>
          {coderMessages.length > 0 && (
            <Badge variant="secondary" className="h-5 gap-1 text-xs">
              <Code2 className="h-2.5 w-2.5" />
              {coderMessages.slice(-5).length}
            </Badge>
          )}
          {diagrams.length > 0 && (
            <Badge variant="secondary" className="h-5 gap-1 text-xs">
              <Sparkles className="h-2.5 w-2.5" />
              {diagrams.slice(-3).length}
            </Badge>
          )}
          {voiceMode && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Voice Mode</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={voiceMode ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={toggleVoiceMode}
            data-testid="button-toggle-voice-mode"
          >
            {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
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

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="border-amber-400/30 bg-amber-500/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-background/50 border border-amber-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Python Tutorial - Advanced Concepts</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    View
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-amber-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Python Mastery Quiz</p>
                    <p className="text-xs text-muted-foreground mt-1">Data Types • OOP • Decorators</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    Start
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {recommendations.length > 0 && (
            <Card className="bg-purple-500/10 border-purple-400/30 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Learning Recommendations</span>
                </div>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything to start learning!</p>
            </div>
          )}
          {messages.length > 0 && messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`px-4 py-3 max-w-[80%] border-white/20 ${
                  message.role === "user"
                    ? "bg-green-500/20 backdrop-blur-md text-white border-green-400/30"
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
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
        {voiceMode ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={toggleManualListening}
                disabled={sendMessageMutation.isPending || isSpeaking}
                className="flex-1"
              >
                {isListening ? (
                  <><MicOff className="h-5 w-5 mr-2" /> Stop Listening</>
                ) : (
                  <><Mic className="h-5 w-5 mr-2" /> Start Speaking</>
                )}
              </Button>
              {isSpeaking && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopSpeaking}
                  className="flex-1"
                >
                  <Square className="h-5 w-5 mr-2" /> Stop Reading
                </Button>
              )}
            </div>
            {input && (
              <div className="text-sm text-muted-foreground text-center">
                Recognized: {input}
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
