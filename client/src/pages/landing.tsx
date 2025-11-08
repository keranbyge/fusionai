import { Link } from "wouter";
import { useEffect } from "react";
import { Code2, Sparkles, GraduationCap, Play, FileText, Lightbulb, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import Plasma from "@/components/Plasma";
import TrueFocus from "@/components/TrueFocus";

export default function Landing() {
  const { setTheme } = useTheme();
  
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const scrollToOverview = () => {
    document.getElementById('project-overview')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen bg-transparent dark">
      <header className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-3xl bg-black/20 border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-300" />
            <span className="text-m font-bold text-purple-300 font-sixtyfour">Fusion AI</span>
          </div>
        </div>
      </header>
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-0">
        <div className="absolute inset-0 z-0">
          <Plasma />
        </div>
        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <TrueFocus 
              sentence="Fusion AI"
              manualMode={false}
              blurAmount={5}
              borderColor="#c084fc"
              glowColor="rgba(192, 132, 252, 0.6)"
              animationDuration={1.5}
              pauseBetweenAnimations={2}
            />
            <br />
            <span className="font-nabla text-[52px]">Replit x Vibeathon</span>
            <br />
            <span className="font-nabla text-[50px]">Polaris School of Technology</span>
          </h1>
          <p className="md:text-2xl text-white/90 max-w-3xl mx-auto font-bold text-center text-[17px] mt-[20px] mb-[20px] ml-[16px] mr-[16px]">A Human + AI Co-Creation Platform where you collaborate with AI for coding, creative art, and adaptive tutoring - by TEAM AURACODE</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link href="/auth">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full backdrop-blur-md border-2 border-purple-300 hover:bg-purple-500/30 font-extrabold bg-[#fffffffc] text-[#080000] text-[15px] pl-[23px] pr-[23px] pt-[14px] pb-[14px]"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToOverview}
              className="rounded-full backdrop-blur-md border-2 border-purple-300 text-white hover:bg-purple-500/30 pl-[23px] pr-[23px] text-[15px] pt-[14px] pb-[14px] bg-[#ffffff17] font-extrabold"
              data-testid="button-project-overview"
            >
              <FileText className="h-5 w-5 mr-2" />
              Project Overview
            </Button>
          </div>
        </div>
      </section>
      <section id="project-overview" className="relative min-h-screen bg-background dark:bg-gray-950 py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Project Overview</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Fusion AI is a collaborative workspace platform that combines human creativity with AI capabilities across three specialized domains
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover-elevate">
              <CardHeader>
                <Code2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Coder Panel</CardTitle>
                <CardDescription>AI-Powered Coding Assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get intelligent code suggestions, explanations, and debugging help. The Coder panel understands your entire project context and provides relevant coding assistance.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Artist Canvas</CardTitle>
                <CardDescription>Visual Diagram Generation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transform ideas into visual diagrams using Mermaid.js. Create flowcharts, sequence diagrams, and more through natural language prompts.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Tutor Panel</CardTitle>
                <CardDescription>Adaptive Learning Assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Personalized learning support that adapts to your pace. Get context-aware explanations and educational guidance across all domains.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Key Features</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Cross-Panel Synchronization
                </h3>
                <p className="text-sm text-muted-foreground">
                  All three panels work together seamlessly. The Tutor is aware of your Coder conversations and Artist diagrams, providing truly contextual assistance.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  In-App Reminders
                </h3>
                <p className="text-sm text-muted-foreground">
                  Set reminders for important tasks and deadlines. The Tutor AI proactively alerts you about upcoming reminders during conversations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Persistent Workspaces
                </h3>
                <p className="text-sm text-muted-foreground">
                  Organize your work in dedicated workspaces. All conversations, diagrams, and context are preserved per workspace.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Secure Authentication
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your data is protected with secure user authentication and isolated workspaces. Each user has their own private environment.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mb-16 mt-20">
            <div className="text-center mb-12">
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                How Fusion AI excels in Innovation, Human-AI Interaction, and Real-World Utility
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="backdrop-blur-xl bg-purple-500/10 border-2 border-purple-300/30 rounded-lg p-6 hover-elevate" data-testid="card-innovation">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="h-10 w-10 text-purple-400" />
                  <h3 className="text-2xl font-bold text-purple-300">Innovation</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Cross-Panel AI Synchronization:</strong> Three AI agents that share context seamlessly - Tutor knows what you coded and what diagrams you created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Auto-Diagram Generation:</strong> One-click sync from Coder to Artist - AI analyzes your code conversations and generates relevant diagrams automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Proactive Reminder Integration:</strong> Tutor AI monitors your reminders and proactively alerts you during conversations - never miss a deadline</span>
                  </li>
                </ul>
              </div>

              <div className="backdrop-blur-xl bg-blue-500/10 border-2 border-blue-300/30 rounded-lg p-6 hover-elevate" data-testid="card-human-ai">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-10 w-10 text-blue-400" />
                  <h3 className="text-2xl font-bold text-blue-300">Human-AI Interaction</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Play className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Natural Conversation Flow:</strong> Chat with AI in everyday language across coding, visual design, and learning - no complex commands required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Play className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Context-Aware Responses:</strong> AI remembers your entire workspace history and provides personalized, relevant assistance based on past interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Play className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Visual Feedback:</strong> Real-time diagram rendering with Mermaid.js shows your ideas taking shape instantly as you describe them</span>
                  </li>
                </ul>
              </div>

              <div className="backdrop-blur-xl bg-green-500/10 border-2 border-green-300/30 rounded-lg p-6 hover-elevate" data-testid="card-real-world">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-10 w-10 text-green-400" />
                  <h3 className="text-2xl font-bold text-green-300">Real-World Utility</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Code2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Education & Learning:</strong> Students can code, visualize concepts, and get personalized tutoring all in one platform - perfect for self-paced learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Code2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Professional Development:</strong> Developers get coding help, auto-generate documentation diagrams, and track project deadlines with integrated reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Code2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Secure Data Management:</strong> PostgreSQL database with user authentication ensures your code, diagrams, and conversations remain private and persistent</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth">
              <Button size="lg" className="bg-[#ffffff24] text-[15px] pl-[25px] pr-[25px] pt-[10px] pb-[10px] ml-[0px] mr-[0px] mt-[0px] mb-[0px] font-extrabold" data-testid="button-start-building">Built by TEAM AURACODE</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
