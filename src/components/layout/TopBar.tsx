import { Menu } from "lucide-react";

interface TopBarProps {
  onMenuOpen: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-transparent flex items-center px-4 shrink-0 safe-area-top"
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
    </header>
  );
}
