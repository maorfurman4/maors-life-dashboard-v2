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
    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-widest">כלכלה</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/50">יעד חיסכון</label>
            <span className="text-sm font-bold text-white">{savingsGoal}%</span>
          </div>
          <input type="range" min="0" max="60" step="1"
            value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)}
            className="w-full accent-white" />
        </div>

        <div>
          <label className="text-xs font-medium text-white/50 mb-2 block">סנכרון שכר מעבודה</label>
          <div className="grid grid-cols-2 gap-2">
            {(["net", "bank"] as const).map((mode) => (
              <button key={mode} onClick={() => setSyncMode(mode)}
                className={`px-3 py-2.5 rounded-none border text-xs font-semibold transition-colors min-h-[44px] ${
                  syncMode === mode
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}>
                {mode === "net" ? "נטו" : "סכום בבנק"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-1">בחר מה ייכנס כהכנסה מהעבודה במודול הכלכלה</p>
        </div>

        <button onClick={handleSave} disabled={save.isPending}
          className="w-full py-2.5 rounded-none bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 min-h-[44px]">
          {save.isPending ? "שומר..." : "שמור הגדרות כלכלה"}
        </button>
      </div>
    </div>
  );
}
