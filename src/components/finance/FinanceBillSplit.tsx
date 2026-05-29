import { useState } from "react";
import { Plus, X, Check, Users } from "lucide-react";
import { useExpenseSplits, type SplitParticipant } from "@/hooks/useExpenseSplits";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 2 });

function NewSplitForm({ onSave, onCancel }: {
  onSave: (description: string, totalAmount: number, participants: SplitParticipant[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [customAmounts, setCustomAmounts] = useState<(number | null)[]>([null, null]);
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalNum = parseFloat(total) || 0;
  const validNames = names.filter((n) => n.trim());
  const equalShare = validNames.length > 0 ? totalNum / validNames.length : 0;

  function addPerson() {
    setNames((prev) => [...prev, ""]);
    setCustomAmounts((prev) => [...prev, null]);
  }

  function removePerson(i: number) {
    setNames((prev) => prev.filter((_, idx) => idx !== i));
    setCustomAmounts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateName(i: number, val: string) {
    setNames((prev) => { const next = [...prev]; next[i] = val; return next; });
  }

  function updateCustomAmount(i: number, val: string) {
    setCustomAmounts((prev) => {
      const next = [...prev];
      next[i] = val ? parseFloat(val) : null;
      return next;
    });
  }

  async function handleSave() {
    if (!description.trim()) { haptics.error(); toast.error("הזן תיאור"); return; }
    if (!totalNum || totalNum <= 0) { haptics.error(); toast.error("הזן סכום תקין"); return; }
    if (validNames.length < 2) { haptics.error(); toast.error("הוסף לפחות 2 משתתפים"); return; }

    const participants: SplitParticipant[] = validNames.map((name, i) => ({
      name,
      amount: useCustom && customAmounts[i] != null ? (customAmounts[i] as number) : equalShare,
      paid: false,
    }));

    setSaving(true);
    try {
      await onSave(description.trim(), totalNum, participants);
      haptics.success();
      toast.success("חלוקה נשמרה!");
      onCancel();
    } catch {
      haptics.error();
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-3xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }}>חלוקת הוצאה חדשה</p>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="תיאור (למשל: ארוחת ערב)"
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
        style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
      />

      <div className="relative">
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-black" style={{ color: FT.textFaint }}>₪</span>
        <input
          type="number"
          inputMode="decimal"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="סכום כולל"
          className="w-full pe-8 ps-4 py-3 rounded-xl text-sm font-bold text-white placeholder:text-white/25 focus:outline-none"
          style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color: FT.textMuted, letterSpacing: 0 }}>משתתפים</p>
          <button
            onClick={() => setUseCustom((v) => !v)}
            className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
            style={{
              background: useCustom ? FT.goldMid : FT.brownDim,
              border: `1px solid ${useCustom ? FT.goldBorder : FT.brownBorder}`,
              color: useCustom ? FT.gold : FT.textMuted,
              letterSpacing: 0,
            }}
          >
            {useCustom ? "סכומים שונים" : "חלוקה שווה"}
          </button>
        </div>

        {names.map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={`משתתף ${i + 1}`}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
              style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
            />
            {useCustom && (
              <div className="relative w-24">
                <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs font-black" style={{ color: FT.textFaint }}>₪</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={customAmounts[i] ?? ""}
                  onChange={(e) => updateCustomAmount(i, e.target.value)}
                  placeholder={fmt(equalShare)}
                  className="w-full pe-6 ps-2 py-2.5 rounded-xl text-xs font-bold text-white placeholder:text-white/20 focus:outline-none"
                  style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
                  dir="ltr"
                />
              </div>
            )}
            {!useCustom && totalNum > 0 && name.trim() && (
              <p className="text-xs font-bold w-16 text-end" style={{ color: FT.gold, letterSpacing: 0 }} dir="ltr">
                ₪{fmt(equalShare)}
              </p>
            )}
            {names.length > 2 && (
              <button
                onClick={() => removePerson(i)}
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: FT.dangerDim, color: FT.danger }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addPerson}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-90"
          style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
        >
          <Plus className="h-3 w-3" />
          הוסף משתתף
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 active:scale-[0.98]"
          style={{ background: FT.gold, color: FT.bg, letterSpacing: 0 }}
        >
          {saving ? "שומר..." : "שמור חלוקה"}
        </button>
      </div>
    </div>
  );
}

import type { ExpenseSplit } from "@/hooks/useExpenseSplits";

function SplitHistoryCard({ split }: { split: ExpenseSplit }) {
  const [participants, setParticipants] = useState<SplitParticipant[]>(
    (split.participants as SplitParticipant[]).map((p) => ({ ...p }))
  );

  function togglePaid(i: number) {
    setParticipants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], paid: !next[i].paid };
      return next;
    });
  }

  const date = new Date(split.created_at).toLocaleDateString("he-IL");
  const paidCount = participants.filter((p) => p.paid).length;

  return (
    <div
      className="rounded-3xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-white" style={{ letterSpacing: 0 }}>{split.description}</p>
          <p className="text-[10px] mt-0.5" style={{ color: FT.textFaint, letterSpacing: 0 }}>{date}</p>
        </div>
        <div className="text-end">
          <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }} dir="ltr">
            ₪{split.total_amount.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px]" style={{ color: FT.textMuted, letterSpacing: 0 }}>{paidCount}/{participants.length} שולמו</p>
        </div>
      </div>

      <div className="space-y-2">
        {participants.map((p, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePaid(i)}
                className="h-6 w-6 rounded-lg flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: p.paid ? FT.successDim : FT.brownDim,
                  border: `1px solid ${p.paid ? "rgba(124,191,142,0.3)" : FT.brownBorder}`,
                  color: p.paid ? FT.success : FT.textMuted,
                }}
              >
                <Check className="h-3 w-3" />
              </button>
              <p
                className="text-xs font-bold"
                style={{
                  color: p.paid ? FT.textMuted : "white",
                  letterSpacing: 0,
                  textDecoration: p.paid ? "line-through" : "none",
                }}
              >
                {p.name}
              </p>
            </div>
            <p className="text-xs font-bold" style={{ color: p.paid ? FT.textMuted : FT.gold, letterSpacing: 0 }} dir="ltr">
              ₪{fmt(p.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceBillSplit() {
  const { splits, isLoading, createSplit } = useExpenseSplits();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: FT.gold }} />
          <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }}>חלוקת הוצאות</p>
        </div>
        {!addOpen && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
            style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}`, color: FT.gold, letterSpacing: 0 }}
          >
            <Plus className="h-3 w-3" />
            חלוקה חדשה
          </button>
        )}
      </div>

      {addOpen && (
        <NewSplitForm
          onSave={createSplit}
          onCancel={() => setAddOpen(false)}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-3xl h-24 animate-pulse" style={{ background: FT.card }} />
          ))}
        </div>
      )}

      {!isLoading && splits.length === 0 && !addOpen && (
        <div
          className="rounded-3xl p-6 flex flex-col items-center gap-3 text-center animate-in fade-in duration-300"
          style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
        >
          <span className="text-4xl">🤝</span>
          <p className="text-sm font-bold" style={{ color: FT.textMuted, letterSpacing: 0 }}>
            עדיין לא חילקת הוצאות
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-full text-xs font-black transition-all active:scale-90"
            style={{ background: FT.gold, color: FT.bg, letterSpacing: 0 }}
          >
            חלק הוצאה ראשונה
          </button>
        </div>
      )}

      {splits.map((split) => (
        <SplitHistoryCard key={split.id} split={split} />
      ))}
    </div>
  );
}
