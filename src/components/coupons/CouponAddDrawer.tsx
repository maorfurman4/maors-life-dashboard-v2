import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAddCoupon } from "@/hooks/use-coupons";
import { CouponScanner } from "./CouponScanner";
import { toast } from "sonner";

interface CouponAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = ["סופרמרקט", "ביגוד", "מסעדות", "תרופות", "אחר"];

export function CouponAddDrawer({ open, onOpenChange }: CouponAddDrawerProps) {
  const [title, setTitle] = useState("");
  const [store, setStore] = useState("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("אחר");
  const [notes, setNotes] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const addCoupon = useAddCoupon();

  const resetForm = () => {
    setTitle("");
    setStore("");
    setDiscountType("percent");
    setDiscountValue("");
    setExpiryDate("");
    setCode("");
    setBarcode("");
    setCategory("אחר");
    setNotes("");
    setShowScanner(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("יש להזין שם לקופון");
      return;
    }

    await addCoupon.mutateAsync({
      title: title.trim(),
      store: store.trim() || undefined,
      discount_amount: discountType === "amount" && discountValue ? Number(discountValue) : undefined,
      discount_percent: discountType === "percent" && discountValue ? Number(discountValue) : undefined,
      expiry_date: expiryDate || undefined,
      code: code.trim() || undefined,
      barcode: barcode.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleBarcodeScanned = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setShowScanner(false);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-right">הוסף קופון</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם הקופון *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: 20% הנחה בסופר"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
            />
          </div>

          {/* Store */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">חנות / מותג</label>
            <input
              type="text"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="למשל: שופרסל, זארה..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
            />
          </div>

          {/* Discount type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג הנחה</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  discountType === "percent"
                    ? "border-finance bg-finance/10 text-finance"
                    : "border-border text-muted-foreground"
                }`}
              >
                אחוז (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("amount")}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  discountType === "amount"
                    ? "border-finance bg-finance/10 text-finance"
                    : "border-border text-muted-foreground"
                }`}
              >
                סכום קבוע (₪)
              </button>
            </div>
          </div>

          {/* Discount value */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {discountType === "percent" ? "אחוז הנחה" : "סכום הנחה (₪)"}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "20" : "50"}
              min="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
              dir="ltr"
            />
          </div>

          {/* Expiry date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תאריך תפוגה</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance"
            />
          </div>

          {/* Code */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">קוד קופון</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SAVE20"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance font-mono"
              dir="ltr"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ברקוד</label>
            {barcode ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-secondary text-sm font-mono text-muted-foreground">
                  {barcode}
                </span>
                <button
                  type="button"
                  onClick={() => setBarcode("")}
                  className="text-xs text-muted-foreground hover:text-rose-400 transition-colors"
                >
                  נקה
                </button>
              </div>
            ) : (
              <CouponScanner onScanned={handleBarcodeScanned} />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">קטגוריה</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    category === cat
                      ? "border-finance bg-finance/10 text-finance"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">הערות</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="פרטים נוספים..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance resize-none"
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSave}
            disabled={addCoupon.isPending}
            className="w-full"
          >
            {addCoupon.isPending ? "שומר..." : "שמור קופון"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">ביטול</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
