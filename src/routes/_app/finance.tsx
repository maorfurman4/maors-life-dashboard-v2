import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { FinanceDashboardTab } from "@/components/finance/FinanceDashboardTab";
import { FinanceOperationsTab } from "@/components/finance/FinanceOperationsTab";
import { FinanceHistoryTab } from "@/components/finance/FinanceHistoryTab";
import { FinanceDebtsTab } from "@/components/finance/FinanceDebtsTab";
import { FT } from "@/lib/finance-theme";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});

type Tab = "dashboard" | "operations" | "history" | "debts";
interface MonthState { year: number; month: number; }

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",  label: "מצב כללי" },
  { key: "operations", label: "תזרים" },
  { key: "history",    label: "היסטוריה" },
  { key: "debts",      label: "חובות" },
];

const MONTHS_HE = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
];

function FinancePage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [currentMonth, setCurrentMonth] = useState<MonthState>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const prevMonth = () => setCurrentMonth(({ year, month }) =>
    month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });

  const nextMonth = () => setCurrentMonth(({ year, month }) =>
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 });

  const isCurrentMonth =
    currentMonth.year === now.getFullYear() &&
    currentMonth.month === now.getMonth() + 1;

  return (
    <div
      dir="rtl"
      className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 min-h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/piggy-bg.jpg')" }}
    >
      {/* Heavy dark earthy overlay — keeps cards readable */}
      <div className="absolute inset-0" style={{ background: "rgba(22,19,17,0.86)", zIndex: 0 }} />

      {/* Warm ambient glows — above overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute -top-40 -right-24 h-80 w-80 rounded-full blur-[130px]"
          style={{ background: "rgba(244,226,140,0.09)" }}
        />
        <div
          className="absolute top-1/3 -left-16 h-56 w-56 rounded-full blur-[100px]"
          style={{ background: "rgba(140,117,85,0.11)" }}
        />
        <div
          className="absolute bottom-40 right-1/3 h-48 w-48 rounded-full blur-[90px]"
          style={{ background: "rgba(244,226,140,0.07)" }}
        />
      </div>

      <div className="relative pb-32" style={{ zIndex: 2 }}>
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-[20px] flex items-center justify-center shrink-0"
            style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}` }}
          >
            <Wallet className="h-5 w-5" style={{ color: FT.gold }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white" style={{ letterSpacing: 0 }}>
              כספים
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: FT.textSub }}>
              ניהול פיננסי חכם
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <MonthNav
          year={currentMonth.year}
          month={currentMonth.month}
          isCurrentMonth={isCurrentMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        {/* Sticky Tab Bar */}
        <div
          className="sticky top-0 z-20 px-4 py-2.5"
          style={{
            background: "rgba(22,19,17,0.80)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderBottom: `1px solid ${FT.goldBorder}`,
          }}
        >
          <div
            className="flex gap-1 p-1 rounded-full"
            style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex-1 py-2.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200"
                style={{
                  letterSpacing: 0,
                  background: activeTab === t.key ? FT.gold : "transparent",
                  color: activeTab === t.key ? FT.bg : FT.textMuted,
                  boxShadow: activeTab === t.key
                    ? `0 2px 16px ${FT.goldGlow}`
                    : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pt-4">
          {activeTab === "dashboard"  && <FinanceDashboardTab  year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "operations" && <FinanceOperationsTab year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "history"    && <FinanceHistoryTab    year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "debts"      && <FinanceDebtsTab      year={currentMonth.year} month={currentMonth.month} />}
        </div>
      </div>
    </div>
  );
}

// ─── Month Navigator ──────────────────────────────────────────────────────────

function MonthNav({
  year, month, isCurrentMonth, onPrev, onNext,
}: {
  year: number; month: number; isCurrentMonth: boolean;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div
      className="mx-4 mb-3 flex items-center justify-between rounded-full px-3 py-2.5"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
    >
      <button
        onClick={onPrev}
        aria-label="חודש קודם"
        className="h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{ background: FT.goldDim, color: "rgba(255,255,255,0.6)" }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="text-center">
        <p className="text-sm font-black text-white" style={{ letterSpacing: 0 }}>
          {MONTHS_HE[month - 1]} {year}
        </p>
        {isCurrentMonth && (
          <p className="text-[9px] font-bold mt-0.5" style={{ color: FT.gold }}>
            חודש נוכחי
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        aria-label="חודש הבא"
        className="h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: FT.goldDim, color: "rgba(255,255,255,0.6)" }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
