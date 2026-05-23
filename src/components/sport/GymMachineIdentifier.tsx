import { useState } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { EXERCISE_LIBRARY, type LibraryExercise, type MuscleGroup, MUSCLE_LABELS } from "@/lib/exercise-library";

interface GymMachineIdentifierProps {
  open: boolean;
  onClose: () => void;
}

const MUSCLE_OPTIONS: { key: MuscleGroup; label: string; emoji: string }[] = [
  { key: "chest",     label: "חזה",        emoji: "💪" },
  { key: "back",      label: "גב",         emoji: "🦾" },
  { key: "shoulders", label: "כתפיים",     emoji: "🏋️" },
  { key: "biceps",    label: "יד קדמית",   emoji: "💪" },
  { key: "triceps",   label: "יד אחורית",  emoji: "💪" },
  { key: "legs",      label: "רגליים",     emoji: "🦵" },
  { key: "glutes",    label: "ישבן",       emoji: "🍑" },
  { key: "core",      label: "בטן/ליבה",   emoji: "🎯" },
];

const toBase64 = (file: File): Promise<{ data: string; mimeType: string }> =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      res({ data, mimeType });
    };
    reader.onerror = rej;
  });

export default function GymMachineIdentifier({ open, onClose }: GymMachineIdentifierProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ machineName: string; howToUse: string; equipmentKeywords: string[] } | null>(null);
  const [matchedExercises, setMatchedExercises] = useState<LibraryExercise[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setStep(2);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!imageFile || !selectedMuscle) return;
    setLoading(true);
    setError(null);
    setStep(3);
    try {
      const b64 = await toBase64(imageFile);
      const { data, error: fnError } = await supabase.functions.invoke("identify-machine", {
        body: { imageBase64: b64.data, mimeType: b64.mimeType, muscleGroup: MUSCLE_LABELS[selectedMuscle] },
      });
      if (fnError) throw new Error(fnError.message);
      setResult(data);
      // Filter exercises from library by muscle group
      const matched = EXERCISE_LIBRARY.filter((ex) =>
        ex.muscleGroups.includes(selectedMuscle) || ex.primaryMuscle === selectedMuscle
      ).slice(0, 8);
      setMatchedExercises(matched);
    } catch (err: any) {
      setError(err.message || "שגיאה בזיהוי המכונה");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setStep(1);
    setImageFile(null);
    setImagePreviewUrl(null);
    setSelectedMuscle(null);
    setResult(null);
    setMatchedExercises([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleReset(); onClose(); } }}>
      <DialogContent className="max-w-lg w-full bg-gray-900 border-white/10 text-white max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-400" />
            זיהוי מכונת כושר
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm text-right">צלם או העלה תמונה של מכונת הכושר</p>
            <label className="block">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="flex flex-col items-center justify-center gap-3 h-48 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-500/50 cursor-pointer transition-colors bg-white/5">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-white/40" />
                </div>
                <p className="text-sm text-white/50 font-medium">לחץ להעלאת תמונה</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 2: Select muscle */}
        {step === 2 && imagePreviewUrl && (
          <div className="space-y-4">
            <div className="relative h-36 rounded-xl overflow-hidden">
              <img src={imagePreviewUrl} alt="מכונה" className="w-full h-full object-cover" />
              <button
                onClick={handleReset}
                className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <p className="text-white/70 text-sm font-bold text-right">לאיזה שריר תרצה להשתמש במכונה זו?</p>
            <div className="grid grid-cols-2 gap-2">
              {MUSCLE_OPTIONS.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  onClick={() => setSelectedMuscle(key)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    selectedMuscle === key
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!selectedMuscle}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold disabled:opacity-40 hover:bg-emerald-600 transition-colors"
            >
              זהה ומצא תרגילים
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="space-y-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="text-white/60 text-sm">מנתח את המכונה...</p>
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm text-right">
                {error}
              </div>
            )}
            {result && !loading && (
              <>
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2">
                  <h3 className="font-black text-emerald-400 text-right text-base">{result.machineName}</h3>
                  <p className="text-white/70 text-sm text-right leading-relaxed">{result.howToUse}</p>
                </div>
                {matchedExercises.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider text-right">תרגילים מומלצים</p>
                    <div className="space-y-2">
                      {matchedExercises.map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex gap-1 flex-wrap justify-end">
                            {ex.equipment.slice(0, 2).map((eq) => (
                              <span key={eq} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">{eq}</span>
                            ))}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{ex.name}</p>
                            <p className="text-xs text-white/40">{ex.defaultSets} סטים × {ex.defaultReps} חזרות</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-bold hover:bg-white/5 transition-colors"
            >
              נסה מכונה אחרת
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
