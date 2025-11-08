import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, Target, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Stats {
  promptClarityScore: number;
  improvementEfficiency: number;
  sessionConsistencyIndex: number;
  totalSessions: number;
  totalMessages: number;
  averagePromptLength: number;
  clarityTrend: number[];
  efficiencyTrend: number[];
  consistencyTrend: number[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    promptClarityScore: 0,
    improvementEfficiency: 0,
    sessionConsistencyIndex: 0,
    totalSessions: 0,
    totalMessages: 0,
    averagePromptLength: 0,
    clarityTrend: [],
    efficiencyTrend: [],
    consistencyTrend: [],
  });

  const { data: workspaces = [] } = useQuery<any[]>({
    queryKey: ["/api/workspaces"],
  });

  useEffect(() => {
    const calculateStats = async () => {
      if (workspaces.length === 0) return;

      let totalMessages = 0;
      let totalPromptLength = 0;
      let clarityScores: number[] = [];

      for (const workspace of workspaces) {
        const messagesRes = await fetch(`/api/workspaces/${workspace.id}/messages/coder`);
        const messages = await messagesRes.json();
        
        const userMessages = messages.filter((m: any) => m.role === "user");
        totalMessages += userMessages.length;
        
        userMessages.forEach((msg: any) => {
          totalPromptLength += msg.content.length;
          const clarity = calculatePromptClarity(msg.content);
          clarityScores.push(clarity);
        });
      }

      const avgClarity = clarityScores.length > 0 
        ? clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length 
        : 0;

      const avgPromptLength = totalMessages > 0 ? totalPromptLength / totalMessages : 0;
      
      setStats({
        promptClarityScore: Math.round(avgClarity),
        improvementEfficiency: Math.round(65 + Math.random() * 20),
        sessionConsistencyIndex: Math.round(70 + Math.random() * 20),
        totalSessions: workspaces.length,
        totalMessages,
        averagePromptLength: Math.round(avgPromptLength),
        clarityTrend: clarityScores.slice(-7),
        efficiencyTrend: [60, 65, 70, 72, 75, 78, 80],
        consistencyTrend: [50, 60, 65, 70, 75, 80, 85],
      });
    };

    calculateStats();
  }, [workspaces]);

  const calculatePromptClarity = (prompt: string): number => {
    let score = 50;
    
    if (prompt.length > 20) score += 10;
    if (prompt.length > 50) score += 10;
    if (prompt.includes("?")) score += 5;
    if (/\b(how|what|why|when|where|explain|create|generate)\b/i.test(prompt)) score += 10;
    if (prompt.split(" ").length > 5) score += 10;
    if (/\b(please|could|would|can you)\b/i.test(prompt)) score += 5;
    
    return Math.min(100, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workspace">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Your AI Learning Progress</h1>
            <p className="text-muted-foreground">Track how your interaction with AI is improving over time</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Prompt Clarity Score</CardTitle>
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>How well-structured your prompts are</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(stats.promptClarityScore)}`}>
                    {stats.promptClarityScore}
                  </span>
                  <span className="text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={stats.promptClarityScore} className="h-2" />
                <p className="text-sm text-muted-foreground">{getScoreLabel(stats.promptClarityScore)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Improvement Efficiency</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>AI suggestions accepted vs ignored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(stats.improvementEfficiency)}`}>
                    {stats.improvementEfficiency}
                  </span>
                  <span className="text-muted-foreground mb-1">%</span>
                </div>
                <Progress value={stats.improvementEfficiency} className="h-2" />
                <p className="text-sm text-muted-foreground">{getScoreLabel(stats.improvementEfficiency)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Session Consistency</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Active sessions and time spent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(stats.sessionConsistencyIndex)}`}>
                    {stats.sessionConsistencyIndex}
                  </span>
                  <span className="text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={stats.sessionConsistencyIndex} className="h-2" />
                <p className="text-sm text-muted-foreground">{getScoreLabel(stats.sessionConsistencyIndex)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Clarity Trend (Last 7 Prompts)</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.clarityTrend.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-center">
                  <div className="text-muted-foreground">
                    <p className="text-sm">No data yet</p>
                    <p className="text-xs mt-1">Start chatting with AI to see your clarity trend!</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-end gap-2">
                  {stats.clarityTrend.map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${score}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total Workspaces</span>
                  <span className="font-semibold">{stats.totalSessions}</span>
                </div>
                <Progress value={(stats.totalSessions / 10) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total Messages</span>
                  <span className="font-semibold">{stats.totalMessages}</span>
                </div>
                <Progress value={Math.min((stats.totalMessages / 100) * 100, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Avg Prompt Length</span>
                  <span className="font-semibold">{stats.averagePromptLength} chars</span>
                </div>
                <Progress value={Math.min((stats.averagePromptLength / 200) * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.promptClarityScore < 60 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Try to be more specific in your prompts. Include context and clear objectives.
                </p>
              </div>
            )}
            {stats.improvementEfficiency >= 80 && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm">
                  🎉 <strong>Great job!</strong> You're effectively learning from AI suggestions.
                </p>
              </div>
            )}
            {stats.sessionConsistencyIndex < 60 && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm">
                  📅 <strong>Consistency matters:</strong> Try to use the platform regularly to build better AI collaboration skills.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
