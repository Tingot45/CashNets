import type { MatchFixture } from "./types";
import { EAT_TIMEZONE, formatEatDateUTC, hashString, seededRandom } from "./eat";

const ROSTERS: Record<string, string[]> = {
  soccer_epl: ["Arsenal", "Liverpool", "Man City", "Man United", "Chelsea", "Tottenham", "Newcastle", "Aston Villa", "Brighton", "West Ham", "Everton", "Bournemouth", "Brentford", "Fulham", "Crystal Palace", "Nottingham Forest", "Wolves", "Leeds"],
  soccer_spain_la_liga: ["Real Madrid", "Barcelona", "Atlético Madrid", "Athletic Club", "Real Sociedad", "Villarreal", "Real Betis", "Sevilla", "Valencia", "Girona", "Osasuna", "Celta Vigo", "Mallorca", "Rayo Vallecano", "Getafe", "Espanyol"],
  soccer_germany_bundesliga: ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Eintracht Frankfurt", "VfB Stuttgart", "SC Freiburg", "Hoffenheim", "VfL Wolfsburg", "Werder Bremen", "Gladbach", "FC Augsburg", "Mainz 05", "Union Berlin", "St. Pauli"],
  soccer_italy_serie_a: ["Inter", "AC Milan", "Juventus", "Napoli", "Atalanta", "Roma", "Lazio", "Fiorentina", "Bologna", "Torino", "Udinese", "Genoa", "Cagliari", "Lecce", "Parma", "Hellas Verona"],
  soccer_france_ligue_one: ["PSG", "Marseille", "Monaco", "Lille", "Lyon", "Lens", "Nice", "Rennes", "Strasbourg", "Reims", "Toulouse", "Nantes", "Brest", "Auxerre", "Le Havre"],
  soccer_netherlands_eredivisie: ["Ajax", "PSV", "Feyenoord", "AZ Alkmaar", "FC Twente", "FC Utrecht", "Sparta Rotterdam", "NEC Nijmegen", "Go Ahead Eagles", "SC Heerenveen", "FC Groningen", "Fortuna Sittard"],
  soccer_portugal_primeira_liga: ["Benfica", "Sporting CP", "Porto", "Braga", "Vitória SC", "Boavista", "Estoril", "Gil Vicente", "Arouca", "Famalicão", "Rio Ave", "Casa Pia"],
  soccer_belgium_first_div: ["Club Brugge", "Anderlecht", "Genk", "Union SG", "Antwerp", "Standard Liège", "Gent", "Charleroi", "Mechelen", "Cercle Brugge", "OH Leuven", "Sint-Truiden"],
  soccer_turkey_super_league: ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Alanyaspor", "Sivasspor", "Konyaspor", "Gaziantep FK", "Antalyaspor", "Kasımpaşa", "Rizespor"],
  soccer_switzerland_superleague: ["Young Boys", "Basel", "Servette", "FC Zürich", "Lugano", "St. Gallen", "Luzern", "Lausanne Sport", "Sion", "Grasshopper"],
  soccer_denmark_superliga: ["FC Copenhagen", "Brøndby", "Midtjylland", "AGF Aarhus", "Nordsjælland", "Randers", "Silkeborg", "Lyngby", "AaB", "Vejle"],
  soccer_sweden_allsvenskan: ["Malmö FF", "AIK", "Djurgården", "Hammarby", "IFK Göteborg", "BK Häcken", "Elfsborg", "IFK Norrköping", "Mjällby", "Sirius"],
  soccer_norway_eliteserien: ["Bodø/Glimt", "Rosenborg", "Molde", "Brann", "Viking", "Lillestrøm", "Tromsø", "Strømsgodset", "Odd", "HamKam"],
  soccer_greece_super_league: ["Olympiacos", "PAOK", "AEK Athens", "Panathinaikos", "Aris", "Asteras Tripolis", "OFI Crete", "Atromitos", "Volos", "Levadiakos"],
  soccer_usa_mls: ["Inter Miami", "LA Galaxy", "LAFC", "FC Cincinnati", "Columbus Crew", "Atlanta United", "Seattle Sounders", "Sporting KC", "Portland Timbers", "NY Red Bulls", "Philadelphia Union", "Austin FC", "Nashville SC", "St. Louis City"],
  soccer_mexico_ligamx: ["América", "Cruz Azul", "Guadalajara", "Toluca", "Tigres", "Monterrey", "Pumas", "León", "Pachuca", "Atlas", "Santos Laguna", "Necaxa"],
  soccer_brazil_serie_a: ["Palmeiras", "Flamengo", "Botafogo", "Fluminense", "Corinthians", "São Paulo", "Atlético Mineiro", "Internacional", "Grêmio", "Cruzeiro", "Vasco da Gama", "Fortaleza", "Bahia", "Red Bull Bragantino", "Athletico-PR", "Santos"],
  soccer_argentina_primera_division: ["River Plate", "Boca Juniors", "Racing Club", "Independiente", "Talleres", "Vélez", "Estudiantes", "San Lorenzo", "Argentinos Juniors", "Huracán", "Lanús", "Godoy Cruz"],
  soccer_japan_j_league: ["Vissel Kobe", "Sanfrecce Hiroshima", "Kawasaki Frontale", "Yokohama F. Marinos", "Kashima Antlers", "Urawa Reds", "Gamba Osaka", "FC Tokyo", "Nagoya Grampus", "Cerezo Osaka", "Avispa Fukuoka", "Kyoto Sanga"],
  soccer_south_korea_kleague1: ["Ulsan Hyundai", "Jeonbuk Hyundai", "FC Seoul", "Pohang Steelers", "Gwangju FC", "Daegu FC", "Incheon United", "Suwon FC", "Jeju United", "Gangwon FC"],
  soccer_china_superleague: ["Shanghai Port", "Shanghai Shenhua", "Shandong Taishan", "Chengdu Rongcheng", "Beijing Guoan", "Zhejiang", "Wuhan Three Towns", "Tianjin Tiger", "Henan", "Changchun Yatai"],
  soccer_saudi_pro_league: ["Al Hilal", "Al Nassr", "Al Ittihad", "Al Ahli", "Al Shabab", "Al Qadsiah", "Al Fateh", "Al Taawoun", "Damac", "Al Khaleej"],
  soccer_africa_caf_champions_league: ["Al Ahly", "ES Tunis", "Mamelodi Sundowns", "Wydad AC", "Raja Casablanca", "TP Mazembe", "Simba SC", "Young Africans", "Pyramids FC", "Zamalek", "AS FAR", "Petro de Luanda"],
};

const LEAGUE_META: Record<string, { region: string; short: string }> = {
  soccer_epl: { region: "Europe", short: "EPL" },
  soccer_spain_la_liga: { region: "Europe", short: "LAL" },
  soccer_germany_bundesliga: { region: "Europe", short: "BUN" },
  soccer_italy_serie_a: { region: "Europe", short: "SEA" },
  soccer_france_ligue_one: { region: "Europe", short: "LIG1" },
  soccer_netherlands_eredivisie: { region: "Europe", short: "ERE" },
  soccer_portugal_primeira_liga: { region: "Europe", short: "POR" },
  soccer_belgium_first_div: { region: "Europe", short: "BEL" },
  soccer_turkey_super_league: { region: "Europe", short: "TUR" },
  soccer_switzerland_superleague: { region: "Europe", short: "SWI" },
  soccer_denmark_superliga: { region: "Europe", short: "DEN" },
  soccer_sweden_allsvenskan: { region: "Europe", short: "SWE" },
  soccer_norway_eliteserien: { region: "Europe", short: "NOR" },
  soccer_greece_super_league: { region: "Europe", short: "GRE" },
  soccer_usa_mls: { region: "North America", short: "MLS" },
  soccer_mexico_ligamx: { region: "North America", short: "LMX" },
  soccer_brazil_serie_a: { region: "South America", short: "BRA" },
  soccer_argentina_primera_division: { region: "South America", short: "ARG" },
  soccer_japan_j_league: { region: "Asia", short: "J1" },
  soccer_south_korea_kleague1: { region: "Asia", short: "K1" },
  soccer_china_superleague: { region: "Asia", short: "CSL" },
  soccer_saudi_pro_league: { region: "Africa & Middle East", short: "SPL" },
  soccer_africa_caf_champions_league: { region: "Africa & Middle East", short: "CAF" },
};

const HOUR_SLOTS = [13, 15, 16, 17, 18, 19, 20, 21, 22];

function eatMidnightEpoch(nowMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EAT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(nowMs);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")), 21, 0, 0);
}

export function buildMockFixtures(nowMs: number): MatchFixture[] {
  const dayKey = formatEatDateUTC(nowMs);
  const midnight = eatMidnightEpoch(nowMs);
  const fixtures: MatchFixture[] = [];

  for (const [key, roster] of Object.entries(ROSTERS)) {
    const rng = seededRandom(hashString(`${dayKey}-${key}`));
    const meta = LEAGUE_META[key];
    const teamPowers = roster.map((name) => ({ name, power: rng() }));
    const shuffled = [...teamPowers].sort(() => rng() - 0.5);

    const half = Math.floor(shuffled.length / 2);
    const homeHalf = shuffled.slice(0, half);
    const awayHalf = shuffled.slice(half, half * 2);

    homeHalf.forEach((home, idx) => {
      const away = awayHalf[idx];
      const diff = home.power - away.power;

      const ph = Math.min(0.8, Math.max(0.34, 0.5 + diff * 0.62 + (rng() - 0.5) * 0.05));
      const pd = 0.2 + (rng() - 0.5) * 0.08;
      const overround = 1.04 + rng() * 0.03;
      const homeOdds = round2(1 / (ph * overround));
      const drawOdds = round2(1 / (pd * overround));
      const awayOdds = round2(1 / ((1 - ph - pd) * overround));

      const dayOffset = Math.floor(rng() * 3);
      const hour = HOUR_SLOTS[Math.floor(rng() * HOUR_SLOTS.length)];
      const kickoff = midnight + dayOffset * 86_400_000 + hour * 3_600_000 + Math.floor(rng() * 8) * 900_000;
      if (kickoff <= nowMs + 15 * 60_000) return;

      fixtures.push({
        id: `mock-${key}-${home.name}-${away.name}-${dayKey}`.replace(/\s+/g, "-").toLowerCase(),
        sportKey: key,
        league: metaTitles[key] ?? key,
        leagueShort: meta.short,
        region: meta.region,
        commenceTimeEpoch: kickoff,
        homeTeam: home.name,
        awayTeam: away.name,
        homeOdds,
        drawOdds,
        awayOdds,
        bookmakers: 6 + Math.floor(rng() * 14),
        source: "mock",
      });
    });
  }

  return fixtures.sort((a, b) => a.commenceTimeEpoch - b.commenceTimeEpoch);
}

const metaTitles: Record<string, string> = {
  soccer_epl: "Premier League",
  soccer_spain_la_liga: "La Liga",
  soccer_germany_bundesliga: "Bundesliga",
  soccer_italy_serie_a: "Serie A",
  soccer_france_ligue_one: "Ligue 1",
  soccer_netherlands_eredivisie: "Eredivisie",
  soccer_portugal_primeira_liga: "Primeira Liga",
  soccer_belgium_first_div: "Belgian Pro League",
  soccer_turkey_super_league: "Süper Lig",
  soccer_switzerland_superleague: "Swiss Super League",
  soccer_denmark_superliga: "Danish Superliga",
  soccer_sweden_allsvenskan: "Allsvenskan",
  soccer_norway_eliteserien: "Eliteserien",
  soccer_greece_super_league: "Greek Super League",
  soccer_usa_mls: "Major League Soccer",
  soccer_mexico_ligamx: "Liga MX",
  soccer_brazil_serie_a: "Brasileirão Série A",
  soccer_argentina_primera_division: "Primera División",
  soccer_japan_j_league: "J1 League",
  soccer_south_korea_kleague1: "K League 1",
  soccer_china_superleague: "Chinese Super League",
  soccer_saudi_pro_league: "Saudi Pro League",
  soccer_africa_caf_champions_league: "CAF Champions League",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}