import { useState } from "react";
import { Building2, Plus, ChevronDown, ChevronUp, Trash2, TrendingDown, Calendar, Target } from "lucide-react";
import { ILS, projectDebt, type DebtInput } from "@/lib/finance-utils";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { toast } from "sonner";

type DebtType = "משכנתא" | "הלוואה" | "חוב";

interface Debt {
  id: string;
  name: string;
  type: DebtType;
  principal: number;
  monthly_payment: number;
  annual_interest_rate: number;
  months_elapsed: number;
}

const DEBT_TYPES: DebtType[] = ["משכנתא", "הלוואה", "חוב"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

// AI advisor tips — stub for API connection
const ADVISOR_TIPS = [
  "פירעון מוקדם של 10% מהקרן יקצר את תקופת ההלוואה בכ-18 חודשים.",
  "מחזור משכנתא בריבית נוכחית נמוכה יכול לחסוך אלפי שקלים.",
  "תשלום תוספת חודשית של ₪200 בחודש מקצר את ההלוואה ב-2–3 שנים.",
  "בדוק זכאות להלוואה בריבית מוזלת דרך משרד השיכון.",
];

export function FinanceDebtTracker() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("הלוואה");
  const [principal, setPrincipal] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");
  const [elapsed, setElapsed] = useState("0");

  const handleAdd = () => {
    if (!name || !principal || !monthly || !rate) { toast.error("מלא את כל השדות"); return; }
    const debt: Debt = {
      id: crypto.randomUUID(),
      name,
      type,
      principal: parseFloat(principal),
      monthly_payment: parseFloat(monthly),
      annual_interest_rate: parseFloat(rate),
      months_elapsed: parseInt(elapsed) || 0,
    };
    setDebts((prev) => [...prev, debt]);
    setDrawerOpen(false);
    setName(""); setPrincipal(""); setMonthly(""); setRate(""); setElapsed("0");
    toast.success(`"${debt.name}" נוסף`);
  };

  const totalRemaining = debts.reduce((s, d) => {
    const proj = projectDebt(d);
    return s + proj.remainingBalance;
  }, 0);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-finance" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>חובות ומשכנתא</h3>
            {debts.length > 0 && (
              <p className="text-xs text-muted-foreground">יתרה כוללת: {ILS(totalRemaining)}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="h-8 w-8 rounded-xl bg-finance/10 flex items-center justify-center hover:bg-finance/20 transition-colors"
        >
          <Plus className="h-4 w-4 text-finance" />
        </button>
      </div>

      {/* Debt cards */}
      {debts.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-finance/30 transition-colors"
          onClick={() => setDrawerOpen(true)}
        >
          <Building2 className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">הוסף משכנתא, הלוואה או חוב לחישוב תחזית</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const proj = projectDebt(debt);
            const isExpanded = expanded === debt.id;
            const paidPct = Math.round((1 - proj.remainingBalance / debt.principal) * 100);

            return (
              <div key={debt.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/10 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : debt.id)}
                >
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold truncate">{debt.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-finance/10 text-finance border border-finance/20 shrink-0">
                        {debt.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>יתרה: {ILS(proj.remainingBalance)}</span>
                      <span>נשאר: {proj.monthsLeft} חודשים</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-finance transition-all"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{paidPct}% שולם</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded projection */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "יתרת קרן", value: ILS(proj.remainingBalance), icon: TrendingDown, color: "text-rose-400" },
                        { label: "סיום צפוי", value: formatDate(proj.endDate), icon: Calendar, color: "text-finance" },
                        { label: "ריבית שנותרה", value: ILS(proj.totalInterestRemaining), icon: Target, color: "text-amber-400" },
                        { label: "עלות כוללת", value: ILS(proj.totalCost), icon: Building2, color: "text-muted-foreground" },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl bg-secondary/30 p-2.5 space-y-1">
                          <div className="flex items-center gap-1">
                            <Icon className={`h-3 w-3 ${color}`} />
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                          </div>
                          <p className={`text-xs font-bold ${color}`} dir="ltr">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Roadmap — first 6 entries */}
                    {proj.payoffRoadmap.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-muted-foreground">מפת דרכים לסיום</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {proj.payoffRoadmap.slice(0, 8).map((r) => (
                            <div key={r.month} className="flex items-center justify-between text-[10px] border-s-2 border-finance/30 ps-2">
                              <span className="text-muted-foreground">חודש {r.month}</span>
                              <div className="flex gap-3">
                                <span className="text-muted-foreground">ריבית: {ILS(r.interest)}</span>
                                <span className="font-semibold">יתרה: {ILS(r.balance)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setDebts((prev) => prev.filter((d) => d.id !== debt.id))}
                      className="flex items-center gap-1.5 text-[11px] text-destructive hover:underline"
                    >
                      <Trash2 className="h-3 w-3" />
                      מחק חוב
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI advisor tips — stub */}
      {debts.length > 0 && (
        <div className="rounded-2xl border border-finance/20 bg-finance/5 p-4 space-y-2">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowTips((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <p className="text-xs font-bold text-finance">המלצות לשיפור מצב פיננסי</p>
            </div>
            {showTips ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {showTips && (
            <ul className="space-y-1.5 pt-1">
              {ADVISOR_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <span className="text-finance mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
              <li className="text-[10px] text-muted-foreground/50 italic pt-1">
                * המלצות אישיות יופעלו לאחר חיבור AI
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Add drawer */}
      <AddItemDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="הוסף חוב / הלוואה">
        <div className="space-y-4" dir="rtl">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="משכנתא בנק לאומי, הלוואת רכב..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סוג</label>
            <div className="grid grid-cols-3 gap-2">
              {DEBT_TYPES.map((t) => (
                <button
                  key={t} onClick={() => setType(t)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    type === t ? "border-finance/50 bg-finance/10 text-finance" : "border-border bg-secondary/30 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "קרן מקורית (₪)", val: principal, set: setPrincipal, placeholder: "500000" },
            { label: "תשלום חודשי (₪)", val: monthly, set: setMonthly, placeholder: "3500" },
            { label: "ריבית שנתית (%)", val: rate, set: setRate, placeholder: "4.5" },
            { label: "חודשים שכבר שולמו", val: elapsed, set: setElapsed, placeholder: "0" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type="number" value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]"
                dir="ltr"
              />
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
          >
            הוסף וחשב תחזית
          </button>
        </div>
      </AddItemDrawer>
    </div>
  );
}
