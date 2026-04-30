import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { FinanceDashboardTab } from "@/components/finance/FinanceDashboardTab";
import { FinanceOperationsTab } from "@/components/finance/FinanceOperationsTab";
import { FinanceHistoryTab } from "@/components/finance/FinanceHistoryTab";
import { FinanceDebtsTab } from "@/components/finance/FinanceDebtsTab";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});

type Tab = "dashboard" | "operations" | "history" | "debts";

interface MonthState {
  year: number;
  month: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",  label: "מצב כללי" },
  { key: "operations", label: "תזרים וקבועות" },
  { key: "history",    label: "היסטוריה וניתוח" },
  { key: "debts",      label: "חובות והלוואות" },
];

const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function FinancePage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [currentMonth, setCurrentMonth] = useState<MonthState>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  function prevMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    );
  }

  const isCurrentMonth =
    currentMonth.year === now.getFullYear() &&
    currentMonth.month === now.getMonth() + 1;

  return (
    <div dir="rtl" className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 bg-[#080b12] min-h-screen relative">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute bottom-40 -left-20 h-64 w-64 rounded-full bg-sky-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 pb-32">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white" style={{ letterSpacing: 0 }}>
              כספים 💰
            </h1>
            <p className="text-[11px] text-white/40 mt-0.5">עדכון בזמן אמת</p>
          </div>
        </div>

        {/* Month Navigator */}
        <FinanceMonthNav
          year={currentMonth.year}
          month={currentMonth.month}
          isCurrentMonth={isCurrentMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-20 px-4 py-2 bg-[#080b12]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl scrollbar-hide overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 min-w-0 ${
                  activeTab === t.key
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-white/40 hover:text-white/70"
                }`}
                style={{ letterSpacing: 0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pt-4">
          {activeTab === "dashboard"  && <DashboardTab  year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "operations" && <OperationsTab year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "history"    && <HistoryTab    year={currentMonth.year} month={currentMonth.month} />}
          {activeTab === "debts"      && <DebtsTab      year={currentMonth.year} month={currentMonth.month} />}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ─── Month Navigator ───────────────────────────────────────────────────────────

function FinanceMonthNav({
  year,
  month,
  isCurrentMonth,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3">
      {/* RTL: right arrow = go back in time (earlier month) */}
      <button
        onClick={onPrev}
        aria-label="חודש קודם"
        className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="text-center">
        <p className="text-sm font-black text-white" style={{ letterSpacing: 0 }}>
          {MONTHS_HE[month - 1]} {year}
        </p>
        {isCurrentMonth && (
          <p className="text-[9px] text-emerald-400 font-bold mt-0.5">חודש נוכחי</p>
        )}
      </div>

      {/* RTL: left arrow = go forward in time (later month) */}
      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        aria-label="חודש הבא"
        className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Placeholder Tab Components ───────────────────────────────────────────────

function DashboardTab({ year, month }: { year: number; month: number }) {
  return <FinanceDashboardTab year={year} month={month} />;
}

function OperationsTab({ year, month }: { year: number; month: number }) {
  return <FinanceOperationsTab year={year} month={month} />;
}

function HistoryTab({ year, month }: { year: number; month: number }) {
  return <FinanceHistoryTab year={year} month={month} />;
}

function DebtsTab({ year, month }: { year: number; month: number }) {
  return <FinanceDebtsTab year={year} month={month} />;
}
