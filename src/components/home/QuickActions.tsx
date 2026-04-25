import { useState } from "react";
import {
  Dumbbell,
  Apple,
  Wallet,
  Briefcase,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { AddWorkoutDrawer } from "@/components/sport/AddWorkoutDrawer";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";
import { AddExpenseDrawer } from "@/components/finance/AddExpenseDrawer";
import { AddShiftDrawer } from "@/components/work/AddShiftDrawer";

interface Action {
  label: string;
  drawerKey: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const actions: Action[] = [
  { label: "אימון חדש",  drawerKey: "workout", icon: Dumbbell,  colorClass: "text-sport",    bgClass: "bg-sport/15"    },
  { label: "הוסף ארוחה", drawerKey: "meal",    icon: Apple,     colorClass: "text-nutrition", bgClass: "bg-nutrition/15" },
  { label: "הוסף הוצאה", drawerKey: "expense", icon: Wallet,    colorClass: "text-finance",   bgClass: "bg-finance/15"   },
  { label: "הוסף משמרת", drawerKey: "shift",   icon: Briefcase, colorClass: "text-work",      bgClass: "bg-work/15"      },
];

export function QuickActions() {
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">פעולות מהירות</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => setOpenDrawer(a.drawerKey)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors shrink-0"
          >
            <div className={`h-7 w-7 rounded-lg ${a.bgClass} flex items-center justify-center`}>
              <Plus className={`h-3 w-3 ${a.colorClass}`} />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">{a.label}</span>
          </button>
        ))}
      </div>

      <AddWorkoutDrawer open={openDrawer === "workout"} onClose={() => setOpenDrawer(null)} />
      <AddMealDrawer    open={openDrawer === "meal"}    onClose={() => setOpenDrawer(null)} />
      <AddExpenseDrawer open={openDrawer === "expense"} onClose={() => setOpenDrawer(null)} />
      <AddShiftDrawer   open={openDrawer === "shift"}   onClose={() => setOpenDrawer(null)} />
    </div>
  );
}
