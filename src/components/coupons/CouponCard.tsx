import { Copy, Check, Trash2, Tag } from "lucide-react";
import { useState } from "react";
import { useMarkCouponUsed, useDeleteCoupon } from "@/hooks/use-coupons";
import { toast } from "sonner";

interface CouponCardProps {
  coupon: {
    id: string;
    title: string;
    store?: string | null;
    code?: string | null;
    discount_amount?: number | null;
    discount_percent?: number | null;
    expiry_date?: string | null;
    category?: string | null;
    notes?: string | null;
    is_used?: boolean | null;
  };
}

function getExpiryColor(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "text-muted-foreground";
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "text-rose-400";
  if (days < 7) return "text-rose-400";
  if (days < 30) return "text-yellow-400";
  return "text-emerald-400";
}

function getExpiryLabel(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "";
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "פג תוקף";
  if (days === 0) return "פג היום";
  if (days === 1) return "נפקע מחר";
  if (days < 7) return `${days} ימים`;
  return new Date(expiryDate).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

const CATEGORY_ICONS: Record<string, string> = {
  "סופרמרקט": "🛒",
  "ביגוד": "👕",
  "מסעדות": "🍽️",
  "תרופות": "💊",
  "אחר": "🏷️",
};

export function CouponCard({ coupon }: CouponCardProps) {
  const [copied, setCopied] = useState(false);
  const markUsed = useMarkCouponUsed();
  const deleteCoupon = useDeleteCoupon();

  const handleCopy = async () => {
    if (!coupon.code) return;
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success("קוד הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkUsed = () => {
    markUsed.mutate(coupon.id);
    toast.success("קופון סומן כמשומש");
  };

  const handleDelete = () => {
    deleteCoupon.mutate(coupon.id);
  };

  const expiryColor = getExpiryColor(coupon.expiry_date);
  const isExpired = coupon.expiry_date
    ? new Date(coupon.expiry_date).getTime() < Date.now()
    : false;

  return (
    <div className={`rounded-2xl bg-card border border-border p-4 space-y-3 transition-opacity ${coupon.is_used || isExpired ? "opacity-50" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center flex-shrink-0 text-base">
            {CATEGORY_ICONS[coupon.category || "אחר"] ?? "🏷️"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{coupon.title}</p>
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

      {/* Code + expiry */}
      <div className="flex items-center justify-between">
        {coupon.code ? (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-mono font-medium hover:bg-secondary/80 transition-colors"
            disabled={!!coupon.is_used}
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            {coupon.code}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">ללא קוד</span>
        )}

        {coupon.expiry_date && (
          <span className={`text-xs font-medium ${expiryColor}`}>
            {getExpiryLabel(coupon.expiry_date)}
          </span>
        )}
      </div>

      {/* Category + status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {coupon.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            {coupon.category}
          </span>
        )}
        {coupon.is_used && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            משומש
          </span>
        )}
        {isExpired && !coupon.is_used && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 font-medium">
            פג תוקף
          </span>
        )}
      </div>

      {coupon.notes && (
        <p className="text-xs text-muted-foreground">{coupon.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {!coupon.is_used && (
          <button
            onClick={handleMarkUsed}
            disabled={markUsed.isPending}
            className="flex-1 text-xs py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            סמן כמשומש
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteCoupon.isPending}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
