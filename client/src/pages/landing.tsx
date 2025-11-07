import { Link } from "wouter";
import { Code2, Sparkles, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@assets/generated_images/AI_collaboration_hero_background_6e5d40e3.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CoCreate AI</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/90 z-10" />
          <img
            src={heroImage}
            alt="AI Collaboration"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            CoCreate AI – Build with AI,<br />not just for AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            A Human + AI Co-Creation Platform where you collaborate with AI for coding, creative art, and adaptive tutoring
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/workspace">
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-full"
                data-testid="button-get-started"
              >
                Get Started Free
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg rounded-full bg-background/20 backdrop-blur-md border-white/30 text-white hover:bg-background/30"
              data-testid="button-watch-demo"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/70">
            Join 10,000+ creators building together
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Three AI Collaborators in One Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate" data-testid="card-feature-coder">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Coder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interactive coding assistant that adapts to your style. Get real-time help, code generation, and debugging support with AI that learns from your interactions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-artist">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Artist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transform ideas into visual diagrams instantly. Create flowcharts, wireframes, and mind maps using natural language with live Mermaid.js rendering.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-tutor">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Personalized learning assistant with context awareness. Get explanations, tutorials, and guidance based on your Coder and Artist interactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="space-y-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-semibold mb-4">Workspace Dashboard</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Create unlimited workspaces, each with its own context and memory. Switch between projects seamlessly with the sidebar navigation.
                </p>
                <p className="text-lg text-muted-foreground">
                  Three resizable panels work in parallel – Coder, Artist, and Tutor – all maintaining their own conversation history and adapting to your needs.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Workspace Preview</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-card rounded-2xl p-8 border">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">AI Generation</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-semibold mb-4">AI Collaboration</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Each panel leverages powerful AI models to understand context and provide intelligent responses tailored to your workflow.
                </p>
                <p className="text-lg text-muted-foreground">
                  Your interactions are stored and analyzed to make the AI smarter over time, learning your preferences and coding style.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-semibold mb-4">Memory & Context</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Every chat, diagram, and interaction is automatically saved. Return to any workspace and pick up exactly where you left off.
                </p>
                <p className="text-lg text-muted-foreground">
                  The Tutor panel can reference your Coder conversations and Artist diagrams to provide contextual learning that's uniquely tailored to you.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Context Awareness</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-8">
            Start Building with AI Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators who are building better, faster with AI collaboration
          </p>
          <Link href="/workspace">
            <Button
              size="lg"
              className="px-8 py-6 text-lg rounded-full"
              data-testid="button-cta-bottom"
            >
              Get Started Free
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required
          </p>
        </div>
      </section>

      <footer className="py-12 px-6 border-t">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 CoCreate AI. Build with AI, not just for AI.</p>
        </div>
      </footer>
    </div>
  );
}
