import { useState } from "react";
import { Search, Tag } from "lucide-react";
import { useCoupons } from "@/hooks/use-coupons";
import { CouponCard } from "./CouponCard";

type FilterTab = "הכל" | "פעילים" | "בשימוש";

const FILTER_TABS: FilterTab[] = ["הכל", "פעילים", "בשימוש"];

export function CouponList() {
  const { data: coupons, isLoading } = useCoupons();
  const [filter, setFilter] = useState<FilterTab>("הכל");
  const [search, setSearch] = useState("");

  const filtered = (coupons || []).filter((c: any) => {
    const matchSearch =
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.store?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "הכל" ||
      (filter === "פעילים" && !c.is_used) ||
      (filter === "בשימוש" && c.is_used);

    return matchSearch && matchFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-4 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש קופון..."
          className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Coupon cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-finance/10 flex items-center justify-center">
            <Tag className="h-6 w-6 text-finance" />
          </div>
          <p className="text-sm font-medium">
            {search ? "לא נמצאו קופונים" : "אין קופונים עדיין"}
          </p>
          <p className="text-xs text-muted-foreground">
            {search ? "נסה חיפוש אחר" : "הוסף קופון ראשון בלחיצה על הוסף"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((coupon: any) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}
    </div>
  );
}
