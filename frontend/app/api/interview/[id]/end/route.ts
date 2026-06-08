import { auth } from "@/auth";
import { summarizeInterview } from "@/lib/api-client";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params } : { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            {status: 401}
        )
    }

    const { id } = await params
    
    const interview = await prisma.interview.findUnique({
        where: { id }
    })
    if (!interview || interview.userId !== session.user.id) {
        return NextResponse.json(
            { error: "Not found" },
            {status: 404}
        )
    }

    const { interviewState } = await req.json()

    try {
        const result = await summarizeInterview(interviewState)

        await prisma.interview.update({
            where: {id},
            data: {
                status: "COMPLETED",
                overallScore: result.summary?.overall_score || null,
                summary: result.summary || null,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({ summary: result.summary })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({ error: message}, { status: 500 })
    }
}