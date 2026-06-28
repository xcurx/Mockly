import { auth } from "@/auth";
import { requestHint } from "@/lib/api-client";
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

    const {interviewState, hintsUsed} = await req.json()

    try {
        const result = await requestHint(interviewState, hintsUsed)
        
        if (result.hint?.hint) {
            const latestExchange = await prisma.interviewExchange.findFirst({
                where: { interviewId: id },
                orderBy: { createdAt: "desc" }
            })
            
            if (latestExchange) {
                await prisma.interviewExchange.update({
                    where: { id: latestExchange.id },
                    data: {
                        hints: {
                            push: result.hint.hint
                        }
                    }
                })
            }
        }
        
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
