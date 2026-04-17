import { Wallet } from "lucide-react";
import { useFinanceSettings, useSaveFinanceSettings } from "@/hooks/use-finance-data";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function SettingsFinance() {
  const { data: settings } = useFinanceSettings();
  const save = useSaveFinanceSettings();
  const [savingsGoal, setSavingsGoal] = useState("35");
  const [syncMode, setSyncMode] = useState<"net" | "bank">("net");

  useEffect(() => {
    if (settings) {
      setSavingsGoal(String(settings.savings_goal_pct));
      setSyncMode(settings.income_sync_mode);
    }
  }, [settings]);

  const handleSave = () => {
    const pct = parseFloat(savingsGoal);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("יעד חיסכון חייב להיות בין 0 ל-100");
      return;
    }
    save.mutate(
      { savings_goal_pct: pct, income_sync_mode: syncMode },
      {
        onSuccess: () => toast.success("הגדרות כלכלה נשמרו"),
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold">כלכלה</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">יעד חיסכון</label>
            <span className="text-sm font-bold text-finance">{savingsGoal}%</span>
          </div>
          <input
            type="range" min="0" max="60" step="1"
            value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)}
            className="w-full accent-finance"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">סנכרון שכר מעבודה</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSyncMode("net")}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                syncMode === "net" ? "border-finance bg-finance/10 text-finance" : "border-border text-foreground"
              }`}>
              נטו
            </button>
            <button onClick={() => setSyncMode("bank")}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                syncMode === "bank" ? "border-finance bg-finance/10 text-finance" : "border-border text-foreground"
              }`}>
              סכום בבנק
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">בחר מה ייכנס כהכנסה מהעבודה במודול הכלכלה</p>
        </div>

        <button onClick={handleSave} disabled={save.isPending}
          className="w-full py-2.5 rounded-xl bg-finance/15 text-finance font-medium text-sm hover:bg-finance/25 transition-colors disabled:opacity-50 min-h-[44px]">
          {save.isPending ? "שומר..." : "שמור הגדרות כלכלה"}
        </button>
      </div>
    </div>
  );
}
