import type { LeagueMeta } from "./types";

export const LEAGUES: LeagueMeta[] = [
  { key: "soccer_epl", title: "Premier League", short: "EPL", region: "Europe" },
  { key: "soccer_spain_la_liga", title: "La Liga", short: "LAL", region: "Europe" },
  { key: "soccer_germany_bundesliga", title: "Bundesliga", short: "BUN", region: "Europe" },
  { key: "soccer_italy_serie_a", title: "Serie A", short: "SEA", region: "Europe" },
  { key: "soccer_france_ligue_one", title: "Ligue 1", short: "L1", region: "Europe" },
  { key: "soccer_netherlands_eredivisie", title: "Eredivisie", short: "ERE", region: "Europe" },
  { key: "soccer_portugal_primeira_liga", title: "Primeira Liga", short: "POR", region: "Europe" },
  { key: "soccer_belgium_first_div", title: "Belgian Pro League", short: "BEL", region: "Europe" },
  { key: "soccer_turkey_super_league", title: "Süper Lig", short: "TUR", region: "Europe" },
  { key: "soccer_switzerland_superleague", title: "Swiss Super League", short: "SWI", region: "Europe" },
  { key: "soccer_denmark_superliga", title: "Danish Superliga", short: "DEN", region: "Europe" },
  { key: "soccer_sweden_allsvenskan", title: "Allsvenskan", short: "SWE", region: "Europe" },
  { key: "soccer_norway_eliteserien", title: "Eliteserien", short: "NOR", region: "Europe" },
  { key: "soccer_greece_super_league", title: "Greek Super League", short: "GRE", region: "Europe" },
  { key: "soccer_usa_mls", title: "Major League Soccer", short: "MLS", region: "North America" },
  { key: "soccer_mexico_ligamx", title: "Liga MX", short: "LMX", region: "North America" },
  { key: "soccer_brazil_serie_a", title: "Campeonato Brasileiro Série A", short: "BRA", region: "South America" },
  { key: "soccer_argentina_primera_division", title: "Primera División", short: "ARG", region: "South America" },
  { key: "soccer_japan_j_league", title: "J1 League", short: "J1", region: "Asia" },
  { key: "soccer_south_korea_kleague1", title: "K League 1", short: "K1", region: "Asia" },
  { key: "soccer_china_superleague", title: "Chinese Super League", short: "CSL", region: "Asia" },
  { key: "soccer_saudi_pro_league", title: "Saudi Pro League", short: "SPL", region: "Africa & Middle East" },
  { key: "soccer_africa_caf_champions_league", title: "CAF Champions League", short: "CAF", region: "Africa & Middle East" },
];

export function leagueMetaByKey(key: string): LeagueMeta {
  return (
    LEAGUES.find((l) => l.key === key) ?? {
      key,
      title: key,
      short: key.toUpperCase().slice(0, 3),
      region: "International",
    }
  );
}

export const REGION_OPTIONS = [
  "all",
  "Europe",
  "South America",
  "North America",
  "Asia",
  "Africa & Middle East",
] as const;

export function sportKeys(): string[] {
  return LEAGUES.map((l) => l.key);
}