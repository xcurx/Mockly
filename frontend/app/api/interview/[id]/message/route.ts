import { auth } from "@/auth";
import { sendAnswer } from "@/lib/api-client";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const { id } = await params

    const interview = await prisma.interview.findUnique({
        where: { id }
    })
    if (!interview || interview.userId !== session.user.id) {
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 }
        )
    }

    const {userAnswer, interviewState, hintsUsed = 0} = await req.json()

    try {
        const result = await sendAnswer(userAnswer, interviewState, hintsUsed)
        const exchangeCount = await prisma.interviewExchange.count({
            where: {interviewId: id}
        })

        const lastestExchange = await prisma.interviewExchange.findFirst({
            where: {interviewId: id},
            orderBy: {createdAt: "desc"}
        })
        if (lastestExchange) {
            await prisma.interviewExchange.update({
                where: {id: lastestExchange.id},
                data: {
                    userAnswer,
                    evaluation: result.evaluation || null
                }
            })
        }

        if (result.question && !result.interview_complete) {
            await prisma.interviewExchange.create({
                data: {
                    interviewId: id,
                    questionNumber: result.question_number,
                    question: result.question.question || result.question,
                    questionSource: result.question.source || "llm",
                }
            })
        }

        if (result.interview_complete && result.summary) {
            await prisma.interview.update({
                where: {id},
                data: {
                    status: "COMPLETED",
                    overallScore: result.summary.overall_score,
                    summary: result.summary
                }
            })
        }

        let questionText: string | null = null;
        if (result.question) {
            if (typeof result.question === "string") {
                try {
                    const parsed = JSON.parse(result.question);
                    questionText = parsed.question || result.question;
                } catch {
                    questionText = result.question;
                }
            } else if (typeof result.question === "object") {
                questionText = result.question.question || JSON.stringify(result.question);
            }
        }

        return NextResponse.json({
            evaluation: result.evaluation,
            question: questionText,
            questionNumber: result.question_number,
            interviewComplete: result.interview_complete,
            summary: result.summary || null,
            interviewState: result.interview_state,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}