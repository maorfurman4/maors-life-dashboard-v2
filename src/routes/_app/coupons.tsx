import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { useState, useMemo } from "react";
import { CouponGroupedList } from "@/components/coupons/CouponGroupedList";
import { CouponGrocerySync } from "@/components/coupons/CouponGrocerySync";
import { CouponImageAnalyzer } from "@/components/coupons/CouponImageAnalyzer";
import { CouponAddDrawer } from "@/components/coupons/CouponAddDrawer";
import { useCoupons } from "@/hooks/use-coupons";
import { useGroceryLists } from "@/hooks/use-grocery";
import { matchCouponsToGrocery } from "@/lib/barcode-utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/coupons")({
  component: CouponsPage,
});

type Tab = "vault" | "smart";

const tabs: { key: Tab; label: string }[] = [
  { key: "vault", label: "כספת קופונים" },
  { key: "smart", label: "קניות חכמה" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function CouponsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("vault");
  const [addOpen,   setAddOpen]   = useState(false);

  // Pre-compute grocery match IDs so we can pass them to CouponGroupedList
  const { data: coupons }      = useCoupons();
  const { data: groceryLists } = useGroceryLists();

  const allItems = useMemo(
    () => (groceryLists || []).flatMap((list: any) => list.grocery_items || []),
    [groceryLists]
  );

  const activeCoupons = useMemo(
    () => (coupons || []).filter((c: any) => !c.is_used),
    [coupons]
  );

  const matchMap = useMemo(
    () => matchCouponsToGrocery(activeCoupons, allItems),
    [activeCoupons, allItems]
  );

  const groceryMatchCouponIds = useMemo(
    () => new Set<string>([...matchMap.values()]),
    [matchMap]
  );

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto" dir="rtl" style={{ letterSpacing: 0 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-finance/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-finance" />
          </div>
          <div>
            <h1 className="text-xl font-bold">קופונים והטבות</h1>
            <p className="text-xs text-muted-foreground">כספת חכמה · AI · סנכרון קניות</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 ms-1" />הוסף
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
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
            {tab.key === "smart" && groceryMatchCouponIds.size > 0 && (
              <span className="ms-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-400/20 text-emerald-400 text-[9px] font-bold">
                {groceryMatchCouponIds.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── כספת קופונים ─────────────────────────────────────────────────── */}
      {activeTab === "vault" && (
        <div className="space-y-5">
          <CouponImageAnalyzer />
          <CouponGroupedList groceryMatchIds={groceryMatchCouponIds} />
        </div>
      )}

      {/* ── קניות חכמה ───────────────────────────────────────────────────── */}
      {activeTab === "smart" && (
        <div className="space-y-5">
          <CouponGrocerySync />
        </div>
      )}

      <CouponAddDrawer open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
