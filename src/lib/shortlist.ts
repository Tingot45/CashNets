import type { FixtureWithSentiment } from "./types";

export function buildShortlist(
  candidates: FixtureWithSentiment[],
  limit = 10,
  maxPerLeague = 2
): FixtureWithSentiment[] {
  const sorted = [...candidates].sort(
    (a, b) => b.sentiment.score - a.sentiment.score || b.sentiment.confidence - a.sentiment.confidence || a.homeOdds - b.homeOdds
  );

  const leagueCount = new Map<string, number>();
  const chosen = new Set<string>();
  const result: FixtureWithSentiment[] = [];

  // Pass 1 — diversity sweep: greedily pick best scorers, at most maxPerLeague per league.
  for (const m of sorted) {
    if (result.length >= limit) break;
    const used = leagueCount.get(m.sportKey) ?? 0;
    if (used >= maxPerLeague) continue;
    result.push(m);
    chosen.add(m.id);
    leagueCount.set(m.sportKey, used + 1);
  }

  // Pass 2 — fill remaining slots with next best scorers regardless of league overlap.
  if (result.length < limit) {
    for (const m of sorted) {
      if (result.length >= limit) break;
      if (chosen.has(m.id)) continue;
      result.push(m);
      chosen.add(m.id);
    }
  }

  return result;
}