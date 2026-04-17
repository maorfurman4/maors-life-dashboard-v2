import { CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function GreetingHeader() {
  const { user } = useAuth();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const metadata = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    first_name?: string;
  };
  const displayName =
    metadata.full_name?.split(" ")[0] ||
    metadata.first_name ||
    metadata.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";

  const greetingText = displayName ? `${greeting}, ${displayName}` : greeting;

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-black">{greetingText} 👋</h1>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
