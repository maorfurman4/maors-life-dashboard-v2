import { Link, useLocation } from "@tanstack/react-router";
import { getFilteredNavItems, settingsNavItem } from "@/lib/navigation";
import { useHiddenModules } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";

export function DesktopSidebar() {
  const location = useLocation();
  const { data: profile } = useProfile();
  const firstName = profile?.full_name?.split(" ")[0] ?? null;
  const hiddenModules = useHiddenModules();
  const navItems = getFilteredNavItems(hiddenModules);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <aside className="hidden md:flex flex-col w-56 border-s border-border bg-sidebar shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div role="banner" className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <span className="text-lg font-black bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent">
          {firstName ? `החיים של ${firstName}` : "הדשבורד שלי"}
        </span>
      </div>

      {/* Nav items */}
      <nav aria-label="ניווט ראשי" className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon
                aria-hidden="true"
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
          aria-current={isActive(settingsNavItem.to) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive(settingsNavItem.to)
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <settingsNavItem.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span>{settingsNavItem.label}</span>
        </Link>
      </div>
    </aside>
  );
}
