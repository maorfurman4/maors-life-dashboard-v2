import { useState, useRef } from "react";
import { Camera, Loader2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeImage } from "@/lib/gemini";
import { useAddExpense } from "@/hooks/use-finance-data";
import { toast } from "sonner";

interface ExtractedExpense {
  name: string;
  amount: number;
  category: string;
}

export function FinanceReceiptScanner() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedExpense[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const addExpense = useAddExpense();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const base64 = await fileToBase64(file);
      const prompt = `נתח את הקבלה בתמונה. החזר JSON בלבד (בלי markdown), מערך של: [{"name": "שם המוצר", "amount": מחיר_מספרי, "category": "קטגוריה מתוך: מזון/תחבורה/בידור/קניות/בריאות/אחר"}]. זהה את כל הפריטים.`;
      const result = await analyzeImage(base64.split(",")[1], file.type, prompt);
      const cleanJson = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const items: ExtractedExpense[] = JSON.parse(cleanJson);
      setExtracted(items);
      setSelected(items.map(() => true));
    } catch {
      toast.error("לא ניתן לנתח את הקבלה. נסה תמונה ברורה יותר.");
    } finally {
      setIsAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const toSave = extracted.filter((_, i) => selected[i]);
    for (const expense of toSave) {
      await addExpense.mutateAsync({
        amount: expense.amount,
        category: expense.category,
        description: expense.name,
        expense_type: "variable",
        date: new Date().toISOString().slice(0, 10),
        is_recurring: false,
        needs_review: false,
      });
    }
    toast.success(`${toSave.length} הוצאות נשמרו בהצלחה`);
    setExtracted([]);
    setSelected([]);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
          <Camera className="h-4 w-4 text-finance" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">סריקת קבלה</h3>
          <p className="text-xs text-muted-foreground">העלה תמונת קבלה לזיהוי אוטומטי</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {extracted.length === 0 ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <><Loader2 className="h-4 w-4 ml-2 animate-spin" />מנתח קבלה...</>
          ) : (
            <><Camera className="h-4 w-4 ml-2" />בחר תמונה</>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">בחר הוצאות לשמירה:</p>
          {extracted.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <button
                onClick={() => setSelected(s => s.map((v, j) => j === i ? !v : v))}
                className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 ${selected[i] ? "bg-finance border-finance text-white" : "border-border"}`}
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
              <Plus className="h-4 w-4 ml-1" />שמור {selected.filter(Boolean).length} הוצאות
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
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
