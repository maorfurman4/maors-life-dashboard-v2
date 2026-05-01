import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ScrollPickerProps {
  label: string;
  items: (string | number)[];
  value: number | null;
  unit?: string;
  onChange: (value: number) => void;
}

const ITEM_H = 44; // px per row
const VISIBLE = 5; // rows visible in wheel
const CENTER = Math.floor(VISIBLE / 2); // index of the selected row

export function ScrollPicker({ label, items, value, unit = "", onChange }: ScrollPickerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localIdx, setLocalIdx] = useState<number>(() => {
    if (value == null) return Math.floor(items.length / 2);
    const i = items.indexOf(value);
    return i >= 0 ? i : Math.floor(items.length / 2);
  });
  const listRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  // Sync scroll position when localIdx changes programmatically
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = localIdx * ITEM_H;
  }, [localIdx]);

  // Snap to nearest item on scroll end
  const handleScroll = () => {
    const el = listRef.current;
    if (!el || isDragging.current) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setLocalIdx(clamped);
  };

  const handleConfirm = () => {
    onChange(Number(items[localIdx]));
    setCollapsed(true);
  };

  const handleExpand = () => setCollapsed(false);

  // ── Collapsed pill ───────────────────────────────────────────────────────────
  if (collapsed && value != null) {
    return (
      <button
        onClick={handleExpand}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md bg-white/20 border border-white/25 text-white text-sm font-bold transition-all hover:bg-white/30 active:scale-95"
      >
        <span>{label}</span>
        <span className="text-white/60">·</span>
        <span>
          {value}
          {unit && <span className="text-white/60 text-xs ml-0.5">{unit}</span>}
        </span>
        <X className="h-3.5 w-3.5 text-white/50 hover:text-white ml-0.5" />
      </button>
    );
  }

  // ── Expanded wheel ───────────────────────────────────────────────────────────
  const wheelH = VISIBLE * ITEM_H;

  return (
    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-bold text-white/70">{label}</p>

      <div
        className="relative w-48 rounded-2xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10"
        style={{ height: wheelH }}
      >
        {/* Selection highlight band */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-y border-white/25 bg-white/10"
          style={{ top: CENTER * ITEM_H, height: ITEM_H }}
        />

        {/* Top / bottom fade masks */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10" />

        {/* Scrollable list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll scrollbar-none snap-y snap-mandatory"
          style={{
            paddingTop: CENTER * ITEM_H,
            paddingBottom: CENTER * ITEM_H,
            scrollbarWidth: "none",
          }}
        >
          {items.map((item, i) => {
            const dist = Math.abs(i - localIdx);
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : 0.2;
            const scale = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76;
            return (
              <div
                key={i}
                className="snap-center flex items-center justify-center text-white font-bold transition-all duration-150 cursor-pointer select-none"
                style={{ height: ITEM_H, opacity, transform: `scale(${scale})` }}
                onClick={() => {
                  setLocalIdx(i);
                  setTimeout(() => {
                    if (listRef.current) listRef.current.scrollTop = i * ITEM_H;
                  }, 0);
                }}
              >
                {item}
                {unit && <span className="text-white/50 text-xs ml-1">{unit}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="px-8 py-2 rounded-full bg-white text-gray-900 text-sm font-black transition-all hover:bg-white/90 active:scale-95"
      >
        אישור
      </button>
    </div>
  );
}
