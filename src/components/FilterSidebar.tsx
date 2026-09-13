import type { FiltersState } from "@/lib/types";
import { DEFAULT_FILTERS } from "@/lib/types";
import type { DayOption } from "@/lib/eat";
import { REGION_OPTIONS } from "@/lib/leagues";
import { formatOdds } from "@/lib/eat";
import DualRangeSlider from "./DualRangeSlider";
import { IconCalendar, IconClose, IconFilter, IconHome, IconSearch, IconTarget, IconBell } from "./icons";

const HORIZONS = [12, 24, 48, 72] as const;

export default function FilterSidebar({
  filters,
  onChange,
  dayOptions,
  total,
  sweet,
  high,
}: {
  filters: FiltersState;
  onChange: (patch: Partial<FiltersState>) => void;
  dayOptions: DayOption[];
  total: number;
  sweet: number;
  high: number;
}) {
  const hasCustom =
    filters.sweetSpotMin !== DEFAULT_FILTERS.sweetSpotMin ||
    filters.sweetSpotMax !== DEFAULT_FILTERS.sweetSpotMax ||
    filters.minSentiment !== DEFAULT_FILTERS.minSentiment ||
    filters.horizonHours !== DEFAULT_FILTERS.horizonHours ||
    filters.search !== "" ||
    filters.region !== "all" ||
    filters.date !== "all";

  return (
    <aside className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-warm text-ink">
            <IconFilter className="h-4 w-4" />
          </span>
          <h2 className="font-display text-sm font-extrabold tracking-tight text-ink">Filter profile</h2>
        </div>
        {hasCustom && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-faint transition-colors duration-200 hover:bg-surface-warm hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search team or league…"
          className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-9 text-sm text-ink placeholder:text-ink-faint transition-colors duration-200 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onChange({ search: "" })}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-warm hover:text-ink"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Region</span>
          <select
            value={filters.region}
            onChange={(e) => onChange({ region: e.target.value })}
            className="h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors duration-200 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10"
          >
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All regions" : r}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Match day</span>
          <div className="relative">
            <IconCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <select
              value={filters.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="h-11 w-full appearance-none rounded-xl border border-line bg-surface pl-9 pr-3 text-sm font-medium text-ink transition-colors duration-200 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label} · {d.count}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <hr className="border-line" />

      {/* Sweet spot odds range */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Sweet-spot odds band</span>
          <span className="text-xs font-bold text-accent">Home &quot;1&quot; only</span>
        </div>
        <DualRangeSlider
          min={1.1}
          max={1.79}
          step={0.01}
          values={[filters.sweetSpotMin, filters.sweetSpotMax]}
          onChange={([a, b]) => onChange({ sweetSpotMin: a, sweetSpotMax: b })}
          formatLabel={(v) => formatOdds(v)}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          Matches inside this band become <span className="font-semibold text-accent">sweet-spot eligible</span> —
          highlighted in the pool and shortlisted.
        </p>
      </div>

      <hr className="border-line" />

      {/* Min sentiment */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Minimum sentiment</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink tabular">{filters.minSentiment}%</span>
        </div>
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
          <div
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent/70"
            style={{ width: `${filters.minSentiment}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={filters.minSentiment}
            onChange={(e) => onChange({ minSentiment: Number(e.target.value) })}
            aria-label="Minimum sentiment score threshold"
            className="z-20! pointer-events-auto!"
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-faint tabular">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <hr className="border-line" />

      {/* Horizon */}
      <div>
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Time horizon</span>
        <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-surface-warm p-1.5">
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ horizonHours: h })}
              className={`h-9 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                filters.horizonHours === h
                  ? "bg-ink text-canvas shadow-sm"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Live counters */}
      <div className="mt-auto space-y-2 rounded-xl border border-line/80 bg-surface p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink-soft">
            <IconHome className="h-3.5 w-3.5 text-ink-soft" /> Upcoming (odds &lt; 1.80)
          </span>
          <span className="font-bold text-ink tabular">{total}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink-soft">
            <IconTarget className="h-3.5 w-3.5 text-accent" /> Sweet spot
          </span>
          <span className="font-bold text-accent tabular">{sweet}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink-soft">
            <IconBell className="h-3.5 w-3.5 text-ink-soft" /> High sentiment
          </span>
          <span className="font-bold text-ink tabular">{high}</span>
        </div>
      </div>
    </aside>
  );
}