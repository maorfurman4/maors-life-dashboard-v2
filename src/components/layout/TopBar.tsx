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
      className="absolute top-0 inset-x-0 z-50 bg-transparent pointer-events-none flex flex-col"
    >
      {/* Notch spacer — clears iOS Dynamic Island, never used for centering */}
      <div className="w-full h-12 md:h-14" />

      {/* Content bar — centering math is isolated to this 56px strip */}
      <div className="relative w-full h-14 pointer-events-auto flex items-center">
        {/* Hamburger — right-4 = physical right regardless of dir=rtl */}
        <div className="absolute right-4 md:hidden">
          <button
            onClick={onMenuOpen}
            aria-label="פתח תפריט"
            className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Title — true center of the content bar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max text-center pointer-events-none">
          <h1 className="text-xl font-black text-white">
            {current?.displayLabel ?? current?.label ?? ""}
          </h1>
        </div>
      </div>
    </header>
  );
}
