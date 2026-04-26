import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Ticket, Plus, X, Copy, CheckCircle2, Clock,
  Trash2, Tag, Store, Percent, AlertCircle,
} from "lucide-react";
import {
  useCoupons, useAddCoupon, useUpdateCoupon, useDeleteCoupon,
} from "@/hooks/use-coupons-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/coupons")({
  component: CouponsPage,
});

// ─── constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["מזון", "אופנה", "אלקטרוניקה", "קוסמטיקה", "ספורט", "בית", "תחבורה", "בריאות", "אחר"];
const CATEGORY_COLORS: Record<string, string> = {
  "מזון":        "#10b981",
  "אופנה":       "#ec4899",
  "אלקטרוניקה": "#3b82f6",
  "קוסמטיקה":   "#a78bfa",
  "ספורט":      "#f97316",
  "בית":        "#f59e0b",
  "תחבורה":     "#06b6d4",
  "בריאות":     "#22c55e",
  "אחר":        "#6b7280",
};
const CATEGORY_EMOJI: Record<string, string> = {
  "מזון": "🍔", "אופנה": "👗", "אלקטרוניקה": "💻", "קוסמטיקה": "💄",
  "ספורט": "🏃", "בית": "🏠", "תחבורה": "🚗", "בריאות": "💊", "אחר": "🎁",
};

// ─── Add Coupon Drawer ────────────────────────────────────────────────────────
function AddCouponDrawer({ onClose }: { onClose: () => void }) {
  const addCoupon = useAddCoupon();
  const [title, setTitle]           = useState("");
  const [code, setCode]             = useState("");
  const [store, setStore]           = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountVal, setDiscountVal]   = useState("");
  const [expiry, setExpiry]         = useState("");
  const [category, setCategory]     = useState("אחר");

  const handleSave = async () => {
    if (!title.trim()) return toast.error("כותרת הקופון חסרה");
    try {
      await addCoupon.mutateAsync({
        title,
        code: code || null,
        store: store || null,
        discount_percent: discountType === "percent" && discountVal ? Number(discountVal) : null,
        discount_amount:  discountType === "amount"  && discountVal ? Number(discountVal) : null,
        expiry_date: expiry || null,
        category,
      });
      toast.success("קופון נוסף ✅");
      onClose();
    } catch { toast.error("שגיאה בשמירה"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-white/10 bg-[#0a0c10]/97 backdrop-blur-2xl p-5 space-y-4 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">קופון חדש 🎟️</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-xl bg-white/8 flex items-center justify-center text-white/50"><X className="h-4 w-4" /></button>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-white/40">קטגוריה</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all`}
                style={category === c
                  ? { borderColor: CATEGORY_COLORS[c], background: CATEGORY_COLORS[c] + "22", color: CATEGORY_COLORS[c] }
                  : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
                <span>{CATEGORY_EMOJI[c]}</span>{c}
              </button>
            ))}
          </div>
        </div>

        {/* Title + Store */}
        <div className="grid grid-cols-2 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם הקופון..."
            className="col-span-2 bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-500/40"
            dir="rtl" />
          <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="חנות / מותג"
            className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-500/40"
            dir="rtl" />
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="קוד (SAVE20)"
            className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-500/40 font-mono tracking-widest"
            dir="ltr" />
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-white/40">הנחה</p>
          <div className="flex gap-2">
            <button onClick={() => setDiscountType("percent")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${discountType === "percent" ? "border-amber-500/50 bg-amber-500/12 text-amber-300" : "border-white/10 text-white/30"}`}>
              <Percent className="h-3 w-3" />אחוז
            </button>
            <button onClick={() => setDiscountType("amount")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${discountType === "amount" ? "border-amber-500/50 bg-amber-500/12 text-amber-300" : "border-white/10 text-white/30"}`}>
              ₪ סכום
            </button>
            <input type="number" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)}
              placeholder={discountType === "percent" ? "20" : "50"}
              className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none text-center"
              dir="ltr" />
          </div>
        </div>

        {/* Expiry */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-white/40">תוקף עד</p>
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/40" />
        </div>

        <button onClick={handleSave} disabled={addCoupon.isPending}
          className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)]">
          {addCoupon.isPending ? "שומר..." : "הוסף קופון 🎟️"}
        </button>
      </div>
    </div>
  );
}

// ─── Coupon Card ──────────────────────────────────────────────────────────────
function CouponCard({ coupon }: { coupon: any }) {
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [copied, setCopied] = useState(false);

  const catColor = CATEGORY_COLORS[coupon.category] ?? "#6b7280";
  const catEmoji = CATEGORY_EMOJI[coupon.category] ?? "🎁";

  const expiry    = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
  const daysLeft  = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  const handleCopy = async () => {
    if (!coupon.code) return;
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(`הקוד "${coupon.code}" הועתק!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleUsed = async () => {
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, is_used: !coupon.is_used });
      toast.success(coupon.is_used ? "קופון סומן כלא בשימוש" : "קופון סומן כבשימוש ✅");
    } catch { toast.error("שגיאה בעדכון"); }
  };

  return (
    <div className={`rounded-3xl overflow-hidden border transition-all ${coupon.is_used || isExpired ? "opacity-50 border-white/5" : "border-white/10"}`}
      style={{ background: `linear-gradient(135deg, ${catColor}18 0%, rgba(255,255,255,0.04) 100%)` }}>

      {/* Top strip */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{catEmoji}</span>
              {coupon.store && <span className="text-[10px] font-bold text-white/40 truncate">{coupon.store}</span>}
            </div>
            <p className="text-sm font-black text-white leading-tight">{coupon.title}</p>
          </div>

          {/* Discount badge */}
          <div className="shrink-0 rounded-2xl px-3 py-2 text-center" style={{ background: catColor + "30", border: `1px solid ${catColor}40` }}>
            {coupon.discount_percent ? (
              <><p className="text-xl font-black leading-none" style={{ color: catColor }}>{coupon.discount_percent}%</p><p className="text-[8px] text-white/40">הנחה</p></>
            ) : coupon.discount_amount ? (
              <><p className="text-xl font-black leading-none" style={{ color: catColor }}>₪{coupon.discount_amount}</p><p className="text-[8px] text-white/40">הנחה</p></>
            ) : (
              <Tag className="h-5 w-5" style={{ color: catColor }} />
            )}
          </div>
        </div>
      </div>

      {/* Dashed separator (coupon tear) */}
      <div className="relative flex items-center px-2 py-1">
        <div className="absolute -right-2 h-4 w-4 rounded-full bg-[#07030f]" />
        <div className="absolute -left-2 h-4 w-4 rounded-full bg-[#07030f]" />
        <div className="flex-1 border-t-2 border-dashed border-white/8" />
      </div>

      {/* Code + actions */}
      <div className="px-4 pb-4 pt-2 space-y-3">
        {coupon.code ? (
          <button onClick={handleCopy}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-dashed transition-all active:scale-[0.98]"
            style={{ borderColor: catColor + "50", background: catColor + "10" }}>
            <div className="flex items-center gap-2">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" style={{ color: catColor }} />}
              <span className="text-[10px]" style={{ color: catColor }}>{copied ? "הועתק!" : "לחץ להעתיק"}</span>
            </div>
            <span className="font-mono font-black text-base tracking-widest text-white">{coupon.code}</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center px-4 py-2.5 rounded-2xl border border-white/8 bg-white/4">
            <span className="text-xs text-white/30">ללא קוד — הנחה אוטומטית</span>
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Expiry indicator */}
            {expiry && (
              <div className={`flex items-center gap-1 text-[9px] font-bold ${isExpired ? "text-red-400" : expiringSoon ? "text-amber-400" : "text-white/35"}`}>
                {(isExpired || expiringSoon) && <AlertCircle className="h-2.5 w-2.5" />}
                <Clock className="h-2.5 w-2.5" />
                {isExpired
                  ? "פג תוקף"
                  : daysLeft === 0 ? "פג היום!"
                  : daysLeft === 1 ? "נגמר מחר"
                  : `עוד ${daysLeft} ימים`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleUsed}
              className={`text-[9px] px-2.5 py-1 rounded-full font-bold border transition-all ${coupon.is_used ? "border-white/10 text-white/30" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/8"}`}>
              {coupon.is_used ? "שחזר" : "✓ השתמשתי"}
            </button>
            <button onClick={() => deleteCoupon.mutate(coupon.id)}
              className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type CouponFilter = "all" | "active" | "used" | "expiring";

function CouponsPage() {
  const { data: coupons }  = useCoupons();
  const [filter, setFilter]       = useState<CouponFilter>("active");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  const now = Date.now();
  const filtered = (coupons ?? []).filter((c: any) => {
    const expiry   = c.expiry_date ? new Date(c.expiry_date).getTime() : null;
    const isExpired = expiry !== null && expiry < now;
    const expiringSoon = expiry !== null && !isExpired && expiry - now < 3 * 86400000;

    const statusOk =
      filter === "all"      ? true
      : filter === "active"  ? (!c.is_used && !isExpired)
      : filter === "used"    ? c.is_used
      : filter === "expiring"? (!c.is_used && expiringSoon)
      : true;

    const catOk = !catFilter || c.category === catFilter;
    return statusOk && catOk;
  });

  const activeCount    = (coupons ?? []).filter((c: any) => {
    const e = c.expiry_date ? new Date(c.expiry_date).getTime() : null;
    return !c.is_used && (e === null || e >= now);
  }).length;
  const expiringCount  = (coupons ?? []).filter((c: any) => {
    const e = c.expiry_date ? new Date(c.expiry_date).getTime() : null;
    return !c.is_used && e !== null && e >= now && e - now < 3 * 86400000;
  }).length;

  const FILTER_TABS: { key: CouponFilter; label: string }[] = [
    { key: "active",   label: `פעילים (${activeCount})`    },
    { key: "expiring", label: `פגים (${expiringCount})`    },
    { key: "used",     label: "שימשתי"                    },
    { key: "all",      label: `הכל (${(coupons ?? []).length})` },
  ];

  return (
    <>
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: "100vh",
        }}
      >
        <div className="absolute inset-0 bg-[#08070a]/88 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-amber-500/15 blur-[120px]" />
          <div className="absolute bottom-40 -left-16 h-60 w-60 rounded-full bg-orange-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32">
          {/* Header */}
          <div className="px-4 pt-5 pb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Ticket className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">קופונים 🎟️</h1>
                <p className="text-[11px] text-white/40 mt-0.5">{activeCount} קופונים פעילים{expiringCount > 0 ? ` · ${expiringCount} פגים בקרוב` : ""}</p>
              </div>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="h-11 w-11 rounded-2xl bg-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-400 active:scale-95 transition-all">
              <Plus className="h-5 w-5 text-black" />
            </button>
          </div>

          {/* Category filter */}
          <div className="px-4 pb-1">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setCatFilter(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${!catFilter ? "border-amber-500/60 bg-amber-500/15 text-amber-300" : "border-white/10 text-white/35"}`}>
                הכל
              </button>
              {CATEGORIES.filter((c) => (coupons ?? []).some((cp: any) => cp.category === c)).map((c) => (
                <button key={c} onClick={() => setCatFilter(catFilter === c ? null : c)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all`}
                  style={catFilter === c
                    ? { borderColor: CATEGORY_COLORS[c], background: CATEGORY_COLORS[c] + "22", color: CATEGORY_COLORS[c] }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
                  <span>{CATEGORY_EMOJI[c]}</span>{c}
                </button>
              ))}
            </div>
          </div>

          {/* Filter tab bar */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5">
              {FILTER_TABS.map((t) => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                    filter === t.key ? "bg-amber-500 text-black shadow-lg" : "text-white/40 hover:text-white/70"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon cards */}
          <div className="px-4 pt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <span className="text-6xl">🎟️</span>
                <p className="text-white/50 font-bold text-sm">אין קופונים כרגע</p>
                <button onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all">
                  <Plus className="h-3.5 w-3.5" />הוסף קופון ראשון
                </button>
              </div>
            ) : (
              filtered.map((c: any) => <CouponCard key={c.id} coupon={c} />)
            )}
          </div>
        </div>
      </div>

      {showAdd && <AddCouponDrawer onClose={() => setShowAdd(false)} />}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
