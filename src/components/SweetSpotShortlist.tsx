import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FixtureWithSentiment } from "@/lib/types";
import { formatKickoff, formatRelativeDelay } from "@/lib/eat";
import LeagueMark from "./LeagueMark";
import SentimentGauge from "./SentimentGauge";
import VerdictBadge from "./VerdictBadge";
import OddsChips from "./OddsChips";
import QueryAIButton, { type QueryAiState } from "./QueryAIButton";
import AnalysisDetail from "./AnalysisDetail";
import { IconChevronLeft, IconChevronRight, IconGlobe, IconHome } from "./icons";

function rankTone(i: number) {
  if (i === 0) return "bg-ink text-canvas";
  if (i < 3) return "bg-accent text-white";
  return "bg-surface-warm text-ink-soft";
}

function ShortlistCard({
  match,
  rank,
  aiState,
  onQueryAi,
}: {
  match: FixtureWithSentiment;
  rank: number;
  aiState: QueryAiState;
  onQueryAi: () => void;
}) {
  const isDone = aiState === "done";
  const [manual, setManual] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = isDone ? !dismissed : manual;

  const onToggle = () => {
    if (isDone) setDismissed((v) => !v);
    else setManual((v) => !v);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-[340px] shrink-0 snap-start flex-col rounded-2xl border border-accent/25 bg-surface/85 p-4 shadow-[0_10px_30px_-18px_rgba(28,25,23,0.25)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`${rankTone(rank)} flex h-7 w-7 items-center justify-center rounded-lg font-display text-[11px] font-extrabold tabular`}>
            {String(rank + 1).padStart(2, "0")}
          </span>
          <LeagueMark league={match} size="sm" />
          <div className="leading-tight">
            <p className="text-[12.5px] font-bold tracking-tight text-ink">{match.league}</p>
            <p className="flex items-center gap-1 text-[10.5px] font-medium text-ink-faint">
              <IconGlobe className="h-3 w-3" /> {match.region}
            </p>
          </div>
        </div>
        <div className="text-right leading-tight">
          <p className="text-[11px] font-bold text-ink-soft tabular">{formatKickoff(match.commenceTimeEpoch)}</p>
          <p className="text-[10px] font-medium text-ink-faint tabular">
            {formatRelativeDelay(match.commenceTimeEpoch)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface-warm/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/12 text-accent">
            <IconHome className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-ink">{match.homeTeam}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Home win pick</p>
          </div>
        </div>
        <div className="my-1.5 ml-[34px] space-y-1 text-[11.5px] text-ink-soft">
          <span className="mr-2 text-ink-faint">vs</span>
          {match.awayTeam}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <OddsChips match={match} sweet size="md" />
        <div className="flex items-center gap-2">
          <SentimentGauge score={match.sentiment.score} sweet size="md" />
          <VerdictBadge verdict={match.sentiment.verdict} />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
        {match.sentiment.summary}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-ink-faint transition-colors duration-200 hover:bg-surface-warm hover:text-ink"
        >
          {open ? "Hide analysis" : "Breakdown"}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <IconChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </button>
        <QueryAIButton
          key={`${match.id}-${aiState}`}
          state={aiState}
          onClick={() => {
            setManual(true);
            setDismissed(false);
            onQueryAi();
          }}
          compact
          label="Query AI"
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <AnalysisDetail match={match} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function SweetSpotShortlist({
  matches,
  aiStates,
  onQueryAi,
}: {
  matches: FixtureWithSentiment[];
  aiStates: Record<string, QueryAiState>;
  onQueryAi: (m: FixtureWithSentiment) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface/55 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-5 lg:px-6">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            The Sweet-Spot Shortlist
            <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 align-middle text-[10.5px] font-bold uppercase tracking-wider text-accent">
              Top {matches.length}
            </span>
          </h2>
          <p className="text-xs text-ink-faint">
            Global curation · up to 2 per league · highest home-win sentiment across every federation
          </p>
        </div>
        {matches.length > 3 && (
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-all duration-200 hover:border-ink/30 hover:text-ink active:scale-95"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-all duration-200 hover:border-ink/30 hover:text-ink active:scale-95"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
          <p className="font-display text-sm font-bold text-ink">No sweet-spot candidates</p>
          <p className="mt-1 max-w-sm text-xs text-ink-faint">
            Widen the odds band or lower the sentiment threshold — the shortlist only surfaces home wins inside the sweet spot.
          </p>
        </div>
      ) : (
        <div className="thin-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-5 lg:px-6">
          {matches.map((m, i) => (
            <ShortlistCard
              key={m.id}
              match={m}
              rank={i}
              aiState={aiStates[m.id] ?? "idle"}
              onQueryAi={() => onQueryAi(m)}
            />
          ))}
        </div>
      )}
    </section>
  );
}