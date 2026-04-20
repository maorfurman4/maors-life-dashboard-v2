import { useState } from "react";
import { Tag, Plus, Check, Trash2, Copy, Clock } from "lucide-react";
import { useCoupons, useAddCoupon, useMarkCouponUsed, useDeleteCoupon } from "@/hooks/use-coupons";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { toast } from "sonner";

const COUPON_CATEGORIES = ["מזון", "ביגוד", "אלקטרוניקה", "מסעדות", "תחבורה", "בריאות", "אחר"];

function daysUntilExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
}

export function FinanceCouponVault() {
  const { data: coupons, isLoading } = useCoupons();
  const addCoupon = useAddCoupon();
  const markUsed = useMarkCouponUsed();
  const deleteCoupon = useDeleteCoupon();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [store, setStore] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [expiry, setExpiry] = useState("");
  const [category, setCategory] = useState("אחר");
  const [showUsed, setShowUsed] = useState(false);

  const active = (coupons || []).filter((c: any) => !c.is_used);
  const used = (coupons || []).filter((c: any) => c.is_used);
  const totalSavingsPotential = active.reduce((s: number, c: any) => s + (c.discount_amount || 0), 0);

  const handleAdd = () => {
    if (!title.trim()) { toast.error("הזן כותרת לקופון"); return; }
    addCoupon.mutate({
      title,
      code: code || undefined,
      store: store || undefined,
      discount_amount: discountAmount ? parseFloat(discountAmount) : undefined,
      discount_percent: discountPct ? parseFloat(discountPct) : undefined,
      expiry_date: expiry || undefined,
      category,
    });
    setTitle(""); setCode(""); setStore(""); setDiscountAmount(""); setDiscountPct(""); setExpiry(""); setCategory("אחר");
    setDrawerOpen(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success("קוד הועתק"));
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
            <Tag className="h-4 w-4 text-finance" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>כספת קופונים</h3>
            {totalSavingsPotential > 0 && (
              <p className="text-xs text-muted-foreground">
                חיסכון פוטנציאלי: ₪{totalSavingsPotential.toLocaleString("he-IL")}
              </p>
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

      {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

      {!isLoading && active.length === 0 && (
        <div
          className="rounded-xl border-2 border-dashed border-border p-5 text-center cursor-pointer hover:border-finance/30 transition-colors"
          onClick={() => setDrawerOpen(true)}
        >
          <Tag className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">אין קופונים פעילים — הוסף קופון לחיסכון</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((c: any) => {
            const days = daysUntilExpiry(c.expiry_date);
            const expiringSoon = days !== null && days <= 7 && days >= 0;
            const expired = days !== null && days < 0;

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-3 space-y-2 transition-colors ${
                  expired ? "border-destructive/20 bg-destructive/5 opacity-60"
                  : expiringSoon ? "border-amber-400/30 bg-amber-400/5"
                  : "border-border bg-secondary/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.title}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {c.store && <span>{c.store}</span>}
                      {c.category && <span className="px-1.5 py-0.5 rounded-full bg-finance/10 text-finance">{c.category}</span>}
                      {c.discount_amount && <span className="text-emerald-400 font-bold">חיסכון ₪{c.discount_amount}</span>}
                      {c.discount_percent && <span className="text-emerald-400 font-bold">{c.discount_percent}% הנחה</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.code && (
                      <button onClick={() => copyCode(c.code)} className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors" title="העתק קוד">
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => markUsed.mutate(c.id)} className="h-7 w-7 rounded-lg bg-emerald-400/10 flex items-center justify-center hover:bg-emerald-400/20 transition-colors" title="סמן כנוצל">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </button>
                    <button onClick={() => deleteCoupon.mutate(c.id)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </div>

                {c.code && (
                  <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2 py-1.5">
                    <span className="text-[11px] font-mono font-bold text-finance flex-1 tracking-wider">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="text-[10px] text-muted-foreground hover:text-foreground">העתק</button>
                  </div>
                )}

                {days !== null && (
                  <div className={`flex items-center gap-1 text-[10px] ${expired ? "text-destructive" : expiringSoon ? "text-amber-400" : "text-muted-foreground"}`}>
                    <Clock className="h-3 w-3" />
                    {expired ? "פג תוקף" : days === 0 ? "פג היום" : `נותרו ${days} ימים`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Used coupons toggle */}
      {used.length > 0 && (
        <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowUsed((v) => !v)}>
          {showUsed ? "הסתר" : "הצג"} {used.length} קופונים שנוצלו
        </button>
      )}
      {showUsed && used.map((c: any) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/10 p-2.5 opacity-50">
          <p className="text-xs line-through text-muted-foreground">{c.title}</p>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </div>
      ))}

      {/* Add drawer */}
      <AddItemDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="הוסף קופון">
        <div className="space-y-4" dir="rtl">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">כותרת *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="10% הנחה בזארה, קופון שופרסל..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">קוד קופון</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE20"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px] font-mono" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">חנות</label>
              <input type="text" value={store} onChange={(e) => setStore(e.target.value)} placeholder="שופרסל, זארה..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">הנחה ₪</label>
              <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">הנחה %</label>
              <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תוקף עד</label>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance min-h-[44px]" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">קטגוריה</label>
            <div className="flex flex-wrap gap-1.5">
              {COUPON_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    category === cat ? "border-finance/50 bg-finance/10 text-finance" : "border-border text-muted-foreground"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAdd} disabled={addCoupon.isPending}
            className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50">
            {addCoupon.isPending ? "שומר..." : "שמור קופון"}
          </button>
        </div>
      </AddItemDrawer>
    </div>
  );
}
