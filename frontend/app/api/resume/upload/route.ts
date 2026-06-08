import { auth } from "@/auth";
import { parseResume } from "@/lib/api-client";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
        return NextResponse.json(
            { error: "No file provided" }, 
            { status: 400 },
        )
    }

    try {
        const result = await parseResume(file)

        const resume = await prisma.resume.create({
            data: {
                userId: session.user.id,
                filename: file.name,
                parsedData: result.data,
            }
        })

        return NextResponse.json({
            resumeId: resume.id,
            parsedData: result.data,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}