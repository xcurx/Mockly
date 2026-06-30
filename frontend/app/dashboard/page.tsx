import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsBar, InterviewCard } from "@/components/dashboard/stats-and-cards";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { Rocket, ChartLineUp } from "@phosphor-icons/react/dist/ssr";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [totalInterviews, recentInterviews, completedWithScores] =
    await Promise.all([
      prisma.interview.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.interview.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { exchanges: { select: { id: true } } },
      }),
      prisma.interview.findMany({
        where: { userId, status: "COMPLETED", overallScore: { not: null } },
        select: { overallScore: true },
      }),
    ]);

  const avgScore =
    completedWithScores.length > 0
      ? Math.round(
          completedWithScores.reduce(
            (sum, i) => sum + (i.overallScore || 0),
            0
          ) / completedWithScores.length
        )
      : null;

  const lastTopic =
    recentInterviews.length > 0
      ? recentInterviews[0].topics[0] || recentInterviews[0].customTopics?.[0] || null
      : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ready to sharpen your interview skills?
        </p>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <Rocket weight="duotone" className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <ChartLineUp weight="duotone" className="size-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500 outline-none">
          {/* Stats */}
          <StatsBar
            totalInterviews={totalInterviews}
            avgScore={avgScore}
            lastTopic={lastTopic}
          />

          {/* CTA */}
          <Link href="/dashboard/setup">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 hover:opacity-90 text-sm h-11"
            >
              <Rocket weight="fill" className="size-4" />
              Start New Interview
            </Button>
          </Link>

          {/* Recent Interviews */}
          {recentInterviews.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Recent Interviews
                </h2>
                <Link
                  href="/dashboard/history"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {recentInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {recentInterviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Rocket weight="duotone" className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium">No interviews yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Start your first mock interview and get AI-powered feedback
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="outline-none">
          <AnalyticsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
