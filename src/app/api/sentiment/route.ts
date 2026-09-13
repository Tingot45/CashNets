import { NextResponse } from "next/server";
import type { FixtureWithSentiment, LiveAnalysisPayload, LiveAnalysisResult } from "@/lib/types";
import { computeSeededSentiment, generateGeminiAnalysis, hasGeminiKey } from "@/lib/sentiment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const cache = new Map<string, { analysis: FixtureWithSentiment["sentiment"]; at: number }>();
const CACHE_TTL_MS = 8 * 60 * 1000;

export async function POST(request: Request) {
  let payload: LiveAnalysisPayload;
  try {
    payload = (await request.json()) as LiveAnalysisPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const match = payload.match;
  if (!match?.id || !match?.homeTeam || !match?.awayTeam || typeof match.homeOdds !== "number") {
    return NextResponse.json({ error: "A valid match fixture is required" }, { status: 400 });
  }

  const cachedHit = cache.get(match.id);
  if (cachedHit && Date.now() - cachedHit.at < CACHE_TTL_MS) {
    return NextResponse.json({ analysis: cachedHit.analysis, matchId: match.id, cached: true } satisfies LiveAnalysisResult);
  }

  const liveCapable = hasGeminiKey();
  try {
    const analysis = liveCapable
      ? await generateGeminiAnalysis(match)
      : { ...computeSeededSentiment(match), source: "model-seeded" as const, fallback: true };
    cache.set(match.id, { analysis, at: Date.now() });
    return NextResponse.json({ analysis, matchId: match.id, cached: false } satisfies LiveAnalysisResult);
  } catch (err) {
    console.error("[api/sentiment] live analysis failed, falling back to seeded model:", err);
    const analysis = { ...computeSeededSentiment(match), source: "model-seeded" as const, fallback: true };
    return NextResponse.json({
      analysis,
      matchId: match.id,
      cached: false,
      degraded: true,
    });
  }
}