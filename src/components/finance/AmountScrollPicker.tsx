import { useRef, useEffect, useState, useCallback } from "react";
import { Pencil, RotateCcw } from "lucide-react";

interface AmountScrollPickerProps {
  value: number | null;
  onChange: (v: number) => void;
  color?: "expense" | "income";
}

const ITEM_H = 48;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

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

export function AmountScrollPicker({ value, onChange, color = "expense" }: AmountScrollPickerProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const initIdx = () => {
    if (value == null) return ITEMS.indexOf(50);
    const exact = ITEMS.indexOf(value);
    if (exact >= 0) return exact;
    // find closest
    let best = 0;
    let bestDiff = Infinity;
    ITEMS.forEach((v, i) => {
      const d = Math.abs(v - value);
      if (d < bestDiff) { bestDiff = d; best = i; }
    });
    return best;
  };

  const [localIdx, setLocalIdx] = useState<number>(initIdx);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentColor = color === "expense" ? "#f87171" : "#34d399";
  const accentBg = color === "expense" ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)";
  const accentBorder = color === "expense" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)";

  // Sync scroll when idx changes programmatically
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = localIdx * ITEM_H;
  }, [localIdx]);

  // Notify parent on idx change
  useEffect(() => {
    if (!manualMode) {
      onChange(ITEMS[localIdx]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIdx, manualMode]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, ITEMS.length - 1));
      setLocalIdx(clamped);
      el.scrollTop = clamped * ITEM_H;
    }, 80);
  }, []);

  const handleManualConfirm = () => {
    const num = parseFloat(manualInput);
    if (!isNaN(num) && num > 0) {
      onChange(num);
      // snap localIdx to closest item for when we go back
      let best = 0, bestDiff = Infinity;
      ITEMS.forEach((v, i) => {
        const d = Math.abs(v - num);
        if (d < bestDiff) { bestDiff = d; best = i; }
      });
      setLocalIdx(best);
    }
  };

  const switchToManual = () => {
    setManualInput(value != null && value > 0 ? String(value) : "");
    setManualMode(true);
  };

  const switchToWheel = () => {
    setManualMode(false);
    // restore scroll after mode switch
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = localIdx * ITEM_H;
    }, 50);
  };

  const wheelH = VISIBLE * ITEM_H;

  return (
    <div className="flex flex-col items-center gap-2" dir="rtl">
      {/* Current value display */}
      <div
        className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-black"
        style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}
      >
        <span dir="ltr">
          {manualMode && manualInput
            ? `₪${parseFloat(manualInput) > 0 ? Number(manualInput).toLocaleString("he-IL") : "0"}`
            : value != null && value > 0
              ? `₪${value.toLocaleString("he-IL")}`
              : "₪0"}
        </span>
      </div>

      {manualMode ? (
        /* ── Manual input mode ── */
        <div className="w-full space-y-2">
          <div className="relative">
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₪</span>
            <input
              type="number"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                const num = parseFloat(e.target.value);
                if (!isNaN(num) && num > 0) onChange(num);
              }}
              onBlur={handleManualConfirm}
              onKeyDown={(e) => e.key === "Enter" && handleManualConfirm()}
              placeholder="הזן סכום"
              className="w-full pe-8 ps-3 py-3 rounded-xl border bg-secondary/30 text-2xl font-black focus:outline-none transition-colors border-border"
              style={{ borderColor: manualInput ? accentBorder : undefined }}
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
      ) : (
        /* ── Scroll wheel mode ── */
        <>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: 160,
              height: wheelH,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Selection band */}
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

            {/* Fades */}
            <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: ITEM_H * 1.5, background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: ITEM_H * 1.5, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />

            {/* Scrollable list */}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory"
              style={{
                paddingTop: CENTER * ITEM_H,
                paddingBottom: CENTER * ITEM_H,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {ITEMS.map((item, i) => {
                const dist = Math.abs(i - localIdx);
                const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.15;
                const scale = dist === 0 ? 1 : dist === 1 ? 0.85 : 0.72;
                return (
                  <div
                    key={i}
                    className="snap-center flex items-center justify-center font-black cursor-pointer select-none transition-all duration-100"
                    style={{ height: ITEM_H, opacity, transform: `scale(${scale})`, color: dist === 0 ? accentColor : "#fff" }}
                    onClick={() => {
                      setLocalIdx(i);
                      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = i * ITEM_H; }, 0);
                    }}
                  >
                    <span dir="ltr">₪{item.toLocaleString("he-IL")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={switchToManual}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-white transition-colors"
          >
            <Pencil className="h-3 w-3" />
            הזן ידנית
          </button>
        </>
      )}
    </div>
  );
}
