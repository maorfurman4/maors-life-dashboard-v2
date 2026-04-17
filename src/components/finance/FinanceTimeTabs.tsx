import { useState } from "react";

const periods = [
  { key: "daily", label: "יומי" },
  { key: "weekly", label: "שבועי" },
  { key: "monthly", label: "חודשי" },
] as const;

type Period = (typeof periods)[number]["key"];

export function FinanceTimeTabs({ onChange }: { onChange?: (period: Period) => void }) {
  const [active, setActive] = useState<Period>("monthly");

  return (
    <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => { setActive(p.key); onChange?.(p.key); }}
          className={`flex-1 text-sm font-medium py-2 px-2 md:px-3 rounded-lg transition-all min-h-[40px] ${
            active === p.key
              ? "bg-finance/20 text-finance shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
