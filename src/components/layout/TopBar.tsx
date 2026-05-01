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
      className="sticky top-0 z-50 relative shrink-0 bg-transparent border-none"
      style={{ minHeight: "4.5rem", paddingTop: "env(safe-area-inset-top, 0.5rem)" }}
    >
      {/* Page title — true mathematical center, slightly below top edge */}
      <h1 className="absolute left-1/2 -translate-x-1/2 bottom-3 whitespace-nowrap text-xl font-black text-white pointer-events-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
        {current?.displayLabel ?? current?.label ?? ""}
      </h1>

      {/* Hamburger — absolute inline-end (right in RTL), vertically centered, mobile only */}
      <button
        onClick={onMenuOpen}
        aria-label="פתח תפריט"
        className="md:hidden absolute end-4 bottom-2 h-9 w-9 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/18 transition-colors z-10"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}
