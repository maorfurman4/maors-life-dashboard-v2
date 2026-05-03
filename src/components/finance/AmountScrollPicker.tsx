import { useRef, useEffect, useState, useCallback } from "react";
import { Pencil, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";

interface AmountScrollPickerProps {
  value: number | null;
  onChange: (v: number) => void;
  color?: "expense" | "income";
}

const ITEM_H = 52;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2); // 2

function generateAmountItems(): number[] {
  const items: number[] = [];
  for (let i = 1; i <= 50; i++) items.push(i);
  for (let i = 55; i <= 200; i += 5) items.push(i);
  for (let i = 210; i <= 1000; i += 10) items.push(i);
  for (let i = 1100; i <= 5000; i += 100) items.push(i);
  for (let i = 5500; i <= 20000; i += 500) items.push(i);
  return items;
}

const ITEMS = generateAmountItems();

function closestIdx(target: number): number {
  let best = 0, bestDiff = Infinity;
  ITEMS.forEach((v, i) => {
    const d = Math.abs(v - target);
    if (d < bestDiff) { bestDiff = d; best = i; }
  });
  return best;
}

export function AmountScrollPicker({ value, onChange, color = "expense" }: AmountScrollPickerProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [localIdx, setLocalIdx] = useState<number>(() => {
    if (value != null && value > 0) return closestIdx(value);
    return ITEMS.indexOf(50); // default: ₪50
  });

  const listRef = useRef<HTMLDivElement>(null);
  const isSnapping = useRef(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  const accentColor = color === "expense" ? "#f87171" : "#34d399";
  const accentBg    = color === "expense" ? "rgba(248,113,113,0.10)" : "rgba(52,211,153,0.10)";
  const accentBorder= color === "expense" ? "rgba(248,113,113,0.30)" : "rgba(52,211,153,0.30)";

  // Scroll list to the given index
  const scrollToIdx = useCallback((idx: number, smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // On mount — set scroll position without animation
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    // small delay so the DOM is ready
    const t = setTimeout(() => scrollToIdx(localIdx, false), 30);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent whenever localIdx changes (only in wheel mode)
  useEffect(() => {
    if (!manualMode) onChange(ITEMS[localIdx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIdx, manualMode]);

  // After scroll ends — snap to nearest item
  const handleScroll = useCallback(() => {
    if (isSnapping.current) return;
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, ITEMS.length - 1));
      if (clamped !== localIdx) {
        isSnapping.current = true;
        setLocalIdx(clamped);
        el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
        setTimeout(() => { isSnapping.current = false; }, 300);
      }
    }, 120);
  }, [localIdx]);

  const goUp = () => {
    const next = Math.max(0, localIdx - 1);
    setLocalIdx(next);
    scrollToIdx(next, true);
  };
  const goDown = () => {
    const next = Math.min(ITEMS.length - 1, localIdx + 1);
    setLocalIdx(next);
    scrollToIdx(next, true);
  };

  const switchToManual = () => {
    setManualInput(value != null && value > 0 ? String(value) : "");
    setManualMode(true);
  };

  const switchToWheel = () => {
    setManualMode(false);
    setTimeout(() => scrollToIdx(localIdx, false), 50);
  };

  const handleManualChange = (raw: string) => {
    setManualInput(raw);
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      onChange(num);
      setLocalIdx(closestIdx(num));
    }
  };

  const wheelH = VISIBLE * ITEM_H;

  // ── Manual mode ──────────────────────────────────────────────────────────────
  if (manualMode) {
    return (
      <div className="w-full space-y-2" dir="rtl">
        <div className="relative">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₪</span>
          <input
            type="number"
            inputMode="numeric"
            value={manualInput}
            onChange={(e) => handleManualChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="הזן סכום"
            className="w-full pe-8 ps-3 py-3 rounded-xl border bg-secondary/30 text-2xl font-black focus:outline-none transition-colors border-border text-center"
            style={{ borderColor: manualInput ? accentBorder : undefined, color: accentColor }}
            dir="ltr"
            autoFocus
          />
        </div>
        <button
          onClick={switchToWheel}
          className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors mx-auto"
          style={{ color: accentColor }}
        >
          <RotateCcw className="h-3 w-3" />
          חזור לגלגל
        </button>
      </div>
    );
  }

  // ── Wheel mode ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-1" dir="rtl">

      {/* Up arrow */}
      <button
        onClick={goUp}
        className="flex items-center justify-center w-10 h-8 rounded-xl transition-all active:scale-90"
        style={{ color: accentColor, background: accentBg }}
        aria-label="הגדל"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* The drum wheel */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: 200,
          height: wheelH,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${accentBorder}`,
        }}
      >
        {/* Center selection band */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10"
          style={{
            top: CENTER * ITEM_H,
            height: ITEM_H,
            borderTop: `1px solid ${accentBorder}`,
            borderBottom: `1px solid ${accentBorder}`,
            background: accentBg,
          }}
        />

        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none z-10"
          style={{ height: ITEM_H * 1.6, background: "linear-gradient(to bottom, rgba(10,10,15,0.85), transparent)" }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
          style={{ height: ITEM_H * 1.6, background: "linear-gradient(to top, rgba(10,10,15,0.85), transparent)" }}
        />

        {/* Scrollable list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll"
          style={{
            paddingTop: CENTER * ITEM_H,
            paddingBottom: CENTER * ITEM_H,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          {ITEMS.map((item, i) => {
            const dist = Math.abs(i - localIdx);
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.2 : 0.08;
            const scale  = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76;
            const isCenter = dist === 0;
            return (
              <div
                key={i}
                onPointerDown={() => {
                  // tap to select
                  setLocalIdx(i);
                  scrollToIdx(i, true);
                }}
                className="flex items-center justify-center font-black select-none cursor-pointer"
                style={{
                  height: ITEM_H,
                  opacity,
                  transform: `scale(${scale})`,
                  color: isCenter ? accentColor : "#fff",
                  fontSize: isCenter ? 22 : 16,
                  transition: "opacity 0.15s, transform 0.15s",
                }}
              >
                <span dir="ltr">₪{item.toLocaleString("he-IL")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Down arrow */}
      <button
        onClick={goDown}
        className="flex items-center justify-center w-10 h-8 rounded-xl transition-all active:scale-90"
        style={{ color: accentColor, background: accentBg }}
        aria-label="הקטן"
      >
        <ChevronDown className="h-5 w-5" />
      </button>

      {/* Manual entry link */}
      <button
        onClick={switchToManual}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-white transition-colors mt-1"
      >
        <Pencil className="h-3 w-3" />
        הזן ידנית
      </button>
    </div>
  );
}
