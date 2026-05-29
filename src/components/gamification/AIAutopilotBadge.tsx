import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * AIAutopilotBadge — shown in XPBar when the user has logged
 * their first expense via the Telegram AI bot (ai_autopilot_first achievement).
 */
export function AIAutopilotBadge() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: hasAchievement } = useQuery({
    queryKey: ["achievement-ai-autopilot", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_key", "ai_autopilot_first")
        .maybeSingle();
      return !!data;
    },
  });

  if (!hasAchievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5"
      title="AI Autopilot — הוצאות נרשמות אוטומטית!"
    >
      <span className="text-xs leading-none">🤖</span>
      <span className="text-[10px] font-medium text-indigo-300 hidden sm:block">Autopilot</span>
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"
      />
    </motion.div>
  );
}
