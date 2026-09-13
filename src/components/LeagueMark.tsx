const PALETTE = [
  "bg-[#eef0e4] text-[#4a4c33]",
  "bg-[#e7eef0] text-[#2f4a52]",
  "bg-[#f1e9dc] text-[#6b4e2e]",
  "bg-[#e9e9f0] text-[#3c3c5c]",
  "bg-[#eee8f0] text-[#5c3660]",
  "bg-[#eaf0e8] text-[#33502f]",
];

export function hashIndex(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export type LeagueLike = {
  key?: string;
  short?: string;
  title?: string;
  sportKey?: string;
  league?: string;
  leagueShort?: string;
};

export default function LeagueMark({
  league,
  size = "md",
  className = "",
}: {
  league: LeagueLike;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const short = ((league.short ?? league.leagueShort) ?? (league.title ?? league.league) ?? league.key ?? league.sportKey ?? "??")
    .slice(0, 3)
    .toUpperCase();
  const key = league.key ?? league.sportKey ?? short;
  const tone = PALETTE[hashIndex(key) % PALETTE.length];
  const dims =
    size === "sm" ? "h-7 w-7 text-[9px]" : size === "lg" ? "h-11 w-11 text-[12px]" : "h-9 w-9 text-[10px]";
  return (
    <span
      className={`${dims} ${tone} inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight select-none ${className}`}
    >
      {short}
    </span>
  );
}