import { auth } from "@/auth";
import { startInterview } from "@/lib/api-client";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const questions = formData.getAll("questions[]") as string[];

  if (!questions || questions.length === 0) {
    return NextResponse.redirect(new URL("/dashboard/bookmarks", req.url));
  }

  const maxQuestions = questions.length;
  const topics = ["Review Session"];

  const interview = await prisma.interview.create({
    data: {
      userId: session.user.id,
      topics,
      customTopics: [],
      mode: "REVIEW",
      interactionType: "TEXT",
      maxQuestions,
    },
  });

  try {
    const result = await startInterview({
      topics,
      customTopics: [],
      mode: "REVIEW",
      interactionType: "TEXT",
      maxQuestions,
      bookmarked_questions: questions,
    });

    await prisma.interview.update({
      where: { id: interview.id },
      data: { interviewState: result.interview_state }
    });

    if (result.question) {
      await prisma.interviewExchange.create({
        data: {
          interviewId: interview.id,
          questionNumber: 1,
          question: result.question.question || result.question,
          questionSource: result.question.source || "llm",
        },
      });
    }
    
    return NextResponse.json({
        interviewId: interview.id,
        question: result.question,
        interviewState: result.interview_state
    });

  } catch (error) {
    await prisma.interview.delete({
      where: { id: interview.id },
    });
    return NextResponse.json(
      { error: "Failed to start review session" },
      { status: 500 }
    );
  }
}
