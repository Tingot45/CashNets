import type { MatchFixture } from "./types";

const API_BASE = "https://v3.football.api-sports.io";

/**
 * API-Football (api-football.com) league ids keyed by our sport keys.
 * Free tier grants 100 requests per day — our cache makes that plenty.
 */
const LEAGUE_IDS: Record<string, number> = {
  soccer_epl: 39,
  soccer_spain_la_liga: 140,
  soccer_germany_bundesliga: 78,
  soccer_italy_serie_a: 135,
  soccer_france_ligue_one: 61,
  soccer_netherlands_eredivisie: 88,
  soccer_portugal_primeira_liga: 94,
  soccer_belgium_first_div: 144,
  soccer_turkey_super_league: 203,
  soccer_switzerland_superleague: 188,
  soccer_denmark_superliga: 119,
  soccer_sweden_allsvenskan: 113,
  soccer_norway_eliteserien: 103,
  soccer_greece_super_league: 197,
  soccer_usa_mls: 253,
  soccer_mexico_ligamx: 262,
  soccer_brazil_serie_a: 71,
  soccer_argentina_primera_division: 128,
  soccer_japan_j_league: 98,
  soccer_south_korea_kleague1: 292,
  soccer_china_superleague: 169,
  soccer_saudi_pro_league: 307,
  soccer_africa_caf_champions_league: 531,
};

const LEAGUE_NAMES: Record<number, { title: string; short: string; region: string }> = {
  39: { title: "Premier League", short: "EPL", region: "Europe" },
  140: { title: "La Liga", short: "LAL", region: "Europe" },
  78: { title: "Bundesliga", short: "BUN", region: "Europe" },
  135: { title: "Serie A", short: "SEA", region: "Europe" },
  61: { title: "Ligue 1", short: "LIG1", region: "Europe" },
  88: { title: "Eredivisie", short: "ERE", region: "Europe" },
  94: { title: "Primeira Liga", short: "POR", region: "Europe" },
  144: { title: "Belgian Pro League", short: "BEL", region: "Europe" },
  203: { title: "Süper Lig", short: "TUR", region: "Europe" },
  188: { title: "Swiss Super League", short: "SWI", region: "Europe" },
  119: { title: "Danish Superliga", short: "DEN", region: "Europe" },
  113: { title: "Allsvenskan", short: "SWE", region: "Europe" },
  103: { title: "Eliteserien", short: "NOR", region: "Europe" },
  197: { title: "Greek Super League", short: "GRE", region: "Europe" },
  253: { title: "Major League Soccer", short: "MLS", region: "North America" },
  262: { title: "Liga MX", short: "LMX", region: "North America" },
  71: { title: "Brasileirão Série A", short: "BRA", region: "South America" },
  128: { title: "Primera División", short: "ARG", region: "South America" },
  98: { title: "J1 League", short: "J1", region: "Asia" },
  292: { title: "K League 1", short: "K1", region: "Asia" },
  169: { title: "Chinese Super League", short: "CSL", region: "Asia" },
  307: { title: "Saudi Pro League", short: "SPL", region: "Africa & Middle East" },
  531: { title: "CAF Champions League", short: "CAF", region: "Africa & Middle East" },
};

const ID_TO_SPORT_KEY = new Map<number, string>(
  Object.entries(LEAGUE_IDS).map(([k, v]) => [v, k])
);

const HORIZON_DAYS = 3;

export class NoApiFootballKeyError extends Error {
  constructor() {
    super("API_FOOTBALL_KEY is not configured");
    this.name = "NoApiFootballKeyError";
  }
}

interface ApiBetValue {
  value: string;
  odd: string;
}

interface ApiBet {
  name: string;
  values: ApiBetValue[];
}

interface ApiBookmaker {
  name: string;
  bets: ApiBet[];
}

interface ApiOddsFixture {
  id: number;
  date: string;
  timestamp: number;
}

interface ApiOddsTeam {
  id: number;
  name: string;
}

interface ApiOddsLeague {
  id: number;
  name: string;
}

interface ApiOddsEntry {
  fixture: ApiOddsFixture;
  league: ApiOddsLeague;
  teams: { home: ApiOddsTeam; away: ApiOddsTeam };
  bookmakers: ApiBookmaker[];
}

interface ApiResponse<T> {
  response: T;
  errors?: Record<string, unknown>;
}

function eatDateString(dateMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateMs);
}

async function fetchApi<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": apiKey, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API-Football ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

export function hasApiFootballKey(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY && process.env.API_FOOTBALL_KEY.length > 0);
}

export async function fetchApiFootballOdds(apiKey?: string): Promise<MatchFixture[]> {
  if (!apiKey) throw new NoApiFootballKeyError();

  const now = Date.now();
  const dates: string[] = [];
  for (let i = 0; i < HORIZON_DAYS; i++) {
    dates.push(eatDateString(now + i * 86_400_000));
  }

  const settled = await Promise.allSettled(dates.map((d) => fetchApi<ApiOddsEntry[]>(`/odds?date=${d}&page=1`, apiKey)));

  const raw: ApiOddsEntry[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      raw.push(...result.value);
    } else if (result.status === "rejected") {
      // Not fatal for the whole batch.
    }
  }

  const byId = new Map<number, ApiOddsEntry>();
  for (const entry of raw) {
    if (!byId.has(entry.fixture.id)) byId.set(entry.fixture.id, entry);
  }

  const fixtures: MatchFixture[] = [];
  for (const entry of byId.values()) {
    const leagueId = entry.league.id;
    const idToKey = ID_TO_SPORT_KEY.get(leagueId);
    if (!idToKey) continue;
    const meta = LEAGUE_NAMES[leagueId];
    const homeName = entry.teams.home.name;
    const awayName = entry.teams.away.name;
    if (!homeName || !awayName) continue;

    const winnerBets = entry.bookmakers
      .map((bk) => bk.bets.find((b) => b.name.toLowerCase().includes("match winner")))
      .filter((b): b is ApiBet => Boolean(b));
    if (winnerBets.length === 0) continue;

    const price = (value: string) => {
      const nums = winnerBets
        .map((b) => b.values.find((v) => v.value.toLowerCase() === value.toLowerCase())?.odd)
        .map((o) => Number(o))
        .filter((o) => typeof o === "number" && !Number.isNaN(o) && o > 1);
      if (nums.length === 0) return null;
      return nums.reduce((acc, n) => acc + n, 0) / nums.length;
    };

    const homeOdds = price("Home");
    const drawOdds = price("Draw");
    const awayOdds = price("Away");
    if (homeOdds === null || drawOdds === null || awayOdds === null) continue;
    if (!Number.isFinite(homeOdds) || !Number.isFinite(drawOdds) || !Number.isFinite(awayOdds)) continue;

    const idForSportKey = Object.entries(LEAGUE_IDS).find(([, v]) => v === leagueId)?.[0] ?? "soccer";
    fixtures.push({
      id: `af-${leagueId}-${entry.fixture.id}`,
      sportKey: idForSportKey,
      league: meta.title,
      leagueShort: meta.short,
      region: meta.region,
      commenceTimeEpoch: entry.fixture.timestamp * 1000,
      homeTeam: homeName,
      awayTeam: awayName,
      homeOdds,
      drawOdds,
      awayOdds,
      bookmakers: winnerBets.length,
      source: "odds-api",
    });
  }

  return fixtures;
}

export function apiFootballLeagueIds(): number[] {
  return Object.values(LEAGUE_IDS);
}