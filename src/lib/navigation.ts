import {
  Home,
  Dumbbell,
  Apple,
  Wallet,
  TrendingUp,
  Briefcase,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  colorClass: string;
}

export const mainNavItems: NavItem[] = [
  { label: "בית", to: "/", icon: Home, colorClass: "text-primary" },
  { label: "ספורט", to: "/sport", icon: Dumbbell, colorClass: "text-sport" },
  { label: "תזונה", to: "/nutrition", icon: Apple, colorClass: "text-nutrition" },
  { label: "כלכלה", to: "/finance", icon: Wallet, colorClass: "text-finance" },
  { label: "שוק ההון", to: "/market", icon: TrendingUp, colorClass: "text-market" },
  { label: "עבודה", to: "/work", icon: Briefcase, colorClass: "text-work" },
];

export const settingsNavItem: NavItem = {
  label: "הגדרות",
  to: "/settings",
  icon: Settings,
  colorClass: "text-muted-foreground",
};
