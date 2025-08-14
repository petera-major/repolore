import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// make sure this runs on Node, not Edge
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { rawUrl, path } = (await req.json()) as { rawUrl: string; path: string };

    const r = await fetch(rawUrl);
    if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
    const code = (await r.text()).slice(0, 6000); // keep it fast

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a senior engineer writing concise, accurate technical docs." },
        {
          role: "user",
          content:
`Summarize this file in <=120 words. Include purpose, key exports, and how it fits the app.
PATH: ${path}
CODE:
${code}`
        }
      ]
    });

    return NextResponse.json({ summary: resp.choices[0]?.message?.content ?? "" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "unknown error" }, { status: 400 });
  }
}
