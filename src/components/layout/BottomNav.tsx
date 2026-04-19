import { Link, useLocation } from "@tanstack/react-router";
import { getFilteredNavItems } from "@/lib/navigation";
import { useHiddenModules } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const hiddenModules = useHiddenModules();
  const navItems = getFilteredNavItems(hiddenModules);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav aria-label="ניווט ראשי" className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom safe-area-x">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 transition-colors",
                  active && item.colorClass
                )}
              />
              <span className={cn("text-[10px] font-medium", active && "font-bold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
