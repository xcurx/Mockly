import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Target, 
  Lightbulb, 
  WarningCircle, 
  ArrowLeft,
  ChartLineUp
} from "@phosphor-icons/react/dist/ssr";
import { BookmarkButton } from "@/components/dashboard/bookmark-button";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      exchanges: {
        orderBy: { questionNumber: "asc" }
      }
    }
  });

  if (!interview || interview.userId !== session.user.id) {
    notFound();
  }

  if (interview.status !== "COMPLETED") {
    redirect(`/dashboard/interview/${id}`);
  }

  const summary = interview.summary as Record<string, any> | null;
  const overallScore = interview.overallScore || summary?.overall_score || 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full size-10 bg-muted/50">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interview Results</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {new Date(interview.createdAt).toLocaleDateString()}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <div className="flex gap-1.5">
              {interview.topics.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] py-0">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <Card className="md:col-span-1 border-border/50 flex flex-col justify-center text-center p-6 bg-gradient-to-br from-card to-muted/20">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Overall Score</h3>
          <div className="flex justify-center mb-4">
            <div className="relative size-32 flex items-center justify-center">
              <svg className="absolute inset-0 size-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-muted fill-none stroke-[8]" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="56" 
                  className={`fill-none stroke-[8] ${getScoreColor(overallScore).replace("text-", "stroke-")} transition-all duration-1000 ease-out`}
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
            </div>
          </div>
          {summary?.grade && (
            <Badge variant="outline" className="mx-auto w-fit text-xs px-3 bg-background">
              Grade: {summary.grade}
            </Badge>
          )}
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border/50 border-t-4 border-t-green-500/50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="size-4 text-green-400" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {summary?.strengths?.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                )) || <li>No specific strengths recorded.</li>}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 border-t-4 border-t-amber-500/50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <WarningCircle className="size-4 text-amber-400" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {summary?.weaknesses?.map((w: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                )) || <li>No specific weaknesses recorded.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      {summary?.recommendations && summary.recommendations.length > 0 && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-300">
              <Lightbulb weight="fill" className="size-4" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {summary.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="bg-purple-500/20 text-purple-400 size-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Question Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ChartLineUp className="size-5 text-cyan-400" />
          Question Breakdown
        </h2>
        
        <div className="space-y-4">
          {interview.exchanges.map((exchange) => {
            const evalData = exchange.evaluation as Record<string, any> | null;
            const score = evalData?.score || 0;
            const maxScore = 10;
            const scorePercent = (score / maxScore) * 100;

            return (
              <Card key={exchange.id} className="border-border/50 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Question Side */}
                  <div className="md:w-1/2 p-5 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">Q{exchange.questionNumber}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Source: {exchange.questionSource === "web" ? "Web Research" : "AI Gen"}
                        </span>
                      </div>
                      <BookmarkButton 
                        interviewId={exchange.interviewId} 
                        exchangeId={exchange.id} 
                        initialBookmarked={exchange.bookmarked} 
                      />
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-4">
                      {exchange.question}
                    </p>
                    
                    <div className="bg-background rounded-md p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Your Answer:</p>
                      <p className="text-sm text-foreground/90 italic">
                        "{exchange.userAnswer || "No answer provided."}"
                      </p>
                    </div>
                  </div>

                  {/* Feedback Side */}
                  <div className="md:w-1/2 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">AI Feedback</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getScoreColor(score * 10)}`}>
                            {score}/{maxScore}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getScoreBg(score * 10)}`} 
                          style={{ width: `${scorePercent}%` }} 
                        />
                      </div>

                      <div className="text-sm text-muted-foreground space-y-3">
                        {evalData?.feedback ? (
                          <p>{evalData.feedback}</p>
                        ) : evalData?.response ? (
                          <p>{evalData.response}</p>
                        ) : (
                          <p>No detailed feedback available.</p>
                        )}
                        
                        {evalData?.ideal_answer && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-xs font-semibold text-green-400 mb-1">Ideal Answer Highlights:</p>
                            <p className="text-xs text-green-300/80">{evalData.ideal_answer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
