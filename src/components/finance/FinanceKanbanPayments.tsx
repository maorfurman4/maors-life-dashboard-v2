import { CalendarDays, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useFixedExpenses } from "@/hooks/use-finance-data";
import { ILS } from "@/lib/finance-utils";

type Column = "upcoming" | "this_week" | "paid";

interface KanbanItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  charge_day: number;
  column: Column;
}

function getColumn(chargeDay: number): Column {
  const today = new Date().getDate();
  const daysLeft = chargeDay >= today ? chargeDay - today : 31 - today + chargeDay;
  if (daysLeft === 0) return "paid";
  if (daysLeft <= 7) return "this_week";
  return "upcoming";
}

const COLUMN_META: Record<Column, { label: string; icon: typeof CalendarDays; color: string }> = {
  paid:      { label: "שולם",       icon: CheckCircle2,  color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  this_week: { label: "השבוע",      icon: AlertCircle,   color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
  upcoming:  { label: "הבא",        icon: Clock,         color: "text-muted-foreground border-border bg-secondary/20" },
};

export function FinanceKanbanPayments() {
  const { data: fixed } = useFixedExpenses();
  const active = (fixed || []).filter((f: any) => f.is_active);

  const columns: Record<Column, KanbanItem[]> = { paid: [], this_week: [], upcoming: [] };
  active.forEach((f: any) => {
    const col = getColumn(f.charge_day);
    columns[col].push({ id: f.id, name: f.name, amount: Number(f.amount), category: f.category, charge_day: f.charge_day, column: col });
  });

  const totalUpcoming = [...columns.this_week, ...columns.upcoming].reduce((s, i) => s + i.amount, 0);

  if (active.length === 0) return null;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground" style={{ letterSpacing: 0 }}>
          תשלומים קרובים
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {ILS(totalUpcoming)} לשלם
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["paid", "this_week", "upcoming"] as Column[]).map((col) => {
          const meta = COLUMN_META[col];
          const Icon = meta.icon;
          const items = columns[col];
          return (
            <div key={col} className={`rounded-xl border p-3 space-y-2 min-h-[80px] ${meta.color}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">{meta.label}</span>
                <span className="text-[10px] opacity-60 ms-auto">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-[10px] opacity-40 text-center py-2">ריק</p>
              ) : (
                <div className="space-y-1.5">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <p className="text-[11px] font-semibold leading-tight truncate">{item.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] opacity-60">יום {item.charge_day}</span>
                        <span className="text-[11px] font-bold" dir="ltr">{ILS(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="text-[10px] opacity-50 text-center">+{items.length - 4} עוד</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
