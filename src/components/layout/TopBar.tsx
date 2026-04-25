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
      className="border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 safe-area-top gap-3"
      style={{ minHeight: "3.5rem" }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        aria-label="פתח תפריט"
        className="md:hidden h-9 w-9 rounded-xl bg-white/6 border border-white/8 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/12 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-bold flex-1 text-center md:text-right">
        {current?.label ?? "My Life"}
      </h1>

      {/* Spacer on mobile to keep title visually centered */}
      <div className="md:hidden h-9 w-9" aria-hidden="true" />
    </header>
  );
}
