import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FixtureWithSentiment } from "@/lib/types";
import { isSweetSpot } from "@/lib/sentiment";
import { formatKickoff, formatRelativeDelay } from "@/lib/eat";
import LeagueMark from "./LeagueMark";
import SentimentGauge from "./SentimentGauge";
import VerdictBadge from "./VerdictBadge";
import OddsChips from "./OddsChips";
import QueryAIButton, { type QueryAiState } from "./QueryAIButton";
import AnalysisDetail from "./AnalysisDetail";
import { IconGlobe, IconHome } from "./icons";

type SortMode = "kickoff" | "sentiment";

function PoolRow({
  match,
  sweetMin,
  sweetMax,
  aiState,
  onQueryAi,
  defaultOpen,
}: {
  match: FixtureWithSentiment;
  sweetMin: number;
  sweetMax: number;
  aiState: QueryAiState;
  onQueryAi: () => void;
  defaultOpen: boolean;
}) {
  const isDone = aiState === "done";
  const [manual, setManual] = useState(defaultOpen);
  const [dismissed, setDismissed] = useState(false);
  const open = isDone ? !dismissed : manual;
  const onToggle = () => {
    if (isDone) setDismissed((v) => !v);
    else setManual((v) => !v);
  };
  const sweet = isSweetSpot(match, sweetMin, sweetMax);
  const homeHighlight = sweet ? "text-accent" : "text-ink";
  const rowSpark = sweet ? "bg-accent/8" : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={rowSpark}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-1 items-center gap-x-6 gap-y-3 px-5 py-4 text-left transition-colors duration-200 hover:bg-surface/70 sm:grid-cols-[1.5fr_1.1fr_1.4fr_auto] lg:grid-cols-[1.5fr_1.1fr_1.4fr_auto_auto] lg:px-6"
        aria-expanded={open}
      >
        {/* League */}
        <div className="flex items-center gap-3">
          <LeagueMark league={match} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-bold tracking-tight text-ink">{match.league}</p>
            <p className="flex items-center gap-1 text-[10.5px] font-medium text-ink-faint">
              <IconGlobe className="h-3 w-3" /> {match.region}
            </p>
          </div>
        </div>

        {/* Kickoff */}
        <div className="leading-tight">
          <p className="text-[12.5px] font-bold text-ink-soft tabular">{formatKickoff(match.commenceTimeEpoch)}</p>
          <p className="text-[10.5px] font-medium text-ink-faint tabular">
            {formatRelativeDelay(match.commenceTimeEpoch)}
          </p>
        </div>

        {/* Matchup */}
        <div className="min-w-0">
          <p className={`flex items-center gap-1.5 truncate text-[13px] font-extrabold tracking-tight ${homeHighlight}`}>
            {sweet && <IconHome className="h-3.5 w-3.5 shrink-0 text-accent" />}
            <span className="truncate">{match.homeTeam}</span>
            {sweet && (
              <span className="rounded bg-accent/10 px-1 text-[9px] font-bold uppercase tracking-wider text-accent">1</span>
            )}
          </p>
          <p className="mt-0.5 truncate pl-2 text-[11px] text-ink-soft">
            <span className="mr-1.5 text-[10px] uppercase tracking-widest text-ink-faint">vs</span>
            {match.awayTeam}
          </p>
        </div>

        {/* Odds */}
        <div className="flex items-center justify-between gap-4">
          <OddsChips match={match} sweet={sweet} size="sm" />
          <span className="lg:hidden">
            <VerdictBadge verdict={match.sentiment.verdict} />
          </span>
        </div>

        {/* Sentiment */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <SentimentGauge score={match.sentiment.score} sweet={sweet} size="sm" />
          <div className="leading-tight">
            <p className={`text-sm font-extrabold tabular ${sweet ? "text-accent" : "text-ink"}`}>
              {match.sentiment.score}%
            </p>
            <VerdictBadge verdict={match.sentiment.verdict} />
          </div>
        </div>
      </button>

      {/* Action row */}
      <div className="flex items-center justify-between gap-3 px-6 pb-4 lg:px-6">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-ink-faint transition-colors duration-200 hover:bg-surface-warm hover:text-ink"
        >
          {open ? "Hide breakdown" : "Show breakdown"}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m9.5 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <div className="mx-6 mb-5 rounded-xl border border-line/80 bg-surface p-4">
              <AnalysisDetail match={match} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FixturesTable({
  matches,
  sweetMin,
  sweetMax,
  aiStates,
  onQueryAi,
}: {
  matches: FixtureWithSentiment[];
  sweetMin: number;
  sweetMax: number;
  aiStates: Record<string, QueryAiState>;
  onQueryAi: (m: FixtureWithSentiment) => void;
}) {
  const [sort, setSort] = useState<SortMode>("kickoff");

  const sorted = useMemo(() => {
    const arr = [...matches];
    if (sort === "sentiment") {
      arr.sort((a, b) => b.sentiment.score - a.sentiment.score || a.commenceTimeEpoch - b.commenceTimeEpoch);
    } else {
      arr.sort((a, b) => a.commenceTimeEpoch - b.commenceTimeEpoch);
    }
    return arr;
  }, [matches, sort]);

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface/55 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-1 pt-5 lg:px-6">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Global Fixtures Pool
          </h2>
          <p className="text-xs text-ink-faint">
            Home-odds &lt; 1.80 · filtered to your profile ·{" "}
            <span className="font-semibold text-ink-soft">{sorted.length}</span> listed
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-surface-warm p-1">
          {(["kickoff", "sentiment"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSort(m)}
              className={`rounded-lg px-3 py-1.5 text-[11.5px] font-semibold capitalize transition-all duration-200 ${
                sort === m ? "bg-ink text-canvas shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              {m === "kickoff" ? "Upcoming" : "By sentiment"}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-[1.5fr_1.1fr_1.4fr_auto_auto] gap-x-6 border-b border-line px-6 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
        <span>League</span>
        <span>Kick-off · EAT</span>
        <span>Matchup</span>
        <span>1X2 market</span>
        <span>Sentiment</span>
      </div>

      <div className="divide-y divide-line/70">
        <AnimatePresence initial={false} mode="popLayout">
          {sorted.map((m) => (
            <PoolRow
              key={m.id}
              match={m}
              sweetMin={sweetMin}
              sweetMax={sweetMax}
              aiState={aiStates[m.id] ?? "idle"}
              onQueryAi={() => onQueryAi(m)}
              defaultOpen={false}
            />
          ))}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-sm font-bold text-ink">No fixtures match your profile</p>
            <p className="mt-1 max-w-sm text-xs text-ink-faint">
              Try widening the sentiment threshold, extending the horizon, or clearing the search and region filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}