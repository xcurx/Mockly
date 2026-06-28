import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

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
