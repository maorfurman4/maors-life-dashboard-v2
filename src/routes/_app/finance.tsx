import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { FinanceBalanceCard } from "@/components/finance/FinanceBalanceCard";
import { FinanceCategories } from "@/components/finance/FinanceCategories";
import { FinanceSavings } from "@/components/finance/FinanceSavings";
import { FinanceTransactions } from "@/components/finance/FinanceTransactions";
import { FinanceDashboardCards } from "@/components/finance/FinanceDashboardCards";
import { FinanceInsights } from "@/components/finance/FinanceInsights";
import { FinanceFixedExpenses } from "@/components/finance/FinanceFixedExpenses";
import { FinanceSavingsTrend } from "@/components/finance/FinanceSavingsTrend";
import { FinanceSubscriptions } from "@/components/finance/FinanceSubscriptions";
import { FinanceBudgetAlerts } from "@/components/finance/FinanceBudgetAlerts";
import { FinanceSmartInsights } from "@/components/finance/FinanceSmartInsights";
import { FinanceAIInsights } from "@/components/finance/FinanceAIInsights";
import { FinanceMonthlyArchive } from "@/components/finance/FinanceMonthlyArchive";
import { FinanceReceiptScanner } from "@/components/finance/FinanceReceiptScanner";
import { FinanceGroceryList } from "@/components/finance/FinanceGroceryList";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});

type Tab = "overview" | "analysis" | "archive" | "subscriptions" | "receipts";

const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "סקירה" },
  { key: "analysis", label: "ניתוח" },
  { key: "archive", label: "ארכיון" },
  { key: "subscriptions", label: "מנויים" },
  { key: "receipts", label: "קבלות" },
];

function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const now = new Date();
  const monthName = now.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-finance/15 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-finance" />
        </div>
        <div>
          <h1 className="text-xl font-bold">כלכלה</h1>
          <p className="text-xs text-muted-foreground">{monthName}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <FinanceBalanceCard />
          <FinanceDashboardCards />
          <FinanceSavings />
          <FinanceFixedExpenses />
          <FinanceTransactions />
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-5">
          <FinanceAIInsights />
          <FinanceSmartInsights />
          <FinanceCategories />
          <FinanceSavingsTrend />
          <FinanceBudgetAlerts />
          <FinanceInsights />
        </div>
      )}

      {activeTab === "archive" && (
        <div className="space-y-5">
          <FinanceMonthlyArchive />
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="space-y-5">
          <FinanceSubscriptions />
        </div>
      )}

      {activeTab === "receipts" && (
        <div className="space-y-5">
          <FinanceReceiptScanner />
          <FinanceGroceryList />
        </div>
      )}
    </div>
  );
}
