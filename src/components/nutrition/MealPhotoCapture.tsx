import { useRef, useState } from "react";
import { Camera, FolderOpen, Image, Loader2, Sparkles, X } from "lucide-react";
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
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading]       = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLoading(true);
    try {
      const base64 = await compressImageToBase64(file);
      const meal   = await recognizeMeal(base64);
      toast.success(`זוהה: ${meal.name}`);
      onRecognized(meal);
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      toast.error("שגיאה בזיהוי: " + (e?.message || "לא ידוע"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs — camera forces capture, gallery opens picker */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />

      {!previewUrl && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-nutrition" />
            AI יזהה ויחשב ערכים תזונתיים
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => cameraRef.current?.click()} disabled={loading}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-nutrition/10 border border-nutrition/25 text-nutrition text-[10px] font-bold hover:bg-nutrition/20 transition-colors disabled:opacity-50 min-h-[52px]">
              <Camera className="h-4 w-4" />
              מצלמה
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} disabled={loading}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-nutrition/10 border border-nutrition/25 text-nutrition text-[10px] font-bold hover:bg-nutrition/20 transition-colors disabled:opacity-50 min-h-[52px]">
              <Image className="h-4 w-4" />
              גלריה
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} disabled={loading}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-nutrition/10 border border-nutrition/25 text-nutrition text-[10px] font-bold hover:bg-nutrition/20 transition-colors disabled:opacity-50 min-h-[52px]">
              <FolderOpen className="h-4 w-4" />
              קבצים
            </button>
          </div>
        </div>
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
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
