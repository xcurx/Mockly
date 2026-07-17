import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram not configured" },
      { status: 500 }
    );
  }

  try {
    const { text, model } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    const voice = model || "aura-asteria-en";

    const dgRes = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!dgRes.ok) {
      const errText = await dgRes.text();
      console.error("Deepgram TTS error:", dgRes.status, errText);
      return NextResponse.json(
        { error: "TTS failed", details: errText },
        { status: dgRes.status }
      );
    }

    const audioBuffer = await dgRes.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Deepgram TTS request failed:", err);
    return NextResponse.json(
      { error: "TTS unavailable" },
      { status: 500 }
    );
  }
}
