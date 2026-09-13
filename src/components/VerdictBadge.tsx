import type { SentimentVerdict } from "@/lib/types";
import { IconFlame, IconShield, IconTrendUp } from "./icons";

const CONFIG: Record<SentimentVerdict, { cls: string; label: string; icon: typeof IconShield }> = {
  "Value Gem": { cls: "bg-accent text-white", label: "Value Gem", icon: IconFlame },
  "Safe Bet": { cls: "bg-stone-900 text-white", label: "Safe Bet", icon: IconShield },
  Caution: { cls: "bg-amber-soft text-amber-deep", label: "Caution", icon: IconTrendUp },
};

export default function VerdictBadge({ verdict, size = "sm" }: { verdict: SentimentVerdict; size?: "sm" | "md" }) {
  const c = CONFIG[verdict] ?? CONFIG.Caution;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-tight whitespace-nowrap ${
        size === "sm" ? "px-2.5 py-1 text-[10.5px]" : "px-3 py-1.5 text-xs"
      } ${c.cls}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}