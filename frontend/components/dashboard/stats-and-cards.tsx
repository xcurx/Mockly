import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartBar,
  Trophy,
  Target,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

interface StatsBarProps {
  totalInterviews: number;
  avgScore: number | null;
  lastTopic: string | null;
}

export function StatsBar({ totalInterviews, avgScore, lastTopic }: StatsBarProps) {
  const stats = [
    {
      label: "Interviews",
      value: totalInterviews.toString(),
      icon: ChartBar,
      gradient: "from-purple-500/20 to-purple-500/5",
    },
    {
      label: "Avg Score",
      value: avgScore !== null ? `${avgScore}%` : "—",
      icon: Trophy,
      gradient: "from-amber-500/20 to-amber-500/5",
    },
    {
      label: "Last Topic",
      value: lastTopic || "—",
      icon: Target,
      gradient: "from-cyan-500/20 to-cyan-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-border/50 bg-gradient-to-br ${stat.gradient}">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon weight="duotone" className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface InterviewCardProps {
  interview: {
    id: string;
    topics: string[];
    customTopics?: string[];
    mode: string;
    status: string;
    overallScore: number | null;
    createdAt: Date;
    exchanges: { id: string }[];
  };
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const href =
    interview.status === "COMPLETED"
      ? `/dashboard/results/${interview.id}`
      : `/dashboard/interview/${interview.id}`;

  const allTopics = [...(interview.topics || []), ...(interview.customTopics || [])];

  return (
    <Link href={href}>
      <Card className="group border-border/50 transition-all hover:border-border hover:shadow-md hover:shadow-purple-500/5 cursor-pointer">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {allTopics.slice(0, 3).map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {topic}
                </Badge>
              ))}
              {allTopics.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{allTopics.length - 3}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge
              variant={
                interview.status === "COMPLETED"
                  ? "default"
                  : interview.status === "IN_PROGRESS"
                    ? "secondary"
                    : "destructive"
              }
              className="text-[10px]"
            >
              {interview.status.replace("_", " ")}
            </Badge>

            {interview.overallScore !== null && (
              <span className="text-sm font-semibold text-cyan-400">
                {interview.overallScore}%
              </span>
            )}

            <span className="text-xs text-muted-foreground">
              {new Date(interview.createdAt).toLocaleDateString()}
            </span>

            <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
