import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";

interface AddPayslipDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AddPayslipDrawer({ open, onClose }: AddPayslipDrawerProps) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [grossActual, setGrossActual] = useState("");
  const [netActual, setNetActual] = useState("");
  const [unionActual, setUnionActual] = useState("");
  const [pensionActual, setPensionActual] = useState("");
  const [eduActual, setEduActual] = useState("");

  const handleSave = () => {
    onClose();
    setGrossActual("");
    setNetActual("");
    setUnionActual("");
    setPensionActual("");
    setEduActual("");
  };

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הזן תלוש שכר">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">חודש</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-work" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ברוטו בפועל (₪)</label>
            <input type="number" value={grossActual} onChange={(e) => setGrossActual(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-work" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">נטו בפועל (₪)</label>
            <input type="number" value={netActual} onChange={(e) => setNetActual(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-work" dir="ltr" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">ניכויים בפועל</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">הסתדרות</label>
              <input type="number" value={unionActual} onChange={(e) => setUnionActual(e.target.value)} placeholder="0"
                className="w-full px-2 py-2 rounded-lg border border-border bg-card text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-work" dir="ltr" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">פנסיה</label>
              <input type="number" value={pensionActual} onChange={(e) => setPensionActual(e.target.value)} placeholder="0"
                className="w-full px-2 py-2 rounded-lg border border-border bg-card text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-work" dir="ltr" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">קה"ש</label>
              <input type="number" value={eduActual} onChange={(e) => setEduActual(e.target.value)} placeholder="0"
                className="w-full px-2 py-2 rounded-lg border border-border bg-card text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-work" dir="ltr" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3 rounded-xl bg-work text-work-foreground font-bold text-sm hover:opacity-90 transition-opacity">
          שמור תלוש
        </button>
      </div>
    </AddItemDrawer>
  );
}
