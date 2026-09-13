"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FixturesResponse, FixtureWithSentiment, FiltersState } from "@/lib/types";
import { DEFAULT_FILTERS } from "@/lib/types";
import { buildDayOptions, isSameEatDay } from "@/lib/eat";
import { isSweetSpot } from "@/lib/sentiment";
import { buildShortlist } from "@/lib/shortlist";
import Header from "./Header";
import StatsBar from "./StatsBar";
import FilterSidebar from "./FilterSidebar";
import SweetSpotShortlist from "./SweetSpotShortlist";
import FixturesTable from "./FixturesTable";
import type { QueryAiState } from "./QueryAIButton";
import { IconBolt } from "./icons";

const emptyResponse: FixturesResponse = {
  fixtures: [],
  leagues: [],
  regions: [],
  fetchedAt: "",
  dataSource: "mock",
  oddsConfigured: false,
  geminiConfigured: false,
  now: Date.now(),
};

export default function Dashboard() {
  const [data, setData] = useState<FixturesResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [now, setNow] = useState(() => Date.now());
  const [aiStates, setAiStates] = useState<Record<string, QueryAiState>>({});
  const liveTodo = useRef<Record<string, FixtureWithSentiment>>({});

  const fetchFixtures = useCallback(async (force: boolean) => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/fixtures${force ? "?force=1" : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as FixturesResponse;
      setData(body);
      setNow(Date.now());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load fixtures");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/fixtures", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as FixturesResponse;
        if (!cancelled) {
          setData(body);
          setNow(Date.now());
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load fixtures");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFixtures(true);
    setRefreshing(false);
  }, [fetchFixtures]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const eligible = useMemo(
    () => data.fixtures.filter((f) => f.homeOdds < 1.8 && f.commenceTimeEpoch > now - 60_000),
    [data.fixtures, now]
  );

  const setFilter = useCallback((patch: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const horizonSlice = useMemo(
    () =>
      eligible.filter((f) => f.commenceTimeEpoch <= now + filters.horizonHours * 3_600_000 + 60_000),
    [eligible, filters.horizonHours, now]
  );

  const basePool = useMemo(
    () =>
      horizonSlice.filter((f) => {
        if (filters.region !== "all" && f.region !== filters.region) return false;
        if (!isSameEatDay(f.commenceTimeEpoch, filters.date, now)) return false;
        if (filters.search) {
          const q = filters.search.trim().toLowerCase();
          if (
            !f.homeTeam.toLowerCase().includes(q) &&
            !f.awayTeam.toLowerCase().includes(q) &&
            !f.league.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      }),
    [horizonSlice, filters.region, filters.date, filters.search, now]
  );

  const stats = useMemo(() => {
    const total = basePool.length;
    const sweet = basePool.filter((f) => isSweetSpot(f, filters.sweetSpotMin, filters.sweetSpotMax)).length;
    const high = basePool.filter((f) => f.sentiment.score >= filters.minSentiment).length;
    const avg = basePool.length ? basePool.reduce((a, f) => a + f.homeOdds, 0) / basePool.length : null;
    return { total, sweet, high, avg };
  }, [basePool, filters.sweetSpotMin, filters.sweetSpotMax, filters.minSentiment]);

  const tableMatches = useMemo(
    () => basePool.filter((f) => f.sentiment.score >= filters.minSentiment),
    [basePool, filters.minSentiment]
  );

  const shortlist = useMemo(() => {
    const candidates = horizonSlice.filter(
      (f) => isSweetSpot(f, filters.sweetSpotMin, filters.sweetSpotMax) && f.sentiment.score >= filters.minSentiment
    );
    return buildShortlist(candidates, 10, 2);
  }, [horizonSlice, filters.sweetSpotMin, filters.sweetSpotMax, filters.minSentiment]);

  const dayOptions = useMemo(() => buildDayOptions(data.fixtures.map((f) => f.commenceTimeEpoch), now), [data.fixtures, now]);

  const onQueryAi = useCallback(
    async (match: FixtureWithSentiment) => {
      if (aiStates[match.id] === "loading") return;
      setAiStates((prev) => ({ ...prev, [match.id]: "loading" }));
      try {
        const res = await fetch("/api/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match: liveTodo.current[match.id] ?? match }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as { analysis: FixtureWithSentiment["sentiment"]; degraded?: boolean };
        setData((prev) => ({
          ...prev,
          fixtures: prev.fixtures.map((f) =>
            f.id === match.id ? { ...f, sentiment: body.analysis, queried: true } : f
          ),
        }));
        setAiStates((prev) => ({ ...prev, [match.id]: "done" }));
      } catch {
        setAiStates((prev) => ({ ...prev, [match.id]: "error" }));
      }
    },
    [aiStates]
  );

  useEffect(() => {
    liveTodo.current = {};
    for (const f of data.fixtures) liveTodo.current[f.id] = f;
  }, [data.fixtures]);

  return (
    <>
      <Header
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
        dataSource={data.dataSource}
        oddsConfigured={data.oddsConfigured}
        geminiConfigured={data.geminiConfigured}
      />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <StatsBar
          total={stats.total}
          sweet={stats.sweet}
          high={stats.high}
          avgHomeOdds={stats.avg}
          now={now}
          fetchedAt={data.fetchedAt || null}
          fetching={loading || refreshing}
        />

        {loadError && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-amber-deep/25 bg-amber-soft px-4 py-3 text-sm">
            <span className="font-medium text-amber-deep">
              Could not load fixtures ({loadError}). Showing the last good cache — press refresh to retry.
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="h-9 shrink-0 rounded-full bg-amber-deep px-4 text-xs font-semibold text-white transition-colors duration-200 hover:bg-amber-deep/90"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-[76px] lg:self-start">
            <FilterSidebar
              filters={filters}
              onChange={setFilter}
              dayOptions={dayOptions}
              total={stats.total}
              sweet={stats.sweet}
              high={stats.high}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {loading ? (
              <div className="grid gap-6">
                <SectionSkeleton />
                <SectionSkeleton tall />
              </div>
            ) : (
              <>
                <SweetSpotShortlist
                  matches={shortlist}
                  aiStates={aiStates}
                  onQueryAi={onQueryAi}
                />
                <FixturesTable
                  matches={tableMatches}
                  sweetMin={filters.sweetSpotMin}
                  sweetMax={filters.sweetSpotMax}
                  aiStates={aiStates}
                  onQueryAi={onQueryAi}
                />
              </>
            )}
          </div>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-6 text-center text-[11px] text-ink-faint sm:flex-row sm:justify-between sm:text-left">
          <p className="flex items-center gap-1.5">
            <IconBolt className="h-3.5 w-3.5 text-accent" />
            Home win (&ldquo;1&rdquo;) is the only market the engine is permitted to pick. Away legs are never highlighted.
          </p>
          <p className="tabular">
            Timezone Eastern African Time (UTC+3) · live 1X2 odds via The Odds API · sentiment via Gemini AI with an
            instant seeded fallback model
          </p>
        </footer>
      </main>
    </>
  );
}

function SectionSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="animate-shimmer rounded-2xl border border-line bg-surface/70 p-5" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }}>
      <div className={`h-5 w-56 rounded-full bg-surface-warm ${tall ? "" : "mb-4"}`} />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: tall ? 6 : 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-line/70 bg-surface/60" />
        ))}
      </div>
    </div>
  );
}