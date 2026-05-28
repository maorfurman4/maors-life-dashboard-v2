import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWeekWorkouts } from "@/hooks/use-sport-data";
import { useExpenseEntries } from "@/hooks/use-finance-data";

function getWeekDateRange(): { year: number; month: number; startDate: string; endDate: string } {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    startDate: fmt(startOfWeek),
    endDate: fmt(now),
  };
}

export function WeeklyAIBrief() {
  const isSunday = new Date().getDay() === 0;
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const { user } = useAuth();
  const { year, month } = getWeekDateRange();
  const { data: weekWorkouts } = useWeekWorkouts();
  const { data: weekExpenseEntries } = useExpenseEntries(year, month);

  if (!isSunday) return null;

  const weekExpenses = (weekExpenseEntries ?? []).reduce(
    (sum: number, e: { amount: number }) => sum + Number(e.amount),
    0
  );
  const workoutCount = (weekWorkouts ?? []).length;

  async function fetchBrief() {
    if (!user) return;
    setLoading(true);
    try {
      const userName =
        user.user_metadata?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "";

      const { data, error } = await supabase.functions.invoke("weekly-brief-ai", {
        body: {
          userId: user.id,
          weekExpenses,
          weekWorkouts: workoutCount,
          weekCalories: 0,
          weekBalance: -weekExpenses,
          userName,
        },
      });

      if (error) throw error;
      const result = data as { insights?: string[] };
      setInsights(result.insights ?? []);
      setFetched(true);
    } catch {
      setInsights(["😔 לא ניתן לטעון תובנות כרגע, נסה מאוחר יותר"]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-4 mb-4"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
      }}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-white">📊 תקציר השבוע</h2>
        <button
          onClick={fetchBrief}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          עדכן
        </button>
      </div>

      {!fetched && !loading && (
        <p className="text-xs text-white/40 text-center py-2">
          לחץ על "עדכן" לקבלת תובנות שבועיות
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 rounded-full animate-pulse"
              style={{
                background: "rgba(255,255,255,0.08)",
                width: `${70 + i * 8}%`,
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {!loading && insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="text-sm text-white/85 leading-relaxed"
              >
                {insight}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
