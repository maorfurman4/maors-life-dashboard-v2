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
      className="sticky top-0 z-50 flex items-center justify-between px-4 shrink-0 safe-area-top"
      style={{
        minHeight: "3.5rem",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 60%, transparent 100%)",
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        aria-label="פתח תפריט"
        className="md:hidden h-9 w-9 rounded-xl bg-white/6 border border-white/8 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/12 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title — centered */}
      <h1 className="absolute inset-x-0 text-center text-xl font-black text-white pointer-events-none">
        {current?.displayLabel ?? current?.label ?? ""}
      </h1>

      {/* Spacer to balance hamburger */}
      <div className="md:hidden h-9 w-9" aria-hidden="true" />
    </header>
  );
}
