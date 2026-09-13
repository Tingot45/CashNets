import { clamp } from "@/lib/eat";

export default function DualRangeSlider({
  min,
  max,
  step,
  values,
  onChange,
  formatLabel,
}: {
  min: number;
  max: number;
  step: number;
  values: [number, number];
  onChange: (vals: [number, number]) => void;
  formatLabel: (v: number) => string;
}) {
  const span = max - min;
  const leftPct = ((values[0] - min) / span) * 100;
  const rightPct = ((values[1] - min) / span) * 100;

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent/70"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={values[0]}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), min, values[1]);
            onChange([v, values[1]]);
          }}
          className="z-20"
          aria-label={`Lower odds bound: ${formatLabel(values[0])}`}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={values[1]}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), values[0], max);
            onChange([values[0], v]);
          }}
          className="z-30"
          aria-label={`Upper odds bound: ${formatLabel(values[1])}`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-ink-faint tabular">
        <span>{formatLabel(values[0])}</span>
        <span className="rounded-md bg-surface-warm px-1.5 py-0.5 text-ink-soft">
          {formatLabel(values[0])} – {formatLabel(values[1])}
        </span>
        <span>{formatLabel(values[1])}</span>
      </div>
    </div>
  );
}