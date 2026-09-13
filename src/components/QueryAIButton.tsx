import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconBrain, IconCheck, IconClose } from "./icons";

const LOADING_STEPS = [
  "Reading fan threads…",
  "Scanning injury desk…",
  "Pooling local volumes…",
  "Weighting home form…",
  "Compiling verdict…",
];

export type QueryAiState = "idle" | "loading" | "done" | "error";

export default function QueryAIButton({
  state,
  onClick,
  label = "Query AI",
  compact = false,
}: {
  state: QueryAiState;
  onClick: () => void;
  label?: string;
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (state !== "loading") return;
    const id = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 950);
    return () => clearInterval(id);
  }, [state]);

  const dims = compact ? "h-9 px-3 text-[11px]" : "h-11 px-4 text-xs";

  return (
    <motion.button
      type="button"
      whileTap={state === "idle" ? { scale: 0.97 } : undefined}
      onClick={onClick}
      disabled={state === "loading"}
      className={`${dims} group inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap transition-colors duration-200 ${
        state === "done"
          ? "bg-accent text-white"
          : state === "error"
            ? "bg-amber-deep text-white"
            : "border border-line bg-surface text-ink hover:border-ink/30 hover:bg-surface-warm"
      } disabled:cursor-wait`}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <span className="flex items-center gap-[3px]">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
            <span className="max-w-[130px] truncate text-ink-soft">{LOADING_STEPS[step]}</span>
          </motion.span>
        ) : state === "done" ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <IconCheck className="h-3.5 w-3.5" />
            Gemini verdict
          </motion.span>
        ) : state === "error" ? (
          <motion.span
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <IconClose className="h-3.5 w-3.5" />
            Retry AI
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <IconBrain className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}