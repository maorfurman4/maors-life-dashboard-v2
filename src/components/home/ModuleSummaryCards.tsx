import { Link } from "@tanstack/react-router";
import {
  Dumbbell,
  Apple,
  Wallet,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

interface ModuleCard {
  label: string;
  to: "/" | "/sport" | "/nutrition" | "/finance" | "/market" | "/work";
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  emptyText: string;
}

const cards: ModuleCard[] = [
  { label: "ספורט", to: "/sport", icon: Dumbbell, colorClass: "text-sport", bgClass: "bg-sport/10", emptyText: "אין אימונים עדיין" },
  { label: "תזונה", to: "/nutrition", icon: Apple, colorClass: "text-nutrition", bgClass: "bg-nutrition/10", emptyText: "אין ארוחות עדיין" },
  { label: "כלכלה", to: "/finance", icon: Wallet, colorClass: "text-finance", bgClass: "bg-finance/10", emptyText: "אין נתונים עדיין" },
  { label: "שוק ההון", to: "/market", icon: TrendingUp, colorClass: "text-market", bgClass: "bg-market/10", emptyText: "אין פוזיציות עדיין" },
  { label: "עבודה", to: "/work", icon: Briefcase, colorClass: "text-work", bgClass: "bg-work/10", emptyText: "אין משמרות עדיין" },
];

export function ModuleSummaryCards() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">סיכום מודולים</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group rounded-xl border border-border bg-card p-4 hover:border-muted-foreground/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg ${c.bgClass} flex items-center justify-center`}>
                  <c.icon className={`h-4 w-4 ${c.colorClass}`} />
                </div>
                <span className="text-sm font-bold">{c.label}</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-[11px] text-muted-foreground">{c.emptyText}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
