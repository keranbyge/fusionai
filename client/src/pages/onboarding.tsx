import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const userKey = (localStorage.getItem("userEmail") || "demo").toLowerCase().trim();
      localStorage.setItem("userName", name);
      localStorage.setItem(`userName_${userKey}`, name);
      console.log(`Saved userName_${userKey}:`, name);
      setStep(2);
    }
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      const userKey = (localStorage.getItem("userEmail") || "demo").toLowerCase().trim();
      localStorage.setItem("firstWorkspace", workspaceName);
      localStorage.setItem(`firstWorkspace_${userKey}`, workspaceName);
      console.log(`Saved firstWorkspace_${userKey}:`, workspaceName);
      setLocation("/workspace");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Fusion.AI</span>
          </div>
          <CardTitle>
            {step === 1 ? "What's your name?" : "Create your first workspace"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Let's personalize your experience" 
              : "Give your workspace a name to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="e.g., My First Project"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" className="w-full">
                Create Workspace
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
