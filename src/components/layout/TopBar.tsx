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
      className="sticky top-0 z-50 relative flex items-center shrink-0 safe-area-top bg-transparent border-none"
      style={{ minHeight: "3.5rem" }}
    >
      {/* Page title — always perfectly centered */}
      <h1 className="absolute inset-x-0 text-center text-xl font-black text-white pointer-events-none drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {current?.displayLabel ?? current?.label ?? ""}
      </h1>

      {/* Hamburger — absolute on inline-end (right in RTL), mobile only */}
      <button
        onClick={onMenuOpen}
        aria-label="פתח תפריט"
        className="md:hidden absolute end-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/18 transition-colors z-10"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}
