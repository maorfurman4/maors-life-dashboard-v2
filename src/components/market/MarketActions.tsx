import { useState } from "react";
import { ArrowUpDown, Plus, Minus } from "lucide-react";
import { AddHoldingDrawer } from "@/components/market/AddHoldingDrawer";

export function MarketActions() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/15 transition-colors min-h-[44px]"
        >
          <Plus className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">קנייה</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400/15 transition-colors min-h-[44px]">
          <Minus className="h-5 w-5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-400">מכירה</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl bg-market/10 border border-market/20 hover:bg-market/15 transition-colors min-h-[44px]">
          <ArrowUpDown className="h-5 w-5 text-market" />
          <span className="text-xs font-semibold text-market">המרה</span>
        </button>
      </div>
      <AddHoldingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
