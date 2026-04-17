import { useState } from "react";
import { Plus, Clock, Sun, Moon, Sunrise, Sunset, BookOpen } from "lucide-react";
import { SHIFT_TYPES, type ShiftType } from "@/lib/work-utils";
import { AddShiftDrawer } from "@/components/work/AddShiftDrawer";
import { AddPayslipDrawer } from "@/components/work/AddPayslipDrawer";

const quickShifts: { type: ShiftType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "morning", icon: Sunrise },
  { type: "afternoon", icon: Sun },
  { type: "night", icon: Moon },
  { type: "long_morning", icon: Sunrise },
  { type: "long_night", icon: Moon },
  { type: "briefing", icon: BookOpen },
];

export function WorkQuickAdd() {
  const [shiftOpen, setShiftOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <button
          onClick={() => setShiftOpen(true)}
          className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl bg-work/10 border border-work/20 hover:bg-work/15 transition-colors min-h-[44px]"
        >
          <Plus className="h-5 w-5 text-work shrink-0" />
          <span className="text-sm font-semibold text-work">הוסף משמרת</span>
        </button>
        <button
          onClick={() => setPayslipOpen(true)}
          className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl bg-secondary/40 border border-border hover:bg-secondary/60 transition-colors min-h-[44px]"
        >
          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-muted-foreground">הזן תלוש</span>
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {quickShifts.map((s) => {
          const info = SHIFT_TYPES[s.type];
          return (
            <button
              key={s.type}
              onClick={() => setShiftOpen(true)}
              className="flex flex-col items-center gap-1 min-w-[70px] p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors min-h-[44px]"
            >
              <s.icon className="h-4 w-4 text-work" />
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{info.label}</span>
              <span className="text-[9px] text-muted-foreground">{info.hours}h</span>
            </button>
          );
        })}
      </div>
      <AddShiftDrawer open={shiftOpen} onClose={() => setShiftOpen(false)} />
      <AddPayslipDrawer open={payslipOpen} onClose={() => setPayslipOpen(false)} />
    </div>
  );
}
