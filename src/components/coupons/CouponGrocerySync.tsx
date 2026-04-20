import { useMemo } from "react";
import { ShoppingCart, Tag, Sparkles } from "lucide-react";
import { useCoupons } from "@/hooks/use-coupons";
import { useGroceryLists } from "@/hooks/use-grocery";
import { matchCouponsToGrocery, getCategoryMeta } from "@/lib/barcode-utils";

export function CouponGrocerySync() {
  const { data: coupons,      isLoading: loadingCoupons }  = useCoupons();
  const { data: groceryLists, isLoading: loadingGrocery }  = useGroceryLists();

  const allItems = useMemo(() => {
    return (groceryLists || []).flatMap((list: any) =>
      (list.grocery_items || []).map((item: any) => ({
        ...item,
        listName: list.name,
      }))
    );
  }, [groceryLists]);

  const activeCoupons = useMemo(
    () => (coupons || []).filter((c: any) => !c.is_used),
    [coupons]
  );

  // Map: groceryItemId → couponId
  const matchMap = useMemo(
    () => matchCouponsToGrocery(activeCoupons, allItems),
    [activeCoupons, allItems]
  );

  // Build display pairs: { item, coupon }
  const pairs = useMemo(() => {
    return [...matchMap.entries()]
      .map(([itemId, couponId]) => {
        const item   = allItems.find((i: any) => i.id === itemId);
        const coupon = activeCoupons.find((c: any) => c.id === couponId);
        return item && coupon ? { item, coupon } : null;
      })
      .filter(Boolean) as { item: any; coupon: any }[];
  }, [matchMap, allItems, activeCoupons]);

  const isLoading = loadingCoupons || loadingGrocery;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>חיסכון חכם</h3>
          <p className="text-[10px] text-muted-foreground">קופונים תואמים לרשימת הקניות שלך</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary/30 animate-pulse" />)}
        </div>
      ) : pairs.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <div className="flex justify-center gap-3 text-3xl">
            <span>🛒</span><span>🏷️</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeCoupons.length === 0
              ? "הוסף קופונים כדי לראות התאמות לרשימת הקניות"
              : allItems.length === 0
              ? "הוסף פריטים לרשימת הקניות כדי לראות התאמות"
              : "לא נמצאו קופונים תואמים לרשימות הקניות הנוכחיות"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-emerald-400">
            🎉 נמצאו {pairs.length} התאמות — חסוך עם הקופונים האלה
          </p>

          {pairs.map(({ item, coupon }) => {
            const meta = getCategoryMeta(coupon.category);
            return (
              <div
                key={`${item.id}-${coupon.id}`}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 space-y-1.5"
              >
                {/* Grocery item row */}
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{item.listName}</span>
                </div>

                {/* Matching coupon row */}
                <div className="flex items-center gap-2 bg-card/60 rounded-lg px-2.5 py-1.5 ms-5">
                  <span className="text-sm leading-none">{meta.emoji}</span>
                  <Tag className="h-3 w-3 text-finance shrink-0" />
                  <span className="text-[11px] font-medium flex-1 truncate">{coupon.title}</span>

                  {coupon.discount_percent && (
                    <span className="text-[10px] font-bold text-finance shrink-0">
                      {coupon.discount_percent}% הנחה
                    </span>
                  )}
                  {coupon.discount_amount && (
                    <span className="text-[10px] font-bold text-finance shrink-0">
                      ₪{coupon.discount_amount} הנחה
                    </span>
                  )}

                  {coupon.code && (
                    <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      {coupon.code}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {pairs.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            קופונים פעילים: <span className="font-bold text-foreground">{activeCoupons.length}</span>
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">
            פריטים ברשימה: <span className="font-bold text-foreground">{allItems.length}</span>
          </span>
        </div>
      )}
    </div>
  );
}
