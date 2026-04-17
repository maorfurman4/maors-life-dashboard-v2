import {
  Dumbbell,
  Apple,
  Wallet,
  TrendingUp,
  Briefcase,
} from "lucide-react";

const modules = [
  { label: "ספורט", score: 0, icon: Dumbbell, colorClass: "text-sport", bgClass: "bg-sport/10" },
  { label: "תזונה", score: 0, icon: Apple, colorClass: "text-nutrition", bgClass: "bg-nutrition/10" },
  { label: "כלכלה", score: 0, icon: Wallet, colorClass: "text-finance", bgClass: "bg-finance/10" },
  { label: "שוק ההון", score: 0, icon: TrendingUp, colorClass: "text-market", bgClass: "bg-market/10" },
  { label: "עבודה", score: 0, icon: Briefcase, colorClass: "text-work", bgClass: "bg-work/10" },
];

const overallScore = 0;

function getScoreColor(score: number) {
  if (score >= 80) return "text-sport";
  if (score >= 60) return "text-finance";
  return "text-muted-foreground";
}

export function BalanceCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-border" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className={getScoreColor(overallScore)} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${overallScore * 2.64} 264`} />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xl font-black ${getScoreColor(overallScore)}`}>
            {overallScore}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold">ציון איזון כללי</h3>
          <p className="text-xs text-muted-foreground mt-0.5">התחל להזין נתונים כדי לקבל ציון</p>
        </div>
      </div>

      <div className="grid gap-2.5">
        {modules.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className={`h-7 w-7 rounded-lg ${m.bgClass} flex items-center justify-center shrink-0`}>
              <m.icon className={`h-3.5 w-3.5 ${m.colorClass}`} />
            </div>
            <span className="text-xs font-medium w-16 shrink-0">{m.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div className={`h-full rounded-full ${m.colorClass.replace("text-", "bg-")}`} style={{ width: `${m.score}%` }} />
            </div>
            <span className="text-xs font-bold w-7 text-left text-muted-foreground">—</span>
          </div>
        ))}
      </div>
    </div>
  );
}
