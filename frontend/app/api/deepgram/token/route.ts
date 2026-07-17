import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/token", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl: 30 }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Deepgram token error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to get Deepgram token" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ token: data.key });
  } catch (err) {
    console.error("Deepgram token request failed:", err);
    return NextResponse.json(
      { error: "Deepgram unavailable" },
      { status: 500 }
    );
  }
}
