import { useRef, useState } from "react";
import { Camera, FolderOpen, Loader2, Sparkles, Check } from "lucide-react";
import { useAddCoupon } from "@/hooks/use-coupons";
import { toast } from "sonner";

interface ExtractedCoupon {
  title: string;
  store: string;
  code: string;
  barcode: string;
  discount_amount: number | null;
  discount_percent: number | null;
  expiry_date: string;
  category: string;
  notes: string;
}

// ─── Visual Analysis stub ─────────────────────────────────────────────────────
// TODO: replace with real call:
//   import { analyzeImage } from "@/lib/gemini";
//   const result = await analyzeImage(base64, mimeType, COUPON_EXTRACTION_PROMPT);
//
// COUPON_EXTRACTION_PROMPT:
//   "You are a coupon data extractor. Analyze this coupon image and return JSON with:
//    { title, store, code, barcode, discount_amount (number|null), discount_percent (number|null),
//      expiry_date (YYYY-MM-DD|null), category (סופרמרקט|ביגוד|מסעדות|תרופות|אחר), notes }
//    Extract the numeric barcode/code visible in the image.
//    Respond ONLY with valid JSON, no markdown."

async function analyzeImageStub(_base64: string, _mimeType: string): Promise<ExtractedCoupon> {
  await new Promise((r) => setTimeout(r, 800)); // simulate API latency
  return {
    title: "זוהה מתמונה",
    store: "",
    code: "",
    barcode: "",
    discount_amount: null,
    discount_percent: null,
    expiry_date: "",
    category: "אחר",
    notes: "⚠️ ממתין לחיבור AI — ערוך ידנית",
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const CATEGORIES = ["סופרמרקט", "ביגוד", "מסעדות", "תרופות", "אלקטרוניקה", "בריאות", "אחר"];

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponImageAnalyzer() {
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [fields,    setFields]    = useState<ExtractedCoupon | null>(null);
  const [saving,    setSaving]    = useState(false);
  const addCoupon = useAddCoupon();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const dataUrl = await fileToBase64(file);
    setPreview(dataUrl);
    setAnalyzing(true);
    setFields(null);

    try {
      const base64 = dataUrl.split(",")[1];
      const result = await analyzeImageStub(base64, file.type);
      setFields(result);
    } catch {
      toast.error("שגיאה בניתוח תמונה");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!fields) return;
    setSaving(true);
    try {
      await addCoupon.mutateAsync({
        title:            fields.title   || "קופון מתמונה",
        store:            fields.store   || undefined,
        code:             fields.code    || undefined,
        barcode:          fields.barcode || undefined,
        discount_amount:  fields.discount_amount  ?? undefined,
        discount_percent: fields.discount_percent ?? undefined,
        expiry_date:      fields.expiry_date || undefined,
        category:         fields.category,
        notes:            fields.notes || undefined,
      });
      setFields(null);
      setPreview(null);
      toast.success("קופון נשמר מתמונה");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ExtractedCoupon, val: string) =>
    setFields((f) => f ? { ...f, [key]: val } : f);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-finance/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-finance" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>ניתוח קופון מתמונה</h3>
          <p className="text-[10px] text-muted-foreground">צלם / העלה — AI יחלץ את הנתונים</p>
        </div>
      </div>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {!fields && !analyzing && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-finance/30 hover:border-finance/60 hover:bg-finance/5 transition-colors min-h-[80px] group"
          >
            <Camera className="h-5 w-5 text-finance" />
            <span className="text-xs font-semibold text-finance">צלם קופון</span>
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-finance/30 hover:bg-finance/5 transition-colors min-h-[80px] group"
          >
            <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-finance transition-colors" />
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-finance transition-colors">מגלריה</span>
          </button>
        </div>
      )}

      {analyzing && (
        <div className="flex flex-col items-center gap-3 py-6">
          {preview && (
            <img src={preview} alt="" className="h-28 w-auto rounded-xl object-contain border border-border opacity-60" />
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-finance" />
            <span>מנתח תמונה...</span>
          </div>
        </div>
      )}

      {fields && (
        <div className="space-y-3">
          {preview && (
            <img src={preview} alt="" className="h-20 w-auto rounded-xl object-contain border border-border mx-auto" />
          )}

          <p className="text-[11px] font-semibold text-muted-foreground">ערוך לפני שמירה:</p>

          {[
            { key: "title"   as const, label: "שם קופון",      dir: "rtl" },
            { key: "store"   as const, label: "חנות",           dir: "rtl" },
            { key: "code"    as const, label: "קוד",            dir: "ltr" },
            { key: "barcode" as const, label: "ברקוד",          dir: "ltr" },
          ].map(({ key, label, dir }) => (
            <div key={key}>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">{label}</label>
              <input
                type="text"
                value={(fields[key] as string) || ""}
                onChange={(e) => set(key, e.target.value)}
                dir={dir as any}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-finance font-mono min-h-[36px]"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">הנחה ₪</label>
              <input type="number" value={fields.discount_amount ?? ""}
                onChange={(e) => setFields((f) => f ? { ...f, discount_amount: e.target.value ? Number(e.target.value) : null } : f)}
                dir="ltr" className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-finance min-h-[36px]" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">הנחה %</label>
              <input type="number" value={fields.discount_percent ?? ""}
                onChange={(e) => setFields((f) => f ? { ...f, discount_percent: e.target.value ? Number(e.target.value) : null } : f)}
                dir="ltr" className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-finance min-h-[36px]" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">תוקף עד</label>
            <input type="date" value={fields.expiry_date || ""}
              onChange={(e) => set("expiry_date", e.target.value)}
              dir="ltr" className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-finance min-h-[36px]" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => set("category", cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                  fields.category === cat ? "border-finance/50 bg-finance/10 text-finance" : "border-border text-muted-foreground"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "שומר..." : "שמור קופון"}
            </button>
            <button onClick={() => { setFields(null); setPreview(null); }}
              className="px-4 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary/40 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
