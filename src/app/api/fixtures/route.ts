import { NextResponse } from "next/server";
import type { FixturesResponse } from "@/lib/types";
import { loadFixtures, warmUp, getLeagues } from "@/lib/fixture-store";
import { hasGeminiKey } from "@/lib/sentiment";

export const dynamic = "force-dynamic";

void warmUp();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  const entry = await loadFixtures(force);
  const regions = [...new Set(entry.data.map((f) => f.region))].sort();

  const body: FixturesResponse = {
    fixtures: entry.data,
    leagues: getLeagues(),
    regions,
    fetchedAt: new Date(entry.fetchedAt).toISOString(),
    dataSource: entry.source,
    oddsConfigured: entry.source !== "mock",
    geminiConfigured: hasGeminiKey(),
    now: Date.now(),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}