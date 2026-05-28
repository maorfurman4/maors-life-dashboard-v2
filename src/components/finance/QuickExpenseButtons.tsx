import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/use-sport-data";
import { useAddExpense, useActiveExpenseCategories } from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";

interface QuickExpense {
  id: string;
  label: string;
  amount: number;
  category: string;
  emoji: string;
}

const EMOJI_OPTIONS = ["☕", "⛽", "🛒", "🚗", "🍕", "💊"];

const fmt = (n: number) =>
  n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickExpenseButtons() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const addExpense = useAddExpense();
  const categories = useActiveExpenseCategories();

  const quickExpenses: QuickExpense[] = Array.isArray(
    (settings as Record<string, unknown> | null)?.quick_expenses
  )
    ? ((settings as Record<string, unknown>).quick_expenses as QuickExpense[])
    : [];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]?.name ?? "אחר");
  const [newEmoji, setNewEmoji] = useState(EMOJI_OPTIONS[0]);

  function handleTap(qe: QuickExpense) {
    navigator.vibrate?.([10, 50, 10]);
    addExpense.mutate(
      {
        amount: qe.amount,
        category: qe.category,
        description: qe.label,
        date: todayStr(),
        expense_type: "variable",
        is_recurring: false,
        needs_review: false,
      },
      {
        onSuccess: () =>
          toast.success(`${qe.emoji} ${qe.label} ₪${fmt(qe.amount)} נרשם`),
        onError: (e) => toast.error("שגיאה: " + (e as Error).message),
      }
    );
  }

  function handleAdd() {
    const amt = parseFloat(newAmount);
    if (!newLabel.trim() || !amt || amt <= 0) {
      toast.error("מלא שם וסכום תקין");
      return;
    }
    const newItem: QuickExpense = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      amount: amt,
      category: newCategory,
      emoji: newEmoji,
    };
    const updated = [...quickExpenses, newItem].slice(0, 5);
    updateSettings.mutate({ quick_expenses: updated }, {
      onSuccess: () => {
        toast.success("הוצאה מהירה נוספה");
        setAddOpen(false);
        setNewLabel("");
        setNewAmount("");
        setNewEmoji(EMOJI_OPTIONS[0]);
        setNewCategory(categories[0]?.name ?? "אחר");
      },
    });
  }

  function handleDelete(id: string) {
    const updated = quickExpenses.filter((qe) => qe.id !== id);
    updateSettings.mutate({ quick_expenses: updated });
  }

  if (isLoading) {
    return <div className="h-14 rounded-2xl animate-pulse bg-white/10" />;
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap" dir="rtl">
        <AnimatePresence>
          {quickExpenses.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 flex-1"
            >
              <p className="text-[12px] text-white/40">
                הגדר הוצאות שחוזרות אצלך
              </p>
            </motion.div>
          ) : (
            quickExpenses.map((qe, i) => (
              <motion.button
                key={qe.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleTap(qe)}
                className="flex flex-col items-center justify-center px-3 py-2 rounded-2xl text-center active:scale-90 transition-all"
                style={{
                  background: FT.brownDim,
                  border: `1px solid ${FT.brownBorder}`,
                  minWidth: 56,
                }}
              >
                <span className="text-xl leading-none">{qe.emoji}</span>
                <span
                  className="text-[9px] font-bold mt-0.5 leading-tight"
                  style={{ color: FT.textMuted }}
                >
                  {qe.label}
                </span>
                <span
                  className="text-[9px] font-black leading-tight"
                  style={{ color: FT.gold }}
                  dir="ltr"
                >
                  ₪{fmt(qe.amount)}
                </span>
              </motion.button>
            ))
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: quickExpenses.length * 0.06 }}
          onClick={() => setSheetOpen(true)}
          className="h-[58px] w-[58px] rounded-2xl flex items-center justify-center active:scale-90 transition-all shrink-0"
          style={{
            background: FT.goldDim,
            border: `1px solid ${FT.goldBorder}`,
          }}
          aria-label="הגדרות הוצאות מהירות"
        >
          <Settings className="h-4 w-4" style={{ color: FT.gold }} />
        </motion.button>
      </div>

      {/* Settings bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-[28px] px-5 pt-4 pb-10 space-y-4 shadow-2xl"
              style={{ background: FT.bg, borderTop: `1px solid ${FT.goldBorder}` }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-1 bg-white/20" />

              <div className="flex items-center justify-between">
                <p className="text-base font-black text-white">הוצאות מהירות</p>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: FT.goldDim, color: FT.textMuted }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {quickExpenses.length > 0 && (
                <div className="space-y-2">
                  {quickExpenses.map((qe) => (
                    <div
                      key={qe.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{
                        background: FT.brownDim,
                        border: `1px solid ${FT.brownBorder}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{qe.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{qe.label}</p>
                          <p
                            className="text-[11px]"
                            style={{ color: FT.textMuted }}
                          >
                            {qe.category} · ₪{fmt(qe.amount)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(qe.id)}
                        className="h-7 w-7 rounded-full flex items-center justify-center active:scale-90 transition-all"
                        style={{ background: "rgba(217,107,107,0.18)", color: FT.danger }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {quickExpenses.length < 5 && !addOpen && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-[0.98] transition-all"
                  style={{
                    background: FT.goldDim,
                    border: `1px solid ${FT.goldBorder}`,
                    color: FT.gold,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  הוסף הוצאה מהירה +
                </button>
              )}

              {addOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2 border-t"
                  style={{ borderColor: FT.goldBorder }}
                >
                  <p className="text-sm font-black text-white">הוצאה חדשה</p>

                  <div className="flex gap-2 flex-wrap">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setNewEmoji(e)}
                        className="text-2xl h-11 w-11 rounded-2xl flex items-center justify-center transition-all"
                        style={{
                          background:
                            newEmoji === e ? FT.goldMid : FT.brownDim,
                          border: `1px solid ${newEmoji === e ? FT.goldBorder : FT.brownBorder}`,
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="שם (למשל: קפה בוקר)"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                    style={{
                      background: FT.cardLight,
                      border: `1px solid ${FT.goldBorder}`,
                    }}
                  />

                  <div className="relative">
                    <span
                      className="absolute end-3 top-1/2 -translate-y-1/2 font-black"
                      style={{ color: FT.textFaint }}
                    >
                      ₪
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pe-9 ps-4 py-3 rounded-xl text-xl font-black text-white placeholder:text-white/20 focus:outline-none"
                      style={{
                        background: FT.cardLight,
                        border: `1px solid ${FT.goldBorder}`,
                      }}
                      dir="ltr"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setNewCategory(c.name)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                        style={{
                          background:
                            newCategory === c.name ? FT.goldMid : FT.brownDim,
                          border: `1px solid ${newCategory === c.name ? FT.goldBorder : FT.brownBorder}`,
                          color:
                            newCategory === c.name ? FT.gold : FT.textMuted,
                        }}
                      >
                        {c.icon} {c.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: FT.brownDim,
                        border: `1px solid ${FT.brownBorder}`,
                        color: FT.textMuted,
                      }}
                    >
                      ביטול
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={updateSettings.isPending}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 active:scale-[0.98]"
                      style={{ background: FT.gold, color: FT.bg }}
                    >
                      שמור
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
