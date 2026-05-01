import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { X, Settings, LogOut } from "lucide-react";
import { mainNavItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


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
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {mainNavItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "relative h-28 w-full rounded-[24px] overflow-hidden block",
                  "border-2 transition-all duration-200",
                  active
                    ? "border-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                    : "border-white/0 hover:border-white/15"
                )}
              >
                {/* Background image */}
                {item.bgImage && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.bgImage})` }}
                  />
                )}
                {/* Glass overlay */}
                <div className={cn(
                  "absolute inset-0 backdrop-blur-md",
                  item.bgImage ? "bg-black/55" : "bg-white/6"
                )} />
                {/* Content */}
                <div className="relative z-10 flex items-center justify-between p-5 h-full">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                      <item.icon className={cn("h-6 w-6", item.colorClass)} />
                    </div>
                    <span className="text-xl font-black text-white">{item.label}</span>
                  </div>
                  {active && (
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                  )}
                </div>
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
