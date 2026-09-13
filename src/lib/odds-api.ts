import type { MatchFixture } from "./types";
import { leagueMetaByKey, sportKeys } from "./leagues";

const API_BASE = "https://api.the-odds-api.com/v4";

export class NoApiKeyError extends Error {
  constructor() {
    super("ODDS_API_KEY is not configured");
    this.name = "NoApiKeyError";
  }
}

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface RawBookmaker {
  key: string;
  markets: OddsApiMarket[];
}

interface RawEvent {
  id: string;
  sport_key?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: RawBookmaker[];
}

export async function fetchOddsFixtures(apiKey?: string): Promise<MatchFixture[]> {
  if (!apiKey) throw new NoApiKeyError();

  const keys = sportKeys();
  const settled = await Promise.allSettled(
    keys.map(async (sportKey) => {
      const url = `${API_BASE}/sports/${encodeURIComponent(sportKey)}/odds/?apiKey=${encodeURIComponent(
        apiKey
      )}&regions=eu%2Cuk&markets=h2h&oddsFormat=decimal&dateFormat=iso`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Odds API ${res.status} for ${sportKey}: ${body.slice(0, 160)}`);
      }
      return (await res.json()) as RawEvent[];
    })
  );

  const fixtures: MatchFixture[] = [];
  let unexpectedFailure: unknown = null;

  for (const [i, result] of settled.entries()) {
    if (result.status === "rejected") {
      // Any HTTP 4xx on a single league endpoint should not kill the whole batch.
      const err = result.reason as Error;
      if (/401|403|404/.test(err.message) && fixtures.length === 0 && !unexpectedFailure) {
        unexpectedFailure = err;
      }
      continue;
    }
    const sportKey = keys[i];
    const meta = leagueMetaByKey(sportKey);
    for (const ev of result.value) {
      const h2h = ev.bookmakers
        .map((bk) => bk.markets.find((m) => m.key === "h2h"))
        .filter((m): m is OddsApiMarket => Boolean(m));
      if (h2h.length === 0) continue;
      const market = h2h[0];
      const homeOut = market.outcomes.find((o) => o.name === ev.home_team);
      const awayOut = market.outcomes.find((o) => o.name === ev.away_team);
      const drawOut = market.outcomes.find((o) => o.name === "Draw");
      if (!homeOut || !awayOut || !drawOut) continue;

      const avg = (name: string) => {
        const prices = h2h
          .map((m) => m.outcomes.find((o) => o.name === name)?.price)
          .filter((p): p is number => typeof p === "number" && p > 1);
        if (prices.length === 0) return 1;
        return prices.reduce((a, b) => a + b, 0) / prices.length;
      };

      fixtures.push({
        id: ev.id ?? `${ev.sport_key}-${ev.home_team}-${ev.away_team}`,
        sportKey: ev.sport_key ?? sportKey,
        league: meta.title,
        leagueShort: meta.short,
        region: meta.region,
        commenceTimeEpoch: Date.parse(ev.commence_time),
        homeTeam: ev.home_team,
        awayTeam: ev.away_team,
        homeOdds: Math.round(avg(ev.home_team) * 100) / 100,
        drawOdds: Math.round(avg("Draw") * 100) / 100,
        awayOdds: Math.round(avg(ev.away_team) * 100) / 100,
        bookmakers: h2h.length,
        source: "odds-api",
      });
    }
  }

  if (fixtures.length > 0) return fixtures;
  if (unexpectedFailure) throw unexpectedFailure as Error;
  return [];
}

export function hasOddsKey(): boolean {
  return Boolean(process.env.ODDS_API_KEY);
}