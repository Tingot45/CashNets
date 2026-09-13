export type SentimentVerdict = "Value Gem" | "Safe Bet" | "Caution";

export interface MatchFixture {
  id: string;
  sportKey: string;
  league: string;
  leagueShort: string;
  region: string;
  commenceTimeEpoch: number;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmakers: number;
  source: "odds-api" | "mock";
}

export interface SentimentAnalysis {
  score: number;
  reasoning: string[];
  catalysts: string[];
  verdict: SentimentVerdict;
  summary: string;
  confidence: number;
  source: "live-ai" | "model-seeded";
  generatedAt: string;
  fallback?: boolean;
}

export interface FixtureWithSentiment extends MatchFixture {
  sentiment: SentimentAnalysis;
  queried?: boolean;
}

export interface LeagueMeta {
  key: string;
  title: string;
  short: string;
  region: string;
}

export type PoolDataSource = "odds-api" | "mock";

export interface FixturesResponse {
  fixtures: FixtureWithSentiment[];
  leagues: LeagueMeta[];
  regions: string[];
  fetchedAt: string;
  dataSource: PoolDataSource;
  oddsConfigured: boolean;
  geminiConfigured: boolean;
  now: number;
}

export interface FiltersState {
  sweetSpotMin: number;
  sweetSpotMax: number;
  minSentiment: number;
  horizonHours: 12 | 24 | 48 | 72;
  search: string;
  region: string;
  date: string;
}

export const DEFAULT_FILTERS: FiltersState = {
  sweetSpotMin: 1.3,
  sweetSpotMax: 1.7,
  minSentiment: 75,
  horizonHours: 48,
  search: "",
  region: "all",
  date: "all",
};

export interface LiveAnalysisPayload {
  match: FixtureWithSentiment;
}

export interface LiveAnalysisResult {
  analysis: SentimentAnalysis;
  matchId: string;
  cached: boolean;
}