import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatClock } from "@/lib/eat";
import type { PoolDataSource } from "@/lib/types";
import { IconGlobe, IconRefresh, IconSpark } from "./icons";

function StatusDot({ on, label, title }: { on: boolean; label: string; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-ink-soft"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-accent animate-soft-pulse" : "bg-ink-faint"}`} />
      {label}
    </span>
  );
}

export default function Header({
  refreshing,
  onRefresh,
  dataSource,
  oddsConfigured,
  geminiConfigured,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  dataSource: PoolDataSource;
  oddsConfigured: boolean;
  geminiConfigured: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3.5 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-canvas shadow-sm">
            <IconSpark className="h-5 w-5 text-accent-mist" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-canvas bg-accent" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-[17px] font-extrabold tracking-tight text-ink">
              Home Advantage
              <span className="mx-1.5 text-ink-faint">·</span>
              <span className="text-accent">Sweet-Spot Analytics</span>
            </h1>
            <p className="hidden text-[11px] font-medium text-ink-faint sm:block">
              Home-win sentiment indices · odds-filtered global fixtures · Eastern African Time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <StatusDot
            on={oddsConfigured}
            label={
              dataSource === "api-football"
                ? "API-Football odds"
                : dataSource === "odds-api"
                  ? "Live bookmaker odds"
                  : "Simulated pool"
            }
            title={
              dataSource === "api-football"
                ? "Live 1X2 odds streaming via API-Football free tier"
                : dataSource === "odds-api"
                  ? "Connected to The Odds API"
                  : "No odds key configured — running on realistic simulated fixtures"
            }
          />
          <StatusDot on={geminiConfigured} label="Gemini" title={geminiConfigured ? "Gemini AI ready" : "No GEMINI_API_KEY — using the seeded sentiment model"} />
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold text-ink-soft tabular sm:inline-flex">
            <IconGlobe className="h-3.5 w-3.5 text-accent" />
            EAT {formatClock(now)}
          </div>
          <motion.button
            type="button"
            onClick={onRefresh}
            whileTap={{ scale: 0.94 }}
            title="Refresh fixtures"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors duration-200 hover:border-ink/30 hover:text-ink disabled:opacity-50"
          >
            <IconRefresh className={`h-4.5 w-4.5 ${refreshing ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </div>
    </header>
  );
}