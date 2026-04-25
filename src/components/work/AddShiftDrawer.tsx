import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { SHIFT_LABELS, SHIFT_TIMES, SHIFT_HOURS } from "@/lib/payroll-engine";
import { useAddShift } from "@/hooks/use-work-data";
import { useAddIncome } from "@/hooks/use-finance-data";
import { toast } from "sonner";

type ShiftType = 'morning' | 'afternoon' | 'night' | 'long_morning' | 'long_night' | 'briefing';
type WorkRole = 'guard' | 'shift_manager';

const ROLE_LABELS: Record<WorkRole, string> = {
  guard: 'מאבטח רגיל',
  shift_manager: 'אחראי משמרת',
};

interface AddShiftDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AddShiftDrawer({ open, onClose }: AddShiftDrawerProps) {
  const [shiftType, setShiftType] = useState<ShiftType>("morning");
  const [role, setRole] = useState<WorkRole>("guard");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isShabbat, setIsShabbat] = useState(false);
  const [hasBriefing, setHasBriefing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showMealQuestion, setShowMealQuestion] = useState(false);
  const [hadMeal, setHadMeal] = useState<boolean | null>(null);

  const addShift = useAddShift();
  const addIncome = useAddIncome();

  const isMorningShift = shiftType === "long_morning" || shiftType === "morning";

  const handleSave = () => {
    // If morning shift and we haven't asked about meal yet, show question
    if (isMorningShift && hadMeal === null && !showMealQuestion) {
      setShowMealQuestion(true);
      return;
    }

    addShift.mutate(
      {
        date,
        type: shiftType,
        role,
        is_shabbat_holiday: isShabbat,
        has_briefing: hasBriefing,
        hours: SHIFT_HOURS[shiftType] || 8,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          // If had meal, add meal voucher income
          if (hadMeal) {
            addIncome.mutate(
              { amount: 68, category: "salary", description: "שובר ארוחה", date, source: "meal_voucher" },
              {
                onError: (err) => {
                  console.error("Meal voucher income error:", err);
                  toast.error("המשמרת נשמרה, אך שובר הארוחה נכשל: " + (err as Error).message);
                },
              }
            );
          }
          toast.success("משמרת נוספה בהצלחה");
          resetForm();
          onClose();
        },
        onError: (err) => {
          toast.error("שגיאה בשמירת משמרת: " + (err as Error).message);
        },
      }
    );
  };

  const resetForm = () => {
    setShiftType("morning");
    setRole("guard");
    setIsShabbat(false);
    setHasBriefing(false);
    setNotes("");
    setShowMealQuestion(false);
    setHadMeal(null);
  };

  const handleMealAnswer = (answer: boolean) => {
    setHadMeal(answer);
    setShowMealQuestion(false);
  };

  const shiftEntries = (Object.keys(SHIFT_LABELS) as ShiftType[]).map((key) => ({
    key,
    label: SHIFT_LABELS[key],
    times: SHIFT_TIMES[key],
  }));

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הוסף משמרת">
      <div className="space-y-4">
        {/* Meal voucher question overlay */}
        {showMealQuestion && (
          <div className="rounded-xl border-2 border-work bg-work/5 p-4 space-y-3">
            <p className="text-sm font-bold text-center">🍽️ האם הייתה ארוחה במשמרת זו?</p>
            <p className="text-[10px] text-muted-foreground text-center">אם כן, יתווסף שובר ארוחה בסך 68₪</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleMealAnswer(true)}
                className="px-3 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 text-sm font-bold min-h-[44px]">
                ✓ כן
              </button>
              <button onClick={() => handleMealAnswer(false)}
                className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground min-h-[44px]">
                ✗ לא
              </button>
            </div>
          </div>
        )}

        {/* Show meal status if already answered */}
        {hadMeal !== null && isMorningShift && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium text-center ${
            hadMeal ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
          }`}>
            {hadMeal ? "🍽️ שובר ארוחה +68₪" : "ללא שובר ארוחה"}
            <button onClick={() => { setHadMeal(null); setShowMealQuestion(true); }}
              className="mr-2 underline text-[10px]">שנה</button>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג משמרת</label>
          <div className="grid grid-cols-2 gap-2">
            {shiftEntries.map((s) => (
              <button key={s.key} onClick={() => { setShiftType(s.key); setHadMeal(null); setShowMealQuestion(false); }}
                className={`px-3 py-2.5 rounded-xl border transition-colors text-xs font-medium min-h-[44px] ${
                  shiftType === s.key ? "border-work bg-work/10 text-work" : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}>
                <span>{s.label}</span>
                {s.times && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5" dir="ltr">
                    {s.times.start}–{s.times.end}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">תפקיד</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ROLE_LABELS) as WorkRole[]).map((key) => (
              <button key={key} onClick={() => setRole(key)}
                className={`px-3 py-2.5 rounded-xl border transition-colors text-xs font-medium min-h-[44px] ${
                  role === key ? "border-work bg-work/10 text-work" : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}>
                {ROLE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תאריך</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-work min-h-[44px]" />
        </div>

        <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={isShabbat} onChange={(e) => setIsShabbat(e.target.checked)} className="accent-work h-4 w-4" />
          <span className="text-sm font-medium">שבת / חג</span>
        </label>

        <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={hasBriefing} onChange={(e) => setHasBriefing(e.target.checked)} className="accent-work h-4 w-4" />
          <span className="text-sm font-medium">תדרוך</span>
        </label>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">הערות (אופציונלי)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות נוספות..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-work resize-none h-16" />
        </div>

        <button onClick={handleSave} disabled={addShift.isPending}
          className="w-full py-3 rounded-xl bg-work text-work-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50">
          {addShift.isPending ? "שומר..." : "שמור משמרת"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
