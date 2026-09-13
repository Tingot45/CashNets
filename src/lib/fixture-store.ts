import type { FixtureWithSentiment, LeagueMeta, MatchFixture } from "./types";
import { fetchOddsFixtures } from "./odds-api";
import { computeSeededSentiment } from "./sentiment";
import { buildMockFixtures } from "./mock-data";
import { LEAGUES } from "./leagues";

const CACHE_TTL_MS = 15 * 60 * 1000;

export type DataSource = "odds-api" | "mock";

interface CacheEntry {
  data: FixtureWithSentiment[];
  fetchedAt: number;
  source: DataSource;
}

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;
let warmStarted = false;

function seedFixtures(raw: MatchFixture[]): FixtureWithSentiment[] {
  return raw.map((m) => ({
    ...m,
    sentiment: computeSeededSentiment(m),
  }));
}

function hasOddsApi(): boolean {
  return Boolean(process.env.ODDS_API_KEY && process.env.ODDS_API_KEY.length > 0);
}

async function loadFromLiveSources(): Promise<{ raw: MatchFixture[]; source: DataSource }> {
  if (hasOddsApi()) {
    try {
      const live = await fetchOddsFixtures(process.env.ODDS_API_KEY);
      if (live.length > 0) return { raw: live, source: "odds-api" };
      console.warn("[fixture-store] The Odds API returned no fixtures, using simulated pool");
    } catch (err) {
      console.error("[fixture-store] The Odds API failed, falling back:", err);
    }
  }

  return { raw: buildMockFixtures(Date.now()), source: "mock" };
}

export async function loadFixtures(force = false): Promise<CacheEntry> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }
  if (inflight) return inflight;

  inflight = (async (): Promise<CacheEntry> => {
    const { raw, source } = await loadFromLiveSources();
    const entry: CacheEntry = { data: seedFixtures(raw), fetchedAt: Date.now(), source };
    cache = entry;
    return entry;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function warmUp() {
  if (warmStarted) return;
  warmStarted = true;
  try {
    const entry = await loadFixtures();
    console.log(
      "[fixture-store] warm-up complete, sentiment seeded for",
      entry.data.length,
      "fixtures via",
      entry.source
    );
  } catch (err) {
    console.error("[fixture-store] warm-up failed:", err);
    warmStarted = false;
  }
}

export function getLeagues(): LeagueMeta[] {
  return LEAGUES;
}

export async function getRegions(): Promise<string[]> {
  const entry = await loadFixtures();
  return [...new Set(entry.data.map((f) => f.region))].sort();
}