import { Link } from "wouter";
import { Code2, Sparkles, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import Plasma from "@/components/Plasma";

export default function Landing() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-transparent backdrop-blur-2xl border border-white/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-300" />
            <span className="text-m font-bold text-purple-300 font-sixtyfour">Fusion.AI</span>
          </div>
        </div>
      </header>

      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-0">
        <div className="absolute inset-0 z-0">
          <Plasma 
            color="#b794f6"
            speed={0.8}
            direction="forward"
            scale={1.4}
            opacity={1.2}
            mouseInteractive={true}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background/70 z-10" />
        </div>
        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            <span className="font-sixtyfour text-5xl">Fusion.AI</span><br/>
            <br />
            <span className="font-nabla">Replit x Vibeathon</span>
            <br />
            <span className="font-nabla">Polaris School of Technology</span>
          </h1>
          <p className="text-xl md:text-2xl mt-8 text-white/50 max-w-3xl mx-auto">
            A Human + AI Co-Creation Platform where you collaborate with AI for
            coding, creative art, and adaptive tutoring
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="px-8 py-5 mt-5 text-lg rounded-full bg-transparent backdrop-blur-3xl border border-purple-300 hover:white/100 text-purple-300"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
