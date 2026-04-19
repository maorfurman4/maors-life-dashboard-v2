import {
  Home,
  Dumbbell,
  Apple,
  Wallet,
  TrendingUp,
  Briefcase,
  Settings,
  CheckSquare,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  colorClass: string;
}

export const mainNavItems: NavItem[] = [
  { id: "home", label: "בית", to: "/", icon: Home, colorClass: "text-primary" },
  { id: "sport", label: "ספורט", to: "/sport", icon: Dumbbell, colorClass: "text-sport" },
  { id: "nutrition", label: "תזונה", to: "/nutrition", icon: Apple, colorClass: "text-nutrition" },
  { id: "finance", label: "כלכלה", to: "/finance", icon: Wallet, colorClass: "text-finance" },
  { id: "market", label: "שוק ההון", to: "/market", icon: TrendingUp, colorClass: "text-market" },
  { id: "work", label: "עבודה", to: "/work", icon: Briefcase, colorClass: "text-work" },
  { id: "tasks", label: "משימות", to: "/tasks", icon: CheckSquare, colorClass: "text-primary" },
  { id: "coupons", label: "קופונים", to: "/coupons", icon: Tag, colorClass: "text-finance" },
];

export const settingsNavItem: NavItem = {
  id: "settings",
  label: "הגדרות",
  to: "/settings",
  icon: Settings,
  colorClass: "text-muted-foreground",
};

export function getFilteredNavItems(hiddenModules: string[] = []): NavItem[] {
  return mainNavItems.filter((item) => !hiddenModules.includes(item.id));
}
