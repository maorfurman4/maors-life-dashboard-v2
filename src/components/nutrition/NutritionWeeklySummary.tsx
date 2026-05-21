import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-sport-data";
import { Loader2 } from "lucide-react";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

function localDateStr(offsetDays = 0): string {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function useWeeklyStats(dailyGoal: number) {
  return useQuery({
    queryKey: ["nutrition-weekly-summary", dailyGoal],
    queryFn: async () => {
      const userId = await getUserId();
      const start = localDateStr(6);
      const end   = localDateStr(0);

      const { data, error } = await (supabase as any)
        .from("nutrition_entries")
        .select("date, calories, protein_g")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end);

      if (error) throw error;

      const byDay: Record<string, { cal: number; prot: number }> = {};
      for (const row of (data ?? []) as any[]) {
        const d = row.date as string;
        if (!byDay[d]) byDay[d] = { cal: 0, prot: 0 };
        byDay[d].cal  += (row.calories ?? 0);
        byDay[d].prot += (row.protein_g ?? 0);
      }

      const days = Object.values(byDay);
      if (days.length === 0) return { avgCal: 0, avgProt: 0, daysOnTarget: 0 };

      // Divide by 7 (full week), not just logged days — gives true weekly average
      const avgCal    = Math.round(days.reduce((s, d) => s + d.cal,  0) / 7);
      const avgProt   = Math.round(days.reduce((s, d) => s + d.prot, 0) / 7);
      const daysOnTarget = days.filter((d) => Math.abs(d.cal - dailyGoal) <= 200).length;

      return { avgCal, avgProt, daysOnTarget };
    },
    staleTime: 60_000,
  });
}

export function NutritionWeeklySummary() {
  const { data: userSettings } = useUserSettings();
  const dailyGoal = (userSettings as any)?.daily_calories_goal || 2000;
  const { data, isLoading } = useWeeklyStats(dailyGoal);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
      <p className="text-sm font-black text-white">סיכום שבועי 📊</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <span className="text-xs text-white/50">ממוצע קלורי</span>
            <span className="text-sm font-black text-emerald-400">
              {(data?.avgCal ?? 0).toLocaleString()} קל׳ / יום
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <span className="text-xs text-white/50">ממוצע חלבון</span>
            <span className="text-sm font-black text-blue-400">
              {data?.avgProt ?? 0}ג / יום
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <span className="text-xs text-white/50">ימי עמידה ביעד</span>
            <span className="text-sm font-black text-amber-400">
              {data?.daysOnTarget ?? 0} / 7
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
