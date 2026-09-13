import type { FixtureWithSentiment, LeagueMeta, MatchFixture } from "./types";
import { fetchOddsFixtures } from "./odds-api";
import { computeSeededSentiment } from "./sentiment";
import { buildMockFixtures } from "./mock-data";
import { LEAGUES } from "./leagues";
import { head, put } from "@vercel/blob";

const CACHE_TTL_MS = 15 * 60 * 1000;
const BLOB_PATH = "cache/fixtures.json";

export type DataSource = "odds-api" | "mock";

interface StoredPayload {
  fixtures: MatchFixture[];
  fetchedAt: number;
  source: DataSource;
}

interface CacheEntry {
  data: FixtureWithSentiment[];
  fetchedAt: number;
  source: DataSource;
}

let memory: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;
let warmStarted = false;

function canBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 0);
}

async function readBlobCache(): Promise<StoredPayload | null> {
  if (!canBlob()) return null;
  try {
    const meta = await head(BLOB_PATH);
    if (!meta?.url) return null;
    const res = await fetch(meta.url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const payload = (await res.json()) as StoredPayload;
    if (!Array.isArray(payload.fixtures)) return null;
    return payload;
  } catch (err) {
    console.error("[fixture-store] shared cache read failed:", err);
    return null;
  }
}

async function writeBlobCache(payload: StoredPayload): Promise<void> {
  if (!canBlob()) return;
  try {
    await put(BLOB_PATH, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
    console.log("[fixture-store] shared cache written to Vercel Blob");
  } catch (err) {
    console.error("[fixture-store] shared cache write failed:", err);
  }
}

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
  if (inflight) return inflight;
  if (!force && memory && Date.now() - memory.fetchedAt < CACHE_TTL_MS) {
    return memory;
  }

  inflight = (async (): Promise<CacheEntry> => {
    let payload: StoredPayload | null = null;

    // 1. Fresh shared cache (survives serverless cold starts).
    if (!force) {
      const blob = await readBlobCache();
      if (blob && Date.now() - blob.fetchedAt < CACHE_TTL_MS) payload = blob;
    }

    // 2. Refetch from the live source.
    if (!payload) {
      const { raw, source } = await loadFromLiveSources();
      if (source !== "mock" && raw.length > 0) {
        payload = { fixtures: raw, fetchedAt: Date.now(), source };
        void writeBlobCache(payload);
      } else {
        // Live source failed — fall back to the newest known data, then mock.
        const stale = await readBlobCache();
        if (stale && stale.fixtures.length > 0) {
          payload = stale;
        } else {
          payload = { fixtures: raw, fetchedAt: Date.now(), source: "mock" };
        }
      }
    }

    const entry: CacheEntry = {
      data: seedFixtures(payload.fixtures),
      fetchedAt: payload.fetchedAt,
      source: payload.source,
    };
    memory = entry;
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