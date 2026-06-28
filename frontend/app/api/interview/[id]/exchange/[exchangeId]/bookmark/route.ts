import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exchangeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, exchangeId } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
  });

  if (!interview || interview.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const exchange = await prisma.interviewExchange.findUnique({
    where: { id: exchangeId },
  });

  if (!exchange || exchange.interviewId !== id) {
    return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  }

  const body = await req.json();
  const bookmarked = Boolean(body.bookmarked);

  try {
    const updated = await prisma.interviewExchange.update({
      where: { id: exchangeId },
      data: { bookmarked },
    });
    return NextResponse.json({ bookmarked: updated.bookmarked });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
