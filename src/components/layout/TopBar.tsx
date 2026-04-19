import { useLocation, useNavigate } from "@tanstack/react-router";
import { mainNavItems, settingsNavItem } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const allItems = [...mainNavItems, settingsNavItem];

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const current = allItems.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to)
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("התנתקת בהצלחה");
      navigate({ to: "/login" });
    } catch {
      toast.error("שגיאה בהתנתקות");
    }
  };

  return (
    <header role="banner" className="border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0 safe-area-top gap-3" style={{ minHeight: "3.5rem" }}>
      <h1 className="text-lg font-bold">
        {current?.label ?? "My Life"}
      </h1>
      {user && (
        <button
          onClick={handleSignOut}
          aria-label="יציאה מהמערכת"
          title="יציאה מהמערכת"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">יציאה</span>
        </button>
      )}
    </header>
  );
}
