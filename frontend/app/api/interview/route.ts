import { auth } from "@/auth";
import { startInterview } from "@/lib/api-client";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            {status: 401}
        )
    }

    const { topics, customTopics, mode, interactionType, maxQuestions , resumeId} = await req.json()
    let resumeData: Record<string, unknown> | null = null;
    if (resumeId) {
        const resume = await prisma.resume.findUnique({
            where: {
                id: resumeId,
            }
        })
        if (resume && resume.parsedData && typeof resume.parsedData === "object" && !Array.isArray(resume.parsedData)) {
            resumeData = resume.parsedData as Record<string, unknown>;
        }
    }

    const interview = await prisma.interview.create({
        data: {
            userId: session.user.id,
            topics,
            customTopics: customTopics || [],
            mode,
            interactionType,
            maxQuestions: maxQuestions || 10,
            resumeId: resumeId || null
        }
    })

    try {
        const result = await startInterview({
            topics,
            customTopics: customTopics || [],
            mode: mode.toLowerCase(),
            interactionType,
            maxQuestions: maxQuestions || 10,
            resumeData,
        })

        if (result.question) {
            await prisma.interviewExchange.create({
                data: {
                    interviewId: interview.id,
                    questionNumber: 1,
                    question: result.question.question || result.question,
                    questionSource: result.question.source || "llm",
                }
            })
        }

        return NextResponse.json({
            interviewId: interview.id,
            question: result.question,
            interviewState: result.interview_state
        })
    } catch(error) {
        await prisma.interview.update({
            where: { id: interview.id },
            data: { status: "ABANDONED" }
        });
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            {status: 401}
        )
    }

    const { id } = await params

    const interview = await prisma.interview.findUnique({
        where: { id },
        include: {
            exchanges: {
                orderBy: {
                    questionNumber: "asc"
                }
            },
            resume: true
        }
    })

    if (!interview || interview.userId !== session.user.id) {
        return NextResponse.json(
            { error: "Not found" },
            {status: 404}
        )
    }

    return NextResponse.json({ interview });
}