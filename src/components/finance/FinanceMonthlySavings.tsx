import { useMemo } from "react";
import { BadgePercent, TrendingDown } from "lucide-react";
import { useCoupons } from "@/hooks/use-coupons";

export function FinanceMonthlySavings() {
  const { data: coupons } = useCoupons();

  const { savedAmount, savedCount } = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const usedThisMonth = (coupons || []).filter(
      (c: any) => c.is_used && c.used_at && c.used_at >= start
    );

    const savedAmount = usedThisMonth.reduce(
      (sum: number, c: any) => sum + (c.discount_amount ?? 0),
      0
    );

    return { savedAmount, savedCount: usedThisMonth.length };
  }, [coupons]);

  if (!coupons || savedCount === 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
            <BadgePercent className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>חיסכון בקופונים החודש</h3>
            <p className="text-[10px] text-muted-foreground">{savedCount} קופונים מומשו</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400" dir="ltr">
              ₪{savedAmount.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">חסכת החודש</p>
        </div>
      </div>
    </div>
  );
}
