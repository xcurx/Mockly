"use client";

import { useEffect, useState } from "react";
import {
  ScoreTrendChart,
  TopicRadarChart,
  WeakAreasCard,
  StreakCard,
} from "./analytics-charts";
import { CircleNotch } from "@phosphor-icons/react";

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

interface AnalyticsData {
  trendData: TrendData[];
  topicData: TopicData[];
  weakAreas: TopicData[];
  streak: number;
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CircleNotch className="size-8 animate-spin mb-4 text-primary" />
        <p>Crunching your interview data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-500/10 rounded-lg">
        {error || "Failed to load analytics"}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <ScoreTrendChart data={data.trendData} />
        </div>
        <div className="col-span-1">
          <StreakCard streak={data.streak} />
          <div className="mt-6">
            <WeakAreasCard data={data.weakAreas} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicRadarChart data={data.topicData} />
        {/* future other charts */}
      </div>
    </div>
  );
}
