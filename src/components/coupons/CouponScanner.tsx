import { useState, useRef, useEffect } from "react";
import { ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CouponScannerProps {
  onScanned: (barcode: string) => void;
}

export function CouponScanner({ onScanned }: CouponScannerProps) {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  const startScan = async () => {
    try {
      const { BrowserBarcodeReader } = await import("@zxing/browser");
      const reader = new BrowserBarcodeReader();
      readerRef.current = reader;
      setScanning(true);

      // Small delay to allow the video element to render
      await new Promise(r => setTimeout(r, 100));

      if (!videoRef.current) return;

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            onScanned(text);
            toast.success(`ברקוד זוהה: ${text}`);
            stopScan();
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      toast.error("לא ניתן לגשת למצלמה");
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {}
      controlsRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  return (
    <div className="space-y-2">
      {!scanning ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={startScan}
        >
          <ScanLine className="h-4 w-4 ml-2" />
          סרוק ברקוד
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-finance rounded-xl opacity-70" />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={stopScan}
          >
            <X className="h-4 w-4 ml-2" />
            ביטול סריקה
          </Button>
        </div>
      )}
    </div>
  );
}
