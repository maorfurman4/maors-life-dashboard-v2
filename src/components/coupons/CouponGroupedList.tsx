import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useCoupons } from "@/hooks/use-coupons";
import { CouponCard } from "./CouponCard";
import { groupCouponsByCategory, getCategoryMeta, daysUntilExpiry } from "@/lib/barcode-utils";

// ─── Expiry urgency badge ─────────────────────────────────────────────────────

function CategoryCluster({
  category,
  coupons,
  defaultOpen,
  groceryMatchIds,
}: {
  category: string;
  coupons: any[];
  defaultOpen: boolean;
  groceryMatchIds: Set<string>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = getCategoryMeta(category);

  const expiringSoon = coupons.filter((c) => {
    const d = daysUntilExpiry(c.expiry_date);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const hasGroceryMatch = coupons.some((c) => groceryMatchIds.has(c.id));

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Cluster header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
      >
        <span className="text-lg leading-none">{meta.emoji}</span>

        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ letterSpacing: 0 }}>{category}</span>

            {expiringSoon > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                ⏰ {expiringSoon} עומד לפוג
              </span>
            )}

            {hasGroceryMatch && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                🛒 ברשימה
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-secondary ${meta.color}`}>
            {coupons.length}
          </span>
          {open
            ? <ChevronUp  className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Cluster items — animated open/close */}
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              groceryHighlight={groceryMatchIds.has(coupon.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main grouped list ────────────────────────────────────────────────────────

interface CouponGroupedListProps {
  groceryMatchIds?: Set<string>;
}

export function CouponGroupedList({ groceryMatchIds = new Set() }: CouponGroupedListProps) {
  const { data: coupons, isLoading } = useCoupons();
  const [search, setSearch] = useState("");

  const activeCoupons = useMemo(
    () => (coupons || []).filter((c: any) => !c.is_used),
    [coupons]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return activeCoupons;
    const q = search.toLowerCase();
    return activeCoupons.filter(
      (c: any) =>
        c.title?.toLowerCase().includes(q) ||
        c.store?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
    );
  }, [activeCoupons, search]);

  const grouped = useMemo(() => groupCouponsByCategory(filtered), [filtered]);

  const sortedCategories = useMemo(() => {
    // Sort: categories with expiring-soon or grocery matches first
    return Object.keys(grouped).sort((a, b) => {
      const aUrgent = grouped[a].some((c) => {
        const d = daysUntilExpiry(c.expiry_date);
        return d !== null && d >= 0 && d <= 7;
      });
      const bUrgent = grouped[b].some((c) => {
        const d = daysUntilExpiry(c.expiry_date);
        return d !== null && d >= 0 && d <= 7;
      });
      const aMatch = grouped[a].some((c) => groceryMatchIds.has(c.id));
      const bMatch = grouped[b].some((c) => groceryMatchIds.has(c.id));

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return  1;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return  1;
      return grouped[b].length - grouped[a].length; // larger groups first
    });
  }, [grouped, groceryMatchIds]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-secondary/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search */}
      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש קופון, חנות, קטגוריה..."
          className="w-full pe-9 ps-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance min-h-[40px]"
        />
      </div>

      {/* Stats row */}
      {activeCoupons.length > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground px-1">
          <span>{activeCoupons.length} קופונים פעילים</span>
          <span>·</span>
          <span>{sortedCategories.length} קטגוריות</span>
          {groceryMatchIds.size > 0 && (
            <>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">🛒 {groceryMatchIds.size} פריטים ברשימה</span>
            </>
          )}
        </div>
      )}

      {/* Category clusters */}
      {sortedCategories.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-2xl">🏷️</p>
          <p className="text-sm text-muted-foreground">
            {search ? "לא נמצאו קופונים" : "אין קופונים פעילים — הוסף קופון ראשון"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((cat, i) => (
            <CategoryCluster
              key={cat}
              category={cat}
              coupons={grouped[cat]}
              defaultOpen={i === 0}           // first cluster open by default
              groceryMatchIds={groceryMatchIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
