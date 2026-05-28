import { useState } from "react";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { useSavingsGoals, type SavingsGoal } from "@/hooks/useSavingsGoals";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💎", "🎓"];
const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

function daysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const R = 28;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - Math.min(1, pct));
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx={34} cy={34} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
      <circle
        cx={34}
        cy={34}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 34 34)"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function GoalCard({ goal, onDeposit, onDelete }: {
  goal: SavingsGoal;
  onDeposit: (id: string, amount: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositVal, setDepositVal] = useState("");
  const pct = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const days = daysRemaining(goal.deadline);
  const barColor = pct >= 1 ? FT.success : pct >= 0.5 ? FT.gold : FT.brown;

  async function handleDeposit() {
    const num = parseFloat(depositVal);
    if (!num || num <= 0) { toast.error("הזן סכום תקין"); return; }
    try {
      await onDeposit(goal.id, num);
      toast.success(`הופקדו ₪${fmt(num)}`);
      setDepositVal("");
      setDepositOpen(false);
    } catch {
      toast.error("שגיאה בהפקדה");
    }
  }

  return (
    <div
      className="rounded-3xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <CircleProgress pct={pct} color={barColor} />
          <span className="absolute inset-0 flex items-center justify-center text-xl">
            {goal.emoji ?? "🎯"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>
              {goal.title}
            </p>
            <button
              onClick={() => onDelete(goal.id).catch(() => toast.error("שגיאה במחיקה"))}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-lg transition-all active:scale-90"
              style={{ background: FT.dangerDim, color: FT.danger }}
              aria-label="מחק יעד"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-xs font-bold" style={{ color: barColor, letterSpacing: 0 }} dir="ltr">
              ₪{fmt(goal.current_amount)}
            </p>
            <p className="text-xs" style={{ color: FT.textMuted, letterSpacing: 0 }} dir="ltr">
              / ₪{fmt(goal.target_amount)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            {days !== null ? (
              <p className="text-[10px]" style={{ color: days < 30 ? FT.danger : FT.textFaint, letterSpacing: 0 }}>
                {days === 0 ? "היום!" : `${days} ימים נותרו`}
              </p>
            ) : (
              <span />
            )}
            <p className="text-[10px] font-bold" style={{ color: barColor, letterSpacing: 0 }}>
              {Math.round(pct * 100)}%
            </p>
          </div>
        </div>
      </div>

      {depositOpen && (
        <div
          className="overflow-hidden mt-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ borderTop: `1px solid ${FT.goldBorder}` }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span
                className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-black"
                style={{ color: FT.textFaint }}
              >
                ₪
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={depositVal}
                onChange={(e) => setDepositVal(e.target.value)}
                placeholder="סכום"
                className="w-full pe-8 ps-3 py-2.5 rounded-xl text-sm font-bold text-white placeholder:text-white/20 focus:outline-none"
                style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
                dir="ltr"
                autoFocus
              />
            </div>
            <button
              onClick={handleDeposit}
              className="px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
              style={{ background: FT.gold, color: FT.bg, letterSpacing: 0 }}
            >
              הפקד
            </button>
            <button
              onClick={() => { setDepositOpen(false); setDepositVal(""); }}
              className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {!depositOpen && (
        <button
          onClick={() => setDepositOpen(true)}
          className="mt-3 w-full py-2 rounded-xl text-xs font-black transition-all active:scale-[0.98]"
          style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}`, color: FT.gold, letterSpacing: 0 }}
        >
          הפקד
        </button>
      )}
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }: {
  onAdd: (title: string, targetAmount: number, deadline?: string, emoji?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) { toast.error("הזן שם ליעד"); return; }
    const amt = parseFloat(target);
    if (!amt || amt <= 0) { toast.error("הזן סכום יעד תקין"); return; }
    setSaving(true);
    try {
      await onAdd(title.trim(), amt, deadline || undefined, emoji);
      toast.success("יעד חיסכון נוסף!");
      onCancel();
    } catch {
      toast.error("שגיאה בהוספת יעד");
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
      <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }}>יעד חיסכון חדש</p>

      <div className="flex gap-2 flex-wrap">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className="text-xl h-10 w-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: emoji === e ? FT.goldMid : FT.brownDim,
              border: `1px solid ${emoji === e ? FT.goldBorder : FT.brownBorder}`,
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם היעד (למשל: חיסכון לדירה)"
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
        style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
      />

      <div className="relative">
        <span
          className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-black"
          style={{ color: FT.textFaint }}
        >
          ₪
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="סכום יעד"
          className="w-full pe-8 ps-4 py-3 rounded-xl text-sm font-bold text-white placeholder:text-white/25 focus:outline-none"
          style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
          dir="ltr"
        />
      </div>

      <div>
        <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>תאריך יעד (אופציונלי)</p>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
          style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}`, colorScheme: "dark" }}
        />
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
          {saving ? "שומר..." : "הוסף יעד"}
        </button>
      </div>
    </div>
  );
}

export function FinanceSavingsGoals() {
  const { goals, isLoading, addGoal, deposit, deleteGoal } = useSavingsGoals();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4" style={{ color: FT.gold }} />
          <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }}>יעדי חיסכון</p>
        </div>
        {!addOpen && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
            style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}`, color: FT.gold, letterSpacing: 0 }}
          >
            <Plus className="h-3 w-3" />
            הוסף יעד
          </button>
        )}
      </div>

      {addOpen && (
        <AddGoalForm
          onAdd={addGoal}
          onCancel={() => setAddOpen(false)}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl h-28 animate-pulse"
              style={{ background: FT.card }}
            />
          ))}
        </div>
      )}

      {!isLoading && goals.length === 0 && !addOpen && (
        <div
          className="rounded-3xl p-6 flex flex-col items-center gap-3 text-center animate-in fade-in duration-300"
          style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
        >
          <span className="text-4xl">🏦</span>
          <p className="text-sm font-bold" style={{ color: FT.textMuted, letterSpacing: 0 }}>
            אין לך יעדי חיסכון עדיין
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-full text-xs font-black transition-all active:scale-90"
            style={{ background: FT.gold, color: FT.bg, letterSpacing: 0 }}
          >
            הוסף יעד ראשון
          </button>
        </div>
      )}

      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onDeposit={deposit}
          onDelete={deleteGoal}
        />
      ))}
    </div>
  );
}
