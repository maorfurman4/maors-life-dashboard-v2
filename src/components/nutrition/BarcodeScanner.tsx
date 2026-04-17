import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, Loader2, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setError(null);
    setStarting(true);

    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("המצלמה אינה נתמכת בדפדפן זה");
        }
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result && mounted) {
              const text = result.getText();
              controls.stop();
              onDetected(text);
            }
          }
        );
        controlsRef.current = controls;
        if (mounted) setStarting(false);
      } catch (e: any) {
        console.error("Camera error:", e);
        if (!mounted) return;
        const msg = e?.name === "NotAllowedError"
          ? "אין הרשאה לגישה למצלמה — אשר במכשיר ובדפדפן"
          : e?.name === "NotFoundError"
          ? "לא נמצאה מצלמה במכשיר"
          : e?.message || "שגיאה בהפעלת המצלמה";
        setError(msg);
        setStarting(false);
      }
    })();

    return () => {
      mounted = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-nutrition" />
          <h3 className="text-sm font-bold">סריקת ברקוד</h3>
        </div>
        <button onClick={onClose} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Targeting frame */}
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-44 border-2 border-nutrition rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
        )}

        {starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-nutrition" />
            <p className="text-sm">מפעיל מצלמה…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 text-sm"
            >
              סגור
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/80 text-white text-center text-xs">
        כוון את הברקוד אל תוך המסגרת
      </div>
    </div>
  );
}
