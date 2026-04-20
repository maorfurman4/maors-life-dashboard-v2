import { useState, useRef } from "react";
import { Camera, FolderOpen, Loader2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddExpense } from "@/hooks/use-finance-data";
import { analyzeImage, parseGeminiJson } from "@/lib/gemini";
import { toast } from "sonner";

interface ExtractedExpense {
  name: string;
  amount: number;
  category: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const RECEIPT_PROMPT = `אתה מומחה OCR לקבלות ישראליות. נתח את תמונת הקבלה והחזר JSON בלבד — מערך של פריטי הוצאה.
פורמט כל פריט: { "name": "שם המוצר/שירות בעברית", "amount": מספר בשקלים, "category": קטגוריה }
קטגוריות אפשריות: "מזון", "תחבורה", "בריאות", "בידור", "קניות", "חשבונות", "אחר"
כללים:
- חלץ פריטים בודדים עם מחיריהם
- אל תכלול שורות סיכום, מע"מ, או כותרת החנות
- סכומים בשקלים ישראלים (ILS), ללא סימן מטבע
- אם המחיר לא ברור — אל תכלול את הפריט
- השב ONLY עם JSON array תקין, ללא markdown, ללא הסבר`;

// ─── Real Gemini Vision call ──────────────────────────────────────────────────

async function extractReceipt(base64: string, mimeType: string): Promise<ExtractedExpense[]> {
  const raw = await analyzeImage(base64, mimeType, RECEIPT_PROMPT);
  try {
    const parsed = parseGeminiJson<ExtractedExpense[]>(raw);
    return Array.isArray(parsed) ? parsed.filter((i) => i.name && i.amount > 0) : [];
  } catch {
    console.error("Receipt JSON parse failed:", raw);
    return [];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinanceReceiptScanner() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extracted,   setExtracted]   = useState<ExtractedExpense[]>([]);
  const [selected,    setSelected]    = useState<boolean[]>([]);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const addExpense = useAddExpense();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const dataUrl = await fileToBase64(file);
      // base64 only — strip the "data:[mime];base64," prefix
      const base64  = dataUrl.split(",")[1];
      const items   = await extractReceipt(base64, file.type);
      setExtracted(items);
      setSelected(items.map(() => true));
      if (items.length === 0) toast.info("לא זוהו פריטים בקבלה — נסה תמונה ברורה יותר");
      else toast.success(`זוהו ${items.length} פריטים`);
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בניתוח הקבלה — בדוק חיבור AI");
    } finally {
      setIsAnalyzing(false);
      if (cameraRef.current)  cameraRef.current.value  = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const toSave = extracted.filter((_, i) => selected[i]);
    for (const expense of toSave) {
      await addExpense.mutateAsync({
        amount:       expense.amount,
        category:     expense.category,
        description:  expense.name,
        expense_type: "variable",
        date:         new Date().toISOString().slice(0, 10),
        is_recurring: false,
        needs_review: false,
      });
    }
    toast.success(`${toSave.length} הוצאות נשמרו בהצלחה`);
    setExtracted([]);
    setSelected([]);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
          <Camera className="h-4 w-4 text-finance" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ letterSpacing: 0 }}>סריקת קבלה</h3>
          <p className="text-xs text-muted-foreground">AI מזהה פריטים אוטומטית · Gemini Vision</p>
        </div>
      </div>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {extracted.length === 0 ? (
        isAnalyzing ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-finance" />
            <span>מנתח קבלה עם Gemini Vision...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-finance/30 hover:border-finance/60 hover:bg-finance/5 transition-colors min-h-[90px] group"
            >
              <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center group-hover:bg-finance/20 transition-colors">
                <Camera className="h-5 w-5 text-finance" />
              </div>
              <span className="text-xs font-semibold text-finance">צלם קבלה</span>
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-finance/30 hover:bg-finance/5 transition-colors min-h-[90px] group"
            >
              <div className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-finance/10 transition-colors">
                <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-finance transition-colors" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-finance transition-colors">בחר מגלריה</span>
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">✅ זוהו {extracted.length} פריטים — בחר לשמירה:</p>
          {extracted.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <button
                onClick={() => setSelected((s) => s.map((v, j) => (j === i ? !v : v)))}
                className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                  selected[i] ? "bg-finance border-finance text-white" : "border-border"
                }`}
              >
                {selected[i] && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
              <span className="text-sm font-semibold">₪{item.amount}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={addExpense.isPending}>
              {addExpense.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Plus className="h-4 w-4 ms-1" />}
              שמור {selected.filter(Boolean).length} הוצאות
            </Button>
            <Button variant="outline" onClick={() => { setExtracted([]); setSelected([]); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
