import { Link, useLocation } from "@tanstack/react-router";
import { mainNavItems, settingsNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <aside className="hidden md:flex flex-col w-56 border-s border-border bg-sidebar shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <span className="text-lg font-black tracking-tight bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent">
          החיים של מאור
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", active && item.colorClass)}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <Link
          to={settingsNavItem.to}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive(settingsNavItem.to)
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <settingsNavItem.icon className="h-5 w-5 shrink-0" />
          <span>{settingsNavItem.label}</span>
        </Link>
      </div>
    </aside>
  );
}
