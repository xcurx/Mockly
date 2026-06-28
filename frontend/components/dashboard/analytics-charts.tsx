"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fire, Target, WarningCircle } from "@phosphor-icons/react";

interface TrendData {
  name: string;
  date: string;
  score: number;
}

interface TopicData {
  topic: string;
  averageScore: number;
  count: number;
}

export function ScoreTrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>Your performance over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Not enough data yet. Complete more interviews!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Score Trend</CardTitle>
        <CardDescription>Your performance over time</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 10]}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
              itemStyle={{ color: "var(--primary)" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              strokeWidth={3}
              activeDot={{ r: 8, fill: "#8b5cf6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopicRadarChart({ data }: { data: TopicData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Strengths</CardTitle>
          <CardDescription>Your skills across categories</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No topic data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Strengths</CardTitle>
        <CardDescription>Your skills across categories</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#333333" />
            <PolarAngleAxis
              dataKey="topic"
              tick={{ fill: "#888888", fontSize: 12 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
            <Radar
              name="Avg Score"
              dataKey="averageScore"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "var(--primary)" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WeakAreasCard({ data }: { data: TopicData[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-amber-500" />
          <CardTitle>Areas for Improvement</CardTitle>
        </div>
        <CardDescription>Topics scoring below 7.0 on average</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Looking good! All your topics are scoring well above average.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.slice(0, 5).map((topic) => (
              <li key={topic.topic} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WarningCircle className="size-4 text-amber-500" />
                  <span className="font-medium text-sm">{topic.topic}</span>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">
                  {topic.averageScore}/10
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StreakCard({ streak }: { streak: number }) {
  const isHot = streak >= 3;

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 border-muted relative overflow-hidden">
      <div className="absolute -right-6 -top-6 opacity-[0.03] pointer-events-none">
        <Fire weight="fill" className="size-40" />
      </div>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Current Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-baseline gap-2">
        <div className="text-5xl font-bold">{streak}</div>
        <div className="text-sm text-muted-foreground font-medium">days</div>
      </CardContent>
      {isHot && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">
          <Fire weight="fill" /> You're on fire!
        </div>
      )}
    </Card>
  );
}
