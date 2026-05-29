import { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { useAddIncome, INCOME_CATEGORIES } from "@/hooks/use-finance-data";
import { todayLocalStr } from "@/utils/date";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface AddIncomeDrawerProps {
  open: boolean;
  onClose: () => void;
}

const inputCls = "w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[15px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:bg-white/7 transition-all";

const IncomeCategoryChip = memo(function IncomeCategoryChip({
  cat, isActive, onSelect,
}: { cat: { value: string; label: string }; isActive: boolean; onSelect: (v: string) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => { haptics.tap(); onSelect(cat.value); }}
      className={`px-3 py-2.5 rounded-2xl border transition-all text-xs font-semibold ${
        isActive
          ? "bg-gradient-to-b from-finance/20 to-finance/8 border-finance/40 text-finance shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "bg-white/3 border-white/8 text-white/50 hover:bg-white/5 hover:text-white/70"
      }`}>
      {cat.label}
    </motion.button>
  );
});

export function AddIncomeDrawer({ open, onClose }: AddIncomeDrawerProps) {
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayLocalStr);
  const addIncome = useAddIncome();

  const handleCategorySelect = useCallback((v: string) => setCategory(v), []);

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      haptics.error();
      toast.error("הזן סכום תקין");
      return;
    }
    addIncome.mutate(
      { amount: Number(amount), category, description: description || undefined, date, source: "manual" },
      {
        onSuccess: () => {
          haptics.success();
          toast.success("הכנסה נשמרה");
          onClose();
          setAmount(""); setDescription(""); setCategory("other");
        },
        onError: () => { haptics.error(); toast.error("שגיאה בשמירה"); },
      }
    );
  };

  const footer = (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={handleSave}
      disabled={addIncome.isPending}
      className="w-full py-3.5 rounded-2xl bg-finance font-bold text-[15px] text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-[0_2px_20px_rgba(184,134,11,0.25)]"
    >
      {addIncome.isPending ? "שומר..." : "שמור הכנסה"}
    </motion.button>
  );

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הוסף הכנסה" footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-white/40 mb-2 block">סוג</label>
          <div className="grid grid-cols-2 gap-2">
            {INCOME_CATEGORIES.filter(c => c.value !== "salary").map((cat) => (
              <IncomeCategoryChip key={cat.value} cat={cat} isActive={category === cat.value} onSelect={handleCategorySelect} />
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-1.5">הכנסה מהעבודה מחושבת אוטומטית מהמשמרות</p>
        </div>

        <div>
          <label className="text-xs font-medium text-white/40 mb-1.5 block">סכום (₪)</label>
          <input type="number" inputMode="decimal" autoFocus value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="0" className={inputCls} dir="ltr" />
        </div>

        <div>
          <label className="text-xs font-medium text-white/40 mb-1.5 block">תיאור</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="מקור ההכנסה..." className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-medium text-white/40 mb-1.5 block">תאריך</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>
    </AddItemDrawer>
  );
}
