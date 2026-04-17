import { useLocation } from "@tanstack/react-router";
import { mainNavItems, settingsNavItem } from "@/lib/navigation";

const allItems = [...mainNavItems, settingsNavItem];

export function TopBar() {
  const location = useLocation();
  const current = allItems.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to)
  );

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-5 shrink-0 safe-area-top" style={{ minHeight: "3.5rem" }}>
      <h1 className="text-lg font-bold tracking-tight">
        {current?.label ?? "החיים של מאור"}
      </h1>
    </header>
  );
}
