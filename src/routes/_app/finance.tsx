import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { FinanceBalanceCard } from "@/components/finance/FinanceBalanceCard";
import { FinanceDashboardCards } from "@/components/finance/FinanceDashboardCards";
import { FinanceSavings } from "@/components/finance/FinanceSavings";
import { FinanceTransactions } from "@/components/finance/FinanceTransactions";
import { FinanceCategories } from "@/components/finance/FinanceCategories";
import { FinanceSavingsTrend } from "@/components/finance/FinanceSavingsTrend";
import { FinanceBudgetAlerts } from "@/components/finance/FinanceBudgetAlerts";
import { FinanceSmartInsights } from "@/components/finance/FinanceSmartInsights";
import { FinanceMonthlyArchive } from "@/components/finance/FinanceMonthlyArchive";
import { FinanceSubscriptions } from "@/components/finance/FinanceSubscriptions";
import { FinanceReceiptScanner } from "@/components/finance/FinanceReceiptScanner";
import { FinanceFastAdd } from "@/components/finance/FinanceFastAdd";
import { FinanceKanbanPayments } from "@/components/finance/FinanceKanbanPayments";
import { FinanceDebtTracker } from "@/components/finance/FinanceDebtTracker";
import { FinanceCouponVault } from "@/components/finance/FinanceCouponVault";
import { FinanceGroceryPriceList } from "@/components/finance/FinanceGroceryPriceList";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});

type Tab = "general" | "transactions" | "debts" | "shopping" | "receipts";

const tabs: { key: Tab; label: string }[] = [
  { key: "general",      label: "מצב כללי" },
  { key: "transactions", label: "תנועות" },
  { key: "debts",        label: "חובות" },
  { key: "shopping",     label: "קניות" },
  { key: "receipts",     label: "קבלות" },
];

function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const now = new Date();
  const monthName = now.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-finance/15 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-finance" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ letterSpacing: 0 }}>מצב כללי</h1>
          <p className="text-xs text-muted-foreground">{monthName} · עדכון 24/7</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap px-2 ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* מצב כללי — main dashboard */}
      {activeTab === "general" && (
        <div className="space-y-5">
          <FinanceBalanceCard />
          <FinanceFastAdd />
          <FinanceDashboardCards />
          <FinanceKanbanPayments />
          <FinanceSavings />
          <FinanceBudgetAlerts />
        </div>
      )}

      {/* תנועות — full transaction history + analysis */}
      {activeTab === "transactions" && (
        <div className="space-y-5">
          <FinanceTransactions />
          <FinanceCategories />
          <FinanceSavingsTrend />
          <FinanceSmartInsights />
          <FinanceSubscriptions />
          <FinanceMonthlyArchive />
        </div>
      )}

      {/* חובות — mortgage + loan tracker */}
      {activeTab === "debts" && (
        <div className="space-y-5">
          <FinanceDebtTracker />
        </div>
      )}

      {/* קניות — grocery with prices + coupon vault */}
      {activeTab === "shopping" && (
        <div className="space-y-5">
          <FinanceGroceryPriceList />
          <FinanceCouponVault />
        </div>
      )}

      {/* קבלות — receipt scanner */}
      {activeTab === "receipts" && (
        <div className="space-y-5">
          <FinanceReceiptScanner />
        </div>
      )}
    </div>
  );
}
