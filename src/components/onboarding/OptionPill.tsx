interface OptionPillProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  variant?: "default" | "allergy" | "none";
  onClick: () => void;
}

const ACTIVE_CLASSES: Record<NonNullable<OptionPillProps["variant"]>, string> = {
  default: "bg-blue-500/70 border-blue-400/60 text-white",
  allergy: "bg-red-900/60 border-red-500/50 text-red-100",
  none:    "bg-white/20 border-white/30 text-white",
};

export function OptionPill({
  label,
  active,
  disabled = false,
  variant = "default",
  onClick,
}: OptionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 select-none",
        "active:scale-95",
        disabled
          ? "opacity-30 cursor-not-allowed"
          : "cursor-pointer hover:border-white/40",
        active
          ? ACTIVE_CLASSES[variant]
          : "bg-transparent border-white/20 text-white/70 hover:text-white hover:bg-white/10",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
