import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useFixedExpenses } from "@/hooks/use-finance-data";
import { ILS } from "@/lib/finance-utils";

interface TimelineItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  charge_day: number;
  status: "paid" | "this_week" | "upcoming";
}

function getStatus(chargeDay: number): TimelineItem["status"] {
  const today = new Date().getDate();
  const daysLeft = chargeDay >= today ? chargeDay - today : 31 - today + chargeDay;
  if (daysLeft === 0) return "paid";
  if (daysLeft <= 7) return "this_week";
  return "upcoming";
}

const STATUS_META = {
  paid:      { label: "שולם",    icon: CheckCircle2, color: "text-emerald-400", dot: "bg-emerald-400" },
  this_week: { label: "השבוע",   icon: AlertCircle,  color: "text-amber-400",   dot: "bg-amber-400"   },
  upcoming:  { label: "הבא",     icon: Clock,        color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

export function FinanceKanbanPayments() {
  const { data: fixed } = useFixedExpenses();
  const active = (fixed || []).filter((f: any) => f.is_active);

  if (active.length === 0) return null;

  const items: TimelineItem[] = active
    .map((f: any) => ({
      id: f.id,
      name: f.name,
      amount: Number(f.amount),
      category: f.category,
      charge_day: f.charge_day,
      status: getStatus(f.charge_day),
    }))
    .sort((a: TimelineItem, b: TimelineItem) => {
      const order = { paid: 0, this_week: 1, upcoming: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.charge_day - b.charge_day;
    });

  const totalUpcoming = items.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground">תשלומים קרובים</h3>
        <span className="text-[11px] text-muted-foreground">{ILS(totalUpcoming)} לשלם</span>
      </div>

      <div className="relative space-y-0">
        {/* vertical line */}
        <div className="absolute right-[7px] top-3 bottom-3 w-px bg-border/50" />

        {items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <div key={item.id} className="relative flex items-center gap-3 py-2.5 pe-6">
              {/* dot */}
              <div className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-background shrink-0 ${meta.dot}`} />
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.category} · יום {item.charge_day}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ms-2">
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${meta.color}`}>
                    <Icon className="h-2.5 w-2.5" />
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold" dir="ltr">{ILS(item.amount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
