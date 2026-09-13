import { loadFixtures } from "./fixture-store";

const TZ = "Africa/Nairobi";
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
// EAT is UTC+3 with no DST, so 00:00 EAT == 21:00 UTC the previous day.
const TZ_OFFSET_HOURS = 3;

declare global {
  var __dailyRefreshScheduled: boolean | undefined;
}

function nextEatMidnightMs(fromMs: number): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(fromMs)
    .split("-")
    .map(Number);

  const todayMidnightUtc = Date.UTC(y, m - 1, d) - TZ_OFFSET_HOURS * HOUR_MS;
  let nextMidnight = todayMidnightUtc + DAY_MS;
  if (nextMidnight <= fromMs) nextMidnight += DAY_MS;
  return nextMidnight;
}

function scheduleNext() {
  const now = Date.now();
  const wait = nextEatMidnightMs(now) - now;

  setTimeout(() => {
    void (async () => {
      try {
        const entry = await loadFixtures(true);
        console.log(
          `[daily-refresh] EAT midnight force refresh complete — ${entry.data.length} fixtures via ${entry.source}`
        );
      } catch (err) {
        console.error("[daily-refresh] EAT midnight force refresh failed:", err);
      }
      scheduleNext();
    })();
  }, wait);

  console.log(
    `[daily-refresh] next force refresh scheduled for ${new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now + wait)} EAT (${wait < 3_600_000 ? `${Math.round(wait / 60_000)}m` : `${Math.round(wait / 3_600_000)}h`} away)`
  );
}

export function scheduleDailyRefresh() {
  if (globalThis.__dailyRefreshScheduled) return;
  globalThis.__dailyRefreshScheduled = true;

  // On Vercel the refresh is handled by the vercel.json cron job hitting
  // /api/cron at 21:00 UTC (00:00 EAT). An in-process timer would be
  // unreliable in serverless.
  if (process.env.VERCEL) {
    console.log("[daily-refresh] on Vercel — using vercel.json cron instead of an in-process timer");
    return;
  }

  scheduleNext();
}