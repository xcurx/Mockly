import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { format, subDays, isSameDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const interviews = await prisma.interview.findMany({
      where: { userId, status: "COMPLETED", overallScore: { not: null } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
        topics: true,
      },
    });

    if (interviews.length === 0) {
      return NextResponse.json({
        trendData: [],
        topicData: [],
        weakAreas: [],
        streak: 0,
      });
    }

    // scores over time
    const trendData = interviews.map((i, index) => ({
      name: `Int #${index + 1}`,
      date: format(new Date(i.createdAt), "MMM d"),
      score: i.overallScore,
    }));

    // topic Data
    const topicMap: Record<string, { totalScore: number; count: number }> = {};
    for (const interview of interviews) {
      if (interview.overallScore !== null) {
        for (const topic of interview.topics) {
          if (!topicMap[topic]) {
            topicMap[topic] = { totalScore: 0, count: 0 };
          }
          topicMap[topic].totalScore += interview.overallScore;
          topicMap[topic].count += 1;
        }
      }
    }

    const topicData = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      averageScore: Number((data.totalScore / data.count).toFixed(1)),
      count: data.count,
    }));

    // weak areas
    const weakAreas = topicData
      .filter((t) => t.averageScore < 7)
      .sort((a, b) => a.averageScore - b.averageScore);

    // streak calculation
    let streak = 0;
    if (interviews.length > 0) {
      const daysWithInterviews = new Set(
        interviews.map((i) => format(new Date(i.createdAt), "yyyy-MM-dd"))
      );

      const today = new Date();
      let currentDate = today;

      if (!daysWithInterviews.has(format(today, "yyyy-MM-dd"))) {
        currentDate = subDays(today, 1);
        if (!daysWithInterviews.has(format(currentDate, "yyyy-MM-dd"))) {
          streak = 0;
        }
      }

      if (streak !== 0 || daysWithInterviews.has(format(currentDate, "yyyy-MM-dd"))) {
        while (daysWithInterviews.has(format(currentDate, "yyyy-MM-dd"))) {
          streak += 1;
          currentDate = subDays(currentDate, 1);
        }
      }
    }

    return NextResponse.json({
      trendData,
      topicData,
      weakAreas,
      streak,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
