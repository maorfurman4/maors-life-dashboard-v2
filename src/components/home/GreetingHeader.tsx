import { useAuth } from "@/hooks/use-auth";
import { CalendarDays } from "lucide-react";

export function GreetingHeader() {
  const { user } = useAuth();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  const name = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-black">{greeting}{name ? `, ${name}` : ""} 👋</h1>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
