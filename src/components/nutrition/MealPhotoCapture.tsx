import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { recognizeMeal } from "@/lib/ai-service";
import { compressImageToBase64 } from "@/lib/image-utils";
import { toast } from "sonner";

interface MealPhotoCaptureProps {
  onRecognized: (meal: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    items: string[];
    confidence: string;
  }) => void;
}

export function MealPhotoCapture({ onRecognized }: MealPhotoCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLoading(true);
    try {
      const base64 = await compressImageToBase64(file);
      const meal = await recognizeMeal(base64);
      toast.success(`זוהה: ${meal.name}`);
      onRecognized(meal);
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      console.error(e);
      toast.error("שגיאה בזיהוי: " + (e?.message || "לא ידוע"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!previewUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-nutrition/20 to-nutrition/5 border border-nutrition/30 text-nutrition font-semibold text-sm hover:from-nutrition/30 transition-colors min-h-[48px] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <Camera className="h-4 w-4" />
          צלם ארוחה — AI יזהה ויחשב
        </button>
      )}

      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={previewUrl} alt="ארוחה" className="w-full h-40 object-cover" />
          {loading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-nutrition" />
              <p className="text-xs font-medium">AI מזהה את הארוחה…</p>
            </div>
          )}
          {!loading && (
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
