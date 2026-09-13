import { useEffect, useRef, useState } from "react";
import { formatRelativeDelay } from "@/lib/eat";
import { IconHome, IconTarget, IconTrendUp, IconBell } from "./icons";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const start = performance.now();
    const dur = 550;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular">{display}</span>;
}

export default function StatsBar({
  total,
  sweet,
  high,
  avgHomeOdds,
  now,
  fetchedAt,
  fetching,
}: {
  total: number;
  sweet: number;
  high: number;
  avgHomeOdds: number | null;
  now: number;
  fetchedAt: string | null;
  fetching: boolean;
}) {
  const cells = [
    {
      icon: IconHome,
      label: "Upcoming home favourites",
      hint: "13 markets · home odds &lt; 1.80",
      value: total,
      accent: false,
    },
    {
      icon: IconTarget,
      label: "Sweet spot matches",
      hint: "inside the shortlist odds band",
      value: sweet,
      accent: true,
    },
    {
      icon: IconBell,
      label: "High sentiment",
      hint: "sentiment score ≥ threshold",
      value: high,
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
      {cells.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <Icon className={`h-4 w-4 ${c.accent ? "text-accent" : "text-ink-soft"}`} />
              {c.label}
            </div>
            <div className={`mt-1.5 font-display text-3xl font-extrabold tracking-tight ${c.accent ? "text-accent" : "text-ink"}`}>
              <AnimatedNumber value={c.value} />
            </div>
            <div className="mt-0.5 text-[11px] text-ink-faint">{c.hint}</div>
          </div>
        );
      })}
      <div className="bg-surface px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          <IconTrendUp className="h-4 w-4 text-ink-soft" />
          Pool pulse
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {avgHomeOdds ? avgHomeOdds.toFixed(2) : "–"}
          </span>
          <span className="text-[11px] text-ink-faint">avg home price</span>
        </div>
        <div className="mt-0.5 text-[11px] text-ink-faint tabular">
          {fetching
            ? "Syncing…"
            : fetchedAt
              ? `cache refreshed ${formatRelativeDelay(Date.parse(fetchedAt), now).toLowerCase()}`
              : "—"}
        </div>
      </div>
    </div>
  );
}