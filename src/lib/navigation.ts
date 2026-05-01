import {
  Home,
  Dumbbell,
  Apple,
  Wallet,
  Briefcase,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  colorClass: string;
  bgImage?: string;
}

export const mainNavItems: NavItem[] = [
  { id: "home",      label: "בית",     to: "/",          icon: Home,      colorClass: "text-primary",   bgImage: undefined           },
  { id: "sport",     label: "ספורט",   to: "/sport",     icon: Dumbbell,  colorClass: "text-sport",     bgImage: "/sport-be.jpg"     },
  { id: "nutrition", label: "תזונה",   to: "/nutrition", icon: Apple,     colorClass: "text-nutrition", bgImage: "/nutrition-bg.jpg" },
  { id: "finance",   label: "כלכלה",   to: "/finance",   icon: Wallet,    colorClass: "text-finance",   bgImage: "/finance-bg.jpg"   },
  { id: "work",      label: "עבודה",   to: "/work",      icon: Briefcase, colorClass: "text-work",      bgImage: "/work-bg.jpg"      },
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
