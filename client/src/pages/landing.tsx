import { Link } from "wouter";
import { Code2, Sparkles, GraduationCap, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import DarkVeil from "@/components/DarkVeil";

export default function Landing() {
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
            <span className="text-m font-bold text-purple-300 font-sixtyfour">Fusion.AI</span>
          </div>
        </div>
      </header>

      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-0">
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0.02}
            scanlineIntensity={0.1}
            speed={0.5}
            scanlineFrequency={0.5}
            warpAmount={0.3}
            resolutionScale={1}
          />
        </div>
        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)' }}>
            <span className="font-sixtyfour text-5xl">Fusion.AI</span><br/>
            <br />
            <span className="font-nabla">Replit x Vibeathon</span>
            <br />
            <span className="font-nabla">Polaris School of Technology</span>
          </h1>
          <p className="text-xl md:text-2xl mt-8 text-white/90 max-w-3xl mx-auto" style={{ textShadow: '0 3px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)' }}>
            A Human + AI Co-Creation Platform where you collaborate with AI for
            coding, creative art, and adaptive tutoring
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link href="/auth">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg rounded-full bg-purple-500/20 backdrop-blur-md border-2 border-purple-300 text-white hover:bg-purple-500/30"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToOverview}
              className="px-8 py-6 text-lg rounded-full bg-purple-500/20 backdrop-blur-md border-2 border-purple-300 text-white hover:bg-purple-500/30"
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
              Fusion.AI is a collaborative workspace platform that combines human creativity with AI capabilities across three specialized domains
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

          <div className="text-center">
            <Link href="/auth">
              <Button size="lg" className="px-8 py-6 text-lg" data-testid="button-start-building">
                Start Building with AI
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
