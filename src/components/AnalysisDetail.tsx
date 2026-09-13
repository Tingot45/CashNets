import type { FixtureWithSentiment } from "@/lib/types";
import { IconBrain, IconCheck, IconSpark } from "./icons";

export default function AnalysisDetail({ match }: { match: FixtureWithSentiment }) {
  const s = match.sentiment;
  const live = s.source === "live-ai";
  return (
    <div className="animate-fade-in">
      <p className="border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-ink-soft">{s.summary}</p>

      <div className="mt-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Model reasoning</h4>
        <ul className="mt-2 space-y-2">
          {s.reasoning.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Catalysts & tipping points</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.catalysts.map((c, i) => (
            <span key={i} className="rounded-full bg-surface-warm px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          {live ? (
            <>
              <IconSpark className="h-3.5 w-3.5 text-accent" /> Live Gemini analysis
            </>
          ) : (
            <>
              <IconBrain className="h-3.5 w-3.5 text-ink-soft" /> Seeded model{s.fallback ? " (fallback)" : ""}
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconCheck className="h-3.5 w-3.5" />
          Analyst confidence
          <span className="font-bold text-ink tabular">{Math.round(s.confidence * 100)}%</span>
        </span>
        <span className="tabular">{new Date(s.generatedAt).toLocaleString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" })} EAT</span>
      </div>
    </div>
  );
}