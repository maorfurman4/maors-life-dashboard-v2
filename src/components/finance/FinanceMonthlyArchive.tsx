import { useState } from "react";
import { Archive, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, PiggyBank, Download, FileText } from "lucide-react";
import { useMonthlyFinance, useMonthlySnapshots } from "@/hooks/use-finance-data";

const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

export function FinanceMonthlyArchive() {
  const now = new Date();
  // Default to previous month
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  const finance = useMonthlyFinance(year, month);
  const { data: snapshots } = useMonthlySnapshots();

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    // Don't allow going past current month
    const isAtCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isAtCurrent) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const isAtCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = `${MONTHS_HE[month - 1]} ${year}`;

  const fmt = (n: number) => `₪${Math.round(n).toLocaleString("he-IL")}`;

  // Build months data: combine snapshots with current displayed month
  const monthsData = (() => {
    const snapshotRows = (snapshots ?? []).map((s: any) => ({
      year: s.year,
      month: s.month,
      total_income: s.total_income ?? 0,
      total_expenses: s.total_expenses ?? 0,
      balance: s.balance ?? 0,
      savings_pct: s.savings_pct ?? 0,
    }));
    // Also include the currently viewed month from live data
    const liveRow = {
      year,
      month,
      total_income: finance.totalIncome,
      total_expenses: finance.totalExpenses,
      balance: finance.balance,
      savings_pct: finance.savingsPct,
    };
    const key = `${year}-${month}`;
    const hasSnapshot = snapshotRows.some((r: typeof snapshotRows[0]) => `${r.year}-${r.month}` === key);
    return hasSnapshot ? snapshotRows : [liveRow, ...snapshotRows];
  })();

  const handleExportCSV = () => {
    const rows = [
      ["חודש", "הכנסות", "הוצאות", "יתרה", "חיסכון %"],
      ...monthsData.map((m: typeof monthsData[0]) => [
        `${m.year}-${String(m.month).padStart(2, "0")}`,
        m.total_income.toFixed(2),
        m.total_expenses.toFixed(2),
        m.balance.toFixed(2),
        m.savings_pct.toFixed(1) + "%",
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "היסטוריה-פיננסית.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Top categories
  const topCategories = Object.entries(finance.categoryBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <>
    <style>{`@media print { body * { visibility: hidden; } #finance-print-area, #finance-print-area * { visibility: visible; } #finance-print-area { position: fixed; top: 0; left: 0; width: 100%; } }`}</style>
    <div id="finance-print-area" className="hidden print:block p-8 direction-rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">דוח פיננסי היסטורי</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {["חודש", "הכנסות", "הוצאות", "יתרה", "חיסכון %"].map((h) => (
              <th key={h} className="border px-3 py-2 text-right font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthsData.map((m: typeof monthsData[0]) => (
            <tr key={`${m.year}-${m.month}`}>
              <td className="border px-3 py-1.5">{`${m.year}-${String(m.month).padStart(2, "0")}`}</td>
              <td className="border px-3 py-1.5">₪{Math.round(m.total_income).toLocaleString("he-IL")}</td>
              <td className="border px-3 py-1.5">₪{Math.round(m.total_expenses).toLocaleString("he-IL")}</td>
              <td className="border px-3 py-1.5">₪{Math.round(m.balance).toLocaleString("he-IL")}</td>
              <td className="border px-3 py-1.5">{m.savings_pct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="rounded-2xl border border-finance/15 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-bold">ארכיון חודשי</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-finance/20 bg-finance/10 text-finance hover:bg-finance/20 transition-colors"
            title="ייצוא CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-muted/30 bg-muted/20 text-muted-foreground hover:bg-muted/40 transition-colors"
            title="הדפסה / PDF"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-1">
        <button onClick={goPrev} className="p-2 rounded-lg hover:bg-card transition-colors min-h-[36px]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold">{monthLabel}</span>
        <button
          onClick={goNext}
          disabled={isAtCurrent}
          className="p-2 rounded-lg hover:bg-card transition-colors min-h-[36px] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card icon={TrendingUp} label="הכנסות" value={fmt(finance.totalIncome)} color="text-sport" bg="bg-sport/10 border-sport/20" />
        <Card icon={TrendingDown} label="הוצאות" value={fmt(finance.totalExpenses)} color="text-destructive" bg="bg-destructive/10 border-destructive/20" />
        <Card icon={Wallet} label="יתרה" value={fmt(finance.balance)} color={finance.balance >= 0 ? "text-finance" : "text-destructive"} bg="bg-finance/10 border-finance/20" />
        <Card icon={PiggyBank} label="חיסכון" value={`${Math.round(finance.savingsPct)}%`} color="text-sport" bg="bg-sport/10 border-sport/20" />
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-muted-foreground">קטגוריות מובילות</h4>
          <div className="space-y-1.5">
            {topCategories.map(([cat, amount]) => {
              const pct = finance.totalExpenses > 0 ? ((amount as number) / finance.totalExpenses) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium">{cat}</span>
                    <span className="text-muted-foreground">{fmt(amount as number)} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div className="h-full bg-finance" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <Mini label="עסקאות" value={String(finance.expenses.length)} />
        <Mini label="הכנסות נוספות" value={String(finance.incomes.length)} />
        <Mini label="הוצאות קבועות" value={fmt(finance.totalFixedMonthly)} />
        <Mini label="הוצאה ממוצעת/יום" value={fmt(finance.avgDailyExpense)} />
      </div>

      {finance.totalIncome === 0 && finance.totalExpenses === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          אין נתונים לחודש זה
        </p>
      )}
    </div>
    </>
  );
}

function Card({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-3 space-y-1 ${bg}`}>
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
