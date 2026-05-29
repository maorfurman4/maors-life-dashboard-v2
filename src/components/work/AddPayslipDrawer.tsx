import { useState } from "react";
import { motion } from "framer-motion";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { haptics } from "@/lib/haptics";

interface AddPayslipDrawerProps {
  open: boolean;
  onClose: () => void;
}

const inputCls = "w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[15px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:bg-white/7 transition-all";
const inputSmCls = "w-full px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all";

export function AddPayslipDrawer({ open, onClose }: AddPayslipDrawerProps) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [grossActual, setGrossActual] = useState("");
  const [netActual, setNetActual] = useState("");
  const [unionActual, setUnionActual] = useState("");
  const [pensionActual, setPensionActual] = useState("");
  const [eduActual, setEduActual] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setGrossActual(""); setNetActual(""); setUnionActual(""); setPensionActual(""); setEduActual("");
  };

  const handleSave = async () => {
    if (!grossActual && !netActual) {
      haptics.error();
      toast.error("הזן לפחות ברוטו או נטו");
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("payslip_uploads").insert({
        user_id: user.id,
        upload_month: month,
        extracted_data: {
          gross_pay: grossActual ? Number(grossActual) : null,
          net_pay: netActual ? Number(netActual) : null,
          deductions: {
            union: unionActual ? Number(unionActual) : null,
            pension: pensionActual ? Number(pensionActual) : null,
            education_fund: eduActual ? Number(eduActual) : null,
          },
        },
        file_url: "",
        file_name: `תלוש-${month}`,
      });
      if (error) throw error;
      haptics.success();
      toast.success("תלוש נשמר");
      await queryClient.invalidateQueries({ queryKey: ["payslip-uploads"] });
      reset();
      onClose();
    } catch (e: any) {
      haptics.error();
      toast.error("שגיאה בשמירת התלוש: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={handleSave}
      disabled={isSaving}
      className="w-full py-3.5 rounded-2xl bg-purple-600 font-bold text-[15px] text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-[0_2px_20px_rgba(124,58,237,0.25)]"
    >
      {isSaving ? "שומר..." : "שמור תלוש"}
    </motion.button>
  );

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הזן תלוש שכר" footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-white/40 mb-1.5 block">חודש</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">ברוטו בפועל (₪)</label>
            <input type="number" inputMode="decimal" autoFocus value={grossActual}
              onChange={(e) => setGrossActual(e.target.value)} placeholder="0" className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">נטו בפועל (₪)</label>
            <input type="number" inputMode="decimal" value={netActual}
              onChange={(e) => setNetActual(e.target.value)} placeholder="0" className={inputCls} dir="ltr" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white/40">ניכויים בפועל</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/30 mb-1 block">הסתדרות</label>
              <input type="number" inputMode="decimal" value={unionActual}
                onChange={(e) => setUnionActual(e.target.value)} placeholder="0" className={inputSmCls} dir="ltr" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 mb-1 block">פנסיה</label>
              <input type="number" inputMode="decimal" value={pensionActual}
                onChange={(e) => setPensionActual(e.target.value)} placeholder="0" className={inputSmCls} dir="ltr" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 mb-1 block">קה"ש</label>
              <input type="number" inputMode="decimal" value={eduActual}
                onChange={(e) => setEduActual(e.target.value)} placeholder="0" className={inputSmCls} dir="ltr" />
            </div>
          </div>
        </div>
      </div>
    </AddItemDrawer>
  );
}
