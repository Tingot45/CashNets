import type { FixtureWithSentiment } from "@/lib/types";
import { formatOdds } from "@/lib/eat";

export default function OddsChips({
  match,
  sweet = false,
  size = "md",
}: {
  match: FixtureWithSentiment;
  sweet?: boolean;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-9 min-w-14 px-2 text-[11px]" : "h-11 min-w-16 px-2 text-xs";
  return (
    <div className="inline-flex items-stretch gap-1.5">
      <div
        data-home
        className={`${dims} flex flex-col items-center justify-center rounded-lg border leading-none tabular transition-colors duration-200 ${
          sweet
            ? "border-accent/40 bg-accent/10 text-accent-deep"
            : "border-line bg-surface text-ink"
        }`}
        title="Home win (1)"
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest opacity-60">1</span>
        <span className="mt-1 font-bold">{formatOdds(match.homeOdds)}</span>
      </div>
      <div
        className={`${dims} flex flex-col items-center justify-center rounded-lg border border-line bg-surface text-ink-soft`}
        title="Draw (X)"
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest opacity-50">X</span>
        <span className="mt-1 font-bold">{formatOdds(match.drawOdds)}</span>
      </div>
      <div
        className={`${dims} flex flex-col items-center justify-center rounded-lg border border-line bg-surface text-ink-soft`}
        title="Away win (2) — strictly neutral"
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest opacity-50">2</span>
        <span className="mt-1 font-bold">{formatOdds(match.awayOdds)}</span>
      </div>
    </div>
  );
}