import { Copy, Check, Trash2, ShoppingBag } from "lucide-react";
import { useState, useCallback } from "react";
import { useMarkCouponUsed, useDeleteCoupon } from "@/hooks/use-coupons";
import { daysUntilExpiry, getCategoryMeta } from "@/lib/barcode-utils";
import { CouponBarcodeDisplay } from "./CouponBarcodeDisplay";
import { toast } from "sonner";

interface CouponCardProps {
  coupon: {
    id: string;
    title: string;
    store?: string | null;
    code?: string | null;
    barcode?: string | null;
    discount_amount?: number | null;
    discount_percent?: number | null;
    expiry_date?: string | null;
    category?: string | null;
    notes?: string | null;
    is_used?: boolean | null;
  };
  groceryHighlight?: boolean;
}

// ─── Expiry chip ──────────────────────────────────────────────────────────────

function ExpiryChip({ expiryDate }: { expiryDate: string | null | undefined }) {
  if (!expiryDate) return null;
  const days = daysUntilExpiry(expiryDate);

  if (days === null) return null;
  if (days < 0)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">פג תוקף</span>;
  if (days === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">פג היום</span>;
  if (days === 1) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">נפקע מחר</span>;
  if (days <= 7)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">⏰ {days} ימים</span>;

  const label = new Date(expiryDate).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{label}</span>;
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function CouponCard({ coupon, groceryHighlight = false }: CouponCardProps) {
  const [copied,   setCopied]   = useState(false);
  const [removing, setRemoving] = useState(false);
  const [checkout, setCheckout] = useState(false);

  const markUsed    = useMarkCouponUsed();
  const deleteCoupon = useDeleteCoupon();

  const meta      = getCategoryMeta(coupon.category);
  const days      = daysUntilExpiry(coupon.expiry_date);
  const isExpired = days !== null && days < 0;

  // ── Copy code ────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!coupon.code) return;
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success("קוד הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Mark used — instant visual removal, DB after 300 ms ─────────────────────
  const handleMarkUsed = useCallback(() => {
    setRemoving(true);
    setTimeout(() => {
      markUsed.mutate(coupon.id);
    }, 300);
  }, [coupon.id, markUsed]);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    deleteCoupon.mutate(coupon.id);
  };

  // Checkout display value: prefer barcode, fallback to code, then title
  const checkoutValue = coupon.barcode || coupon.code || coupon.title;

  return (
    <>
      <div
        className={`
          rounded-2xl bg-card border p-4 space-y-3
          transition-all duration-300
          ${removing        ? "opacity-0 scale-95 pointer-events-none"             : "opacity-100 scale-100"}
          ${groceryHighlight ? "border-emerald-400/40 ring-1 ring-emerald-400/20"   : "border-border"}
          ${coupon.is_used || isExpired ? "opacity-50" : ""}
        `}
        dir="rtl"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center flex-shrink-0 text-base">
              {meta.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold truncate" style={{ letterSpacing: 0 }}>{coupon.title}</p>
                {groceryHighlight && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 shrink-0">
                    🛒 ברשימה
                  </span>
                )}
              </div>
              {coupon.store && (
                <p className="text-xs text-muted-foreground truncate">{coupon.store}</p>
              )}
            </div>
          </div>

          {/* Discount badge */}
          <div className="flex-shrink-0">
            {coupon.discount_percent ? (
              <span className="text-sm font-bold text-finance bg-finance/10 px-2.5 py-1 rounded-lg">
                {coupon.discount_percent}%
              </span>
            ) : coupon.discount_amount ? (
              <span className="text-sm font-bold text-finance bg-finance/10 px-2.5 py-1 rounded-lg">
                ₪{coupon.discount_amount}
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Code + expiry ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          {coupon.code ? (
            <button
              onClick={handleCopy}
              disabled={!!coupon.is_used}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-mono font-medium hover:bg-secondary/80 transition-colors"
            >
              {copied
                ? <Check className="h-3 w-3 text-emerald-400" />
                : <Copy className="h-3 w-3 text-muted-foreground" />}
              {coupon.code}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">ללא קוד</span>
          )}

          <ExpiryChip expiryDate={coupon.expiry_date} />
        </div>

        {/* ── Notes ───────────────────────────────────────────────────────────── */}
        {coupon.notes && (
          <p className="text-xs text-muted-foreground">{coupon.notes}</p>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────────── */}
        {!coupon.is_used && !isExpired && (
          <div className="flex gap-2 pt-1">
            {/* Checkout / barcode display */}
            {checkoutValue && (
              <button
                onClick={() => setCheckout(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-finance text-finance-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                מצב קופה
              </button>
            )}

            {/* Mark used */}
            <button
              onClick={handleMarkUsed}
              disabled={markUsed.isPending}
              className="flex-1 text-xs py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              מימשתי
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleteCoupon.isPending}
              className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Used state actions (delete only) */}
        {(coupon.is_used || isExpired) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleDelete}
              disabled={deleteCoupon.isPending}
              className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Checkout modal ─────────────────────────────────────────────────────── */}
      {checkout && checkoutValue && (
        <CouponBarcodeDisplay
          couponTitle={coupon.title}
          code={coupon.code}
          barcode={coupon.barcode}
          store={coupon.store}
          onClose={() => setCheckout(false)}
        />
      )}
    </>
  );
}
