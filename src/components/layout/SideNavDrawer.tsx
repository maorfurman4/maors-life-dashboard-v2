import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { X, Settings, LogOut } from "lucide-react";
import { mainNavItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ICON_BG: Record<string, string> = {
  home:      "bg-white/15",
  sport:     "bg-sport/20",
  nutrition: "bg-nutrition/20",
  finance:   "bg-finance/20",
  work:      "bg-work/20",
};

const ACTIVE_ROW: Record<string, string> = {
  home:      "bg-white/8 border-white/10",
  sport:     "bg-sport/10 border-sport/20",
  nutrition: "bg-nutrition/10 border-nutrition/20",
  finance:   "bg-finance/10 border-finance/20",
  work:      "bg-work/10 border-work/20",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "בוקר טוב";
  if (h >= 12 && h < 17) return "צהריים טובים";
  if (h >= 17 && h < 21) return "ערב טוב";
  return "לילה טוב";
}

interface SideNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideNavDrawer({ open, onClose }: SideNavDrawerProps) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile }  = useProfile();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("התנתקת בהצלחה");
      onClose();
      navigate({ to: "/login" });
    } catch {
      toast.error("שגיאה בהתנתקות");
    }
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "אורח";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel — slides from right (RTL start side) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
        dir="rtl"
        className={cn(
          "md:hidden fixed top-0 right-0 h-screen w-full z-[51] flex flex-col",
          "bg-[#080b12]/95 backdrop-blur-xl border-l border-white/5",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ── */}
        <div className="safe-area-top flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/15 flex items-center justify-center text-white font-black text-lg shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] text-white/40 font-medium">{getGreeting()}</p>
              <p className="text-base font-black text-white leading-tight">{firstName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור תפריט"
            className="h-9 w-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Nav Items ── */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all min-h-[60px]",
                  active
                    ? `${ACTIVE_ROW[item.id] ?? "bg-white/8 border-white/10"} ${item.colorClass}`
                    : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  active ? (ICON_BG[item.id] ?? "bg-white/10") : "bg-white/5"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">{item.label}</span>
                {active && (
                  <div className="mr-auto h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="safe-area-bottom px-4 pt-4 pb-8 border-t border-white/8 space-y-1">
          <Link
            to="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all min-h-[52px]",
              isActive("/settings")
                ? "bg-white/8 border-white/10 text-white"
                : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-base font-bold">הגדרות</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-transparent transition-all text-red-400/60 hover:text-red-400 hover:bg-red-500/8 min-h-[52px]"
          >
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-base font-bold">יציאה</span>
          </button>
        </div>
      </div>
    </>
  );
}
