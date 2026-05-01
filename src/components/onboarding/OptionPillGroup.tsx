import { useEffect, useRef } from "react";
import { OptionPill } from "./OptionPill";
import type { OptionPillProps } from "./OptionPill";

// Any option label that IS "אחר" or ends with " אחר" triggers the custom input
const isOtherOption = (item: string) =>
  item === "אחר" || item.endsWith(" אחר");

// ─── Multi-select variant ──────────────────────────────────────────────────────

interface MultiProps {
  mode: "multi";
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
  customValue: string;
  onCustomChange: (text: string) => void;
  variant?: OptionPillProps["variant"];
  maxSelect?: number;
  disabledWhen?: string; // item label that disables all others when active
}

// ─── Single-select variant ─────────────────────────────────────────────────────

interface SingleProps {
  mode: "single";
  options: string[];
  value: string;
  onChange: (item: string) => void;
  customValue: string;
  onCustomChange: (text: string) => void;
  variant?: OptionPillProps["variant"];
}

type Props = MultiProps | SingleProps;

// ─── Shared custom input ───────────────────────────────────────────────────────

function OtherInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="פרט/י כאן..."
      dir="rtl"
      className="w-full mt-3 rounded-2xl backdrop-blur-md bg-white/10 border border-white/15 px-4 py-3 text-white text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all animate-in fade-in slide-in-from-top-1 duration-200"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OptionPillGroup(props: Props) {
  if (props.mode === "multi") {
    const { options, selected, onToggle, customValue, onCustomChange, variant, maxSelect, disabledWhen } = props;
    const hasNoneActive = disabledWhen ? selected.includes(disabledWhen) : false;
    const maxReached = maxSelect !== undefined && selected.length >= maxSelect;
    const otherActive = selected.some(isOtherOption);

    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isActive = selected.includes(opt);
            const isDisabled =
              (!isActive && hasNoneActive && opt !== disabledWhen) ||
              (!isActive && maxReached);
            return (
              <OptionPill
                key={opt}
                label={opt}
                active={isActive}
                disabled={isDisabled}
                variant={isOtherOption(opt) ? "none" : variant}
                onClick={() => onToggle(opt)}
              />
            );
          })}
        </div>
        {otherActive && (
          <OtherInput value={customValue} onChange={onCustomChange} />
        )}
      </div>
    );
  }

  // Single-select
  const { options, value, onChange, customValue, onCustomChange, variant } = props;
  const otherActive = isOtherOption(value);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <OptionPill
            key={opt}
            label={opt}
            active={value === opt}
            variant={isOtherOption(opt) ? "none" : variant}
            onClick={() => onChange(value === opt ? "" : opt)}
          />
        ))}
      </div>
      {otherActive && (
        <OtherInput value={customValue} onChange={onCustomChange} />
      )}
    </div>
  );
}
