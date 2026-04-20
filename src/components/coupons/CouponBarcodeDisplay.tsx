import { useEffect, useRef, useState } from "react";
import { Copy, Check, X, Maximize2, Sun } from "lucide-react";
import { renderBarcodeSvg, renderQrSvg, detectDisplayFormat } from "@/lib/barcode-utils";
import { toast } from "sonner";

interface Props {
  couponTitle: string;
  code: string | null | undefined;
  barcode: string | null | undefined;
  store?: string | null;
  onClose: () => void;
}

export function CouponBarcodeDisplay({ couponTitle, code, barcode, store, onClose }: Props) {
  const value         = barcode || code || "";
  const format        = detectDisplayFormat(value);
  const barcodeSvg    = format === "barcode" ? renderBarcodeSvg(value, 100) : null;
  const qrSvg         = format === "qr"      ? renderQrSvg(value, 220)      : null;
  const [copied, setCopied] = useState(false);
  const wakeLockRef   = useRef<WakeLockSentinel | null>(null);

  // Acquire screen wake lock so screen doesn't dim at checkout
  useEffect(() => {
    if ("wakeLock" in navigator) {
      (navigator as any).wakeLock
        .request("screen")
        .then((lock: WakeLockSentinel) => { wakeLockRef.current = lock; })
        .catch(() => {/* permission denied or not supported */});
    }
    return () => { wakeLockRef.current?.release(); };
  }, []);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("קוד הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* Force light background regardless of app theme — scanners need max contrast */
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      style={{ fontFamily: "Heebo, Rubik, sans-serif" }}
      dir="rtl"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <X className="h-5 w-5 text-gray-600" />
      </button>

      {/* Brightness hint */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Sun className="h-3.5 w-3.5" />
        <span>הגדל בהירות מסך</span>
      </div>

      <div className="w-full max-w-sm px-6 space-y-6 text-center">
        {/* Store + title */}
        <div>
          {store && <p className="text-xs text-gray-400 mb-0.5">{store}</p>}
          <h2 className="text-base font-bold text-gray-800" style={{ letterSpacing: 0 }}>
            {couponTitle}
          </h2>
        </div>

        {/* Barcode / QR / Text display */}
        {barcodeSvg ? (
          <div className="border border-gray-100 rounded-xl overflow-hidden p-4 bg-white">
            <div
              className="w-full"
              style={{ minHeight: 100 }}
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
            <p className="text-xs text-gray-400 font-mono mt-2 tracking-widest">{value}</p>
          </div>
        ) : qrSvg ? (
          <div className="flex justify-center border border-gray-100 rounded-xl p-4 bg-white">
            <div
              style={{ width: 220, height: 220 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        ) : (
          /* Text code — large + copy-friendly */
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 bg-gray-50">
            <p
              className="text-3xl font-mono font-bold tracking-widest text-gray-800 break-all"
              dir="ltr"
            >
              {value || "—"}
            </p>
          </div>
        )}

        {/* Copy button */}
        {value && (
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            {copied
              ? <><Check className="h-4 w-4 text-emerald-400" /> הועתק!</>
              : <><Copy className="h-4 w-4" /> העתק קוד</>}
          </button>
        )}

        {/* Format badge */}
        <p className="text-[10px] text-gray-300 uppercase tracking-wider">
          {format === "barcode" ? "CODE 128 · ניתן לסריקה" : format === "qr" ? "QR Code · ניתן לסריקה" : "קוד טקסט"}
        </p>
      </div>

      {/* Expand hint */}
      <div className="absolute bottom-6 flex items-center gap-1.5 text-[11px] text-gray-300">
        <Maximize2 className="h-3 w-3" />
        <span>סגור לחזרה</span>
      </div>
    </div>
  );
}
