import { NextResponse } from "next/server";
import { heuristicScore, type LeadSignal } from "@/lib/lead-score";

function extractOutputText(data: any): string | null {
  for (const item of data?.output ?? []) {
    for (const part of item?.content ?? []) {
      if (part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LeadSignal;
  if (!body?.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const fallback = heuristicScore(body);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ mode: "heuristic", result: fallback });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_LEAD_MODEL || "gpt-5.6-luna",
        store: false,
        input: `You classify public buyer-intent signals for local service businesses. Return JSON only with keys: industry, service, purchaseIntent (0-1), urgency (0-1), leadScore (0-100), location, mobileService, vehicle, reason, suggestedReply. Do not infer sensitive traits. Signal: ${JSON.stringify(body)}`,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = await response.json();
    const output = extractOutputText(data);
    if (!output) throw new Error("No model output");
    const parsed = JSON.parse(output.replace(/^```json\s*|\s*```$/g, ""));
    return NextResponse.json({ mode: "ai", result: parsed });
  } catch (error) {
    return NextResponse.json({ mode: "heuristic-fallback", result: fallback, warning: error instanceof Error ? error.message : "AI scoring failed" });
  }
}
