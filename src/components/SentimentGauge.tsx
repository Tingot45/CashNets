import { motion } from "framer-motion";

export function scoreTone(score: number, sweet: boolean) {
  const base = sweet
    ? { stroke: "#047857", soft: "#d7f0e3", text: "text-accent" }
    : score >= 75
      ? { stroke: "#57534e", soft: "#ece7dd", text: "text-ink-soft" }
      : score >= 60
        ? { stroke: "#a16207", soft: "#fef3c7", text: "text-amber-deep" }
        : { stroke: "#b45309", soft: "#fee2d5", text: "text-amber-deep" };
  return base;
}

export default function SentimentGauge({
  score,
  sweet = false,
  size = "md",
  animated = true,
  withLabel = true,
}: {
  score: number;
  sweet?: boolean;
  size?: "sm" | "md";
  animated?: boolean;
  withLabel?: boolean;
}) {
  const dims = size === "sm" ? { size: 38, stroke: 4 } : { size: 56, stroke: 5 };
  const r = (dims.size - dims.stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const tone = scoreTone(pct, sweet);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dims.size, height: dims.size }}>
      <svg width={dims.size} height={dims.size} className="-rotate-90">
        <circle cx={dims.size / 2} cy={dims.size / 2} r={r} fill="none" stroke={tone.soft} strokeWidth={dims.stroke} />
        <motion.circle
          cx={dims.size / 2}
          cy={dims.size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={dims.stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: animated ? circ - (circ * pct) / 100 : circ - (circ * pct) / 100 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {withLabel && (
        <span className={`absolute inset-0 flex items-center justify-center font-bold tabular ${tone.text} ${size === "sm" ? "text-[10px]" : "text-[12px]"}`}>
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}