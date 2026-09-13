export const EAT_TIMEZONE = "Africa/Nairobi";

const eatFormatterCache = new Map<string, Intl.DateTimeFormat>();

function eatFormatter(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(opts);
  let fm = eatFormatterCache.get(key);
  if (!fm) {
    fm = new Intl.DateTimeFormat("en-GB", { timeZone: EAT_TIMEZONE, ...opts });
    eatFormatterCache.set(key, fm);
  }
  return fm;
}

export function nowEatMs(): number {
  return Date.now();
}

export function toEatParts(epochMs: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EAT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(epochMs);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    weekday: get("weekday"),
  };
}

export function formatEatDateUTC(epochMs: number): string {
  const { year, month, day } = toEatParts(epochMs);
  return `${year}-${month}-${day}`;
}

export function formatKickoff(epochMs: number, withDate = true): string {
  const p = toEatParts(epochMs);
  if (withDate) {
    return `${p.weekday} ${p.day}/${p.month} · ${p.hour}:${p.minute}`;
  }
  return `${p.hour}:${p.minute}`;
}

export function formatCardinalDate(epochMs: number): string {
  return eatFormatter({
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(epochMs);
}

export function formatRelativeDelay(epochMs: number, now = Date.now()): string {
  const diff = epochMs - now;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours <= 0 && minutes <= 0) return "Kicking off";
  if (hours <= 0) return `T-minus ${minutes}m`;
  return `T-minus ${hours}h ${minutes}m`;
}

export function formatClock(epochMs: number): string {
  return eatFormatter({
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(epochMs);
}

export function formatOdds(value: number): string {
  return value.toFixed(2);
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

export function isSameEatDay(epochMs: number, dateStr: string, now = Date.now()): boolean {
  if (dateStr === "all") return true;
  if (dateStr === "today") return formatEatDateUTC(now) === formatEatDateUTC(epochMs);
  if (dateStr === "tomorrow") {
    const tomorrow = now + 24 * 3600 * 1000;
    return formatEatDateUTC(tomorrow) === formatEatDateUTC(epochMs);
  }
  return formatEatDateUTC(epochMs) === dateStr;
}

export interface DayOption {
  label: string;
  value: string;
  count: number;
}

export function buildDayOptions(
  epochMss: number[],
  now = Date.now()
): DayOption[] {
  const today = formatEatDateUTC(now);
  const tomorrow = formatEatDateUTC(now + 86_400_000);
  const counts = new Map<string, number>();
  for (const ms of epochMss) {
    const d = formatEatDateUTC(ms);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const opts: DayOption[] = [
    { label: "All days", value: "all", count: epochMss.length },
  ];
  if (counts.has(today)) opts.push({ label: "Today", value: today, count: counts.get(today)! });
  if (counts.has(tomorrow)) opts.push({ label: "Tomorrow", value: tomorrow, count: counts.get(tomorrow)! });
  const sorted = [...counts.keys()].sort();
  for (const d of sorted) {
    if (d === today || d === tomorrow) continue;
    opts.push({
      label: eatFormatter({ weekday: "short", day: "numeric", month: "short" }).format(
        fromEatDate(d)
      ),
      value: d,
      count: counts.get(d)!,
    });
  }
  return opts;
}

function fromEatDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0)).getTime();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}