import { useLocation } from "@tanstack/react-router";
import { mainNavItems, settingsNavItem } from "@/lib/navigation";
import { Menu } from "lucide-react";

const allItems = [...mainNavItems, settingsNavItem];

interface TopBarProps {
  onMenuOpen: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const location = useLocation();

  const current = allItems.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to)
  );

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 relative shrink-0 border-none"
      style={{
        minHeight: "4.5rem",
        paddingTop: "env(safe-area-inset-top, 0.5rem)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Page title — centered in the visible area below safe-area */}
      <h1
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xl font-black text-white pointer-events-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
        style={{ bottom: "0.75rem" }}
      >
        {current?.displayLabel ?? current?.label ?? ""}
      </h1>

      {/* Hamburger — top-right corner, just below safe-area, mobile only */}
      <button
        onClick={onMenuOpen}
        aria-label="פתח תפריט"
        className="md:hidden absolute end-4 h-9 w-9 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/18 transition-colors z-10"
        style={{ top: "calc(env(safe-area-inset-top, 0.5rem) + 4px)" }}
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}
