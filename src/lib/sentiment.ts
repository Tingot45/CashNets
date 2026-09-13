import type { FixtureWithSentiment, MatchFixture, SentimentAnalysis, SentimentVerdict } from "./types";
import { EAT_TIMEZONE, clamp, hashString, seededRandom } from "./eat";

const REASONS: ((m: MatchFixture) => string)[] = [
  (m) => `Home fortress — ${m.homeTeam} average 2.4 points from their last five home games in the ${m.league}.`,
  (m) => `${m.homeTeam} have won to nil in three of their last four home starts.`,
  (m) =>
    `Team news weights this way: ${m.homeTeam} report a near-full squad while key opposition starters are doubtful.`,
  (m) => `Opposition travel hangover: ${m.awayTeam} face a quick turnaround after a draining ${m.league} round.`,
  () => `Local betting flows are piling onto the home side — sharp money has compressed the 1 price all week.`,
  (m) =>
    `${m.homeTeam} outrank ${m.awayTeam} on expected-goals at home this season, controlling both box traffic and tempo.`,
  (m) =>
    `Seasonal context favours the host — this tie tends to be decided inside the opening half-hour in the ${m.league}.`,
  (m) =>
    `${m.homeTeam} hold a 4-1 head-to-head record over ${m.awayTeam} in recent meetings, including a clean sheet in the last clash.`,
];

const CATALYSTS_HOME = [
  "First-choice attackers all fit and in form",
  "Five-match unbeaten home run",
  "Opposition resting starters ahead of cup duty",
  "Set-piece dominance in the final third",
  "Expected line-up shows an aggressive double-pivot",
  "Key playmaker returns from suspension",
  "Opposition keeper and captain both unavailable",
  "Ground altitude & crowd noise historically decisive here",
];

const SUMMARY_A = [
  "The numbers point one way: the host owns the deeper squad, the sharper form line, and the edge in this season's head-to-head.",
  "Odds, form and personnel all align with a home-centric read.",
  "The market consensus and the model lean in the same direction, but the price still recognises the outsider's live threat.",
];

const SUMMARY_B = [
  "Expect the favourites to control territory early and convert set-piece pressure into a decisive first goal.",
  "A controlled home performance with the match likely settled between the 20th and 60th minute.",
  "This is a game the host should dictate from the opening whistle, so a win margin of two looks closer to fair value than the odds imply.",
];

const SUMMARY_C = [
  "That said, bank on structure over heroics — a professional home display rather than a blowout.",
  "Still, the short price demands discipline: value exists but the variance is real.",
  "Use this as a portfolio anchor rather than a headline flier.",
];

export function computeSeededSentiment(match: MatchFixture): SentimentAnalysis {
  const rng = seededRandom(hashString(match.id));
  const implied = 1 / match.homeOdds;
  const base = (0.55 + 0.45 * implied) * 100;
  const score = clamp(Math.round(base + (rng() - 0.5) * 8), 0, 100);

  const verdict = resolveVerdict(score, match.homeOdds);

  const reasonCount = 3;
  const selected = new Set<number>();
  const reasoning: string[] = [];
  while (reasoning.length < reasonCount) {
    const idx = Math.floor(rng() * REASONS.length);
    if (selected.has(idx)) continue;
    selected.add(idx);
    reasoning.push(REASONS[idx](match));
  }

  const catalystCount = 2 + Math.floor(rng() * 2);
  const cats = new Set<number>();
  const catalysts: string[] = [];
  while (catalysts.length < catalystCount) {
    const idx = Math.floor(rng() * CATALYSTS_HOME.length);
    if (cats.has(idx)) continue;
    cats.add(idx);
    catalysts.push(CATALYSTS_HOME[idx]);
  }

  const summary = [SUMMARY_A[Math.floor(rng() * SUMMARY_A.length)], SUMMARY_B[Math.floor(rng() * SUMMARY_B.length)], SUMMARY_C[Math.floor(rng() * SUMMARY_C.length)]].join(" ");

  return {
    score,
    reasoning,
    catalysts,
    verdict,
    summary,
    confidence: Math.round(clamp(0.8 + rng() * 0.16, 0, 1) * 100) / 100,
    source: "model-seeded",
    generatedAt: new Date().toISOString(),
  };
}

export function resolveVerdict(score: number, homeOdds: number): SentimentVerdict {
  if (score >= 88 && homeOdds >= 1.25 && homeOdds <= 1.7) return "Value Gem";
  if (score >= 75) return "Safe Bet";
  return "Caution";
}

export function isSweetSpot(match: FixtureWithSentiment, min: number, max: number): boolean {
  return match.homeOdds >= min && match.homeOdds <= max;
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0);
}

function buildPrompt(match: FixtureWithSentiment): string {
  const kickoff = new Intl.DateTimeFormat("en-GB", {
    timeZone: EAT_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(match.commenceTimeEpoch);

  return `You are a senior football betting analyst specialising in home advantage and sentiment modelling.
Analyse the following HOME-WIN opportunity. We ONLY evaluate the home team and its win odds ("1" in 1X2). Never recommend the away side.

MATCH FACTS:
- League: ${match.league}
- Home: ${match.homeTeam}
- Away: ${match.awayTeam}
- Kick-off (EAT, UTC+3): ${kickoff}
- 1X2 odds (decimal, consensus across ${match.bookmakers} books): Home ${match.homeOdds.toFixed(2)} / Draw ${match.drawOdds.toFixed(2)} / Away ${match.awayOdds.toFixed(2)}

CONSIDER (synthesise as if you just pulled live signals):
1. Recent home form & fortress record for ${match.homeTeam}.
2. Personnel news: injuries, suspensions, rotation risk on BOTH benches — where does it edge?
3. Simulated online fan sentiment & social chatter volume around this fixture.
4. Local betting volumes / where the "sharps" are pressing the price.
5. Contextual quirks (derby, crowd, travel, cup round, schedule congestion).

OUTPUT RULES:
- Return STRICT JSON, no markdown fences, no commentary outside the object.
- Schema:
{
  "score": <integer 0-100, your home-sentiment confidence>,
  "reasoning": ["3-5 short, specific bullet points"],
  "catalysts": ["2-4 concrete tipping points"],
  "verdict": "<one exact string: Value Gem | Safe Bet | Caution>",
  "summary": "<2-3 sentence executive summary, grounded and non-hype>",
  "confidence": <number 0-1, how reliable this read is>
}
- verdict guidance: "Value Gem" = elite score AND odds in 1.25-1.70 while the number looks too generous; "Safe Bet" = strong score, price merely fair; "Caution" = anything below 75 or with material doubt.
- Do not fabricate exact injury names unless broadly known. Mark estimates with "est." where you are projecting.`;
}

export async function generateGeminiAnalysis(match: FixtureWithSentiment): Promise<SentimentAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: key });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(match),
    config: { responseMimeType: "application/json" },
  });

  const text =
    typeof response.text === "string"
      ? response.text
      : response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const raw = extractJson(text);

  if (!raw) throw new Error("Gemini returned unparseable output");

  const score = clamp(Math.round(Number(raw.score) || 0), 0, 100);
  const reasoning = Array.isArray(raw.reasoning) ? raw.reasoning.filter((r): r is string => typeof r === "string").slice(0, 5) : [];
  const catalysts = Array.isArray(raw.catalysts) ? raw.catalysts.filter((c): c is string => typeof c === "string").slice(0, 4) : [];
  const summary = typeof raw.summary === "string" ? raw.summary : "";
  const confidence = clamp(Number(raw.confidence) || 0.5, 0, 1);
  const verdict = resolveLiveVerdict(raw.verdict, score, match.homeOdds);

  return {
    score,
    reasoning,
    catalysts,
    verdict,
    summary,
    confidence: Math.round(confidence * 100) / 100,
    source: "live-ai",
    generatedAt: new Date().toISOString(),
  };
}

function resolveLiveVerdict(value: unknown, score: number, homeOdds: number): SentimentVerdict {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("value")) return "Value Gem";
  if (v.includes("safe")) return "Safe Bet";
  if (v.includes("caution")) return "Caution";
  return resolveVerdict(score, homeOdds);
}

function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}