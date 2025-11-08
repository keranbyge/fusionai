import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Plasma from "@/components/Plasma";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (user.name) {
        setLocation("/workspace");
      } else {
        setLocation("/onboarding");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/signup", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/onboarding");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Username already taken" : "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username: signInUsername, password: signInPassword });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ username: signUpUsername, password: signUpPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <Plasma 
          color="#b794f6"
          speed={0.6}
          direction="forward"
          scale={1.1}
          opacity={0.8}
          mouseInteractive={true}
        />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 mr-2 text-white" />
            <span className="text-2xl font-bold font-sixtyfour text-white">Fusion.AI</span>
          </div>
          <CardTitle className="text-white">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                    required
                    autoFocus
                    data-testid="input-signin-username"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    data-testid="input-signin-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white/10 backdrop-blur-3xl border-white/20"
                  disabled={loginMutation.isPending}
                  data-testid="button-signin"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    required
                    autoFocus
                    data-testid="input-signup-username"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    data-testid="input-signup-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white/10 backdrop-blur-3xl border-white/20"
                  disabled={signupMutation.isPending}
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="text-xs text-white/60 text-center mt-4">
            Username: auracode<br />
            Password: Polaris@123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
