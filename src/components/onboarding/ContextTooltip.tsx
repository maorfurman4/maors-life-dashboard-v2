import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface ContextTooltipProps {
  text: string;
}

export function ContextTooltip({ text }: ContextTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="מידע נוסף"
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl backdrop-blur-md bg-white/10 border border-white/15 px-4 py-3 text-xs text-white/90 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
          dir="rtl"
        >
          {text}
          {/* Arrow */}
          <div className="absolute top-full right-3 border-4 border-transparent border-t-white/15" />
        </div>
      )}
    </div>
  );
}
