import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Sparkles, ChevronDown, ChevronUp, Plus, Trash2,
  ScanLine, CheckCircle2, XCircle, Check, X,
} from "lucide-react";
import { DEFAULT_RATES, DEFAULT_DEDUCTIONS, ROLES } from "@/lib/work-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSavePayrollSettings, usePayrollSettings } from "@/hooks/use-work-data";
import { type PayrollSettings } from "@/lib/payroll-engine";
import { haptics } from "@/lib/haptics";
import { fileToBase64 } from "@/utils/file-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedPayslip {
  grossPay?: number | null;
  netPay?: number | null;
  deductions?: {
    tax?: number | null;
    socialSecurity?: number | null;
    pension?: number | null;
    health?: number | null;
    educationFund?: number | null;
    other?: number | null;
  };
}

interface DerivedPcts {
  avgGross: number;
  avgNet: number;
  national_insurance_pct: number;
  health_insurance_pct: number;
  harel_savings_pct: number;
  harel_study_pct: number;
  taxPct: number;
}

interface Bonus {
  label: string;
  amount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const contractDetails = [
  { label: "תפקיד",              value: ROLES.guard.label },
  { label: "שכר שעתי (מאבטח)",  value: `₪${DEFAULT_RATES.guardRate}` },
  { label: "שכר שעתי (אחראי)",  value: `₪${DEFAULT_RATES.shiftManagerRate}` },
  { label: "נסיעות ליום",        value: `₪${DEFAULT_RATES.travelAllowance}` },
  { label: "תדרוך",              value: `₪${DEFAULT_RATES.briefingAllowance}` },
  { label: "שבת/חג",             value: `${DEFAULT_RATES.shabbatMultiplier * 100}%` },
];

const deductionDetails = [
  { label: "הסתדרות",      value: `${DEFAULT_DEDUCTIONS.unionPct}%` },
  { label: "פנסיה",        value: `${DEFAULT_DEDUCTIONS.pensionPct}%` },
  { label: "קרן השתלמות", value: `${DEFAULT_DEDUCTIONS.educationFundPct}%` },
];

function fmtNis(n: number) {
  return `₪${Math.round(n).toLocaleString("he-IL")}`;
}

function derivePcts(results: ParsedPayslip[]): DerivedPcts | null {
  const valid = results.filter((r) => r.grossPay && r.grossPay > 0);
  if (!valid.length) return null;

  const avgOf = (fn: (r: ParsedPayslip) => number | null | undefined): number => {
    const vals = valid
      .map(fn)
      .filter((v): v is number => typeof v === "number" && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  return {
    avgGross: avgOf((r) => r.grossPay),
    avgNet:   avgOf((r) => r.netPay),
    national_insurance_pct: avgOf((r) =>
      r.deductions?.socialSecurity && r.grossPay
        ? (r.deductions.socialSecurity / r.grossPay) * 100 : null),
    health_insurance_pct: avgOf((r) =>
      r.deductions?.health && r.grossPay
        ? (r.deductions.health / r.grossPay) * 100 : null),
    harel_savings_pct: avgOf((r) =>
      r.deductions?.pension && r.grossPay
        ? (r.deductions.pension / r.grossPay) * 100 : null),
    harel_study_pct: avgOf((r) =>
      r.deductions?.educationFund && r.grossPay
        ? (r.deductions.educationFund / r.grossPay) * 100 : null),
    taxPct: avgOf((r) =>
      r.deductions?.tax && r.grossPay
        ? (r.deductions.tax / r.grossPay) * 100 : null),
  };
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

interface ConfirmRow {
  key: keyof PayrollSettings;
  label: string;
  derived: number;
  current: number;
}

function ConfirmModal({
  derived,
  current,
  payslipCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  derived: DerivedPcts;
  current: PayrollSettings;
  payslipCount: number;
  onConfirm: (patch: Partial<PayrollSettings>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const rows = useMemo<ConfirmRow[]>(
    () =>
      (
        [
          { key: "national_insurance_pct", label: "ביטוח לאומי",   derived: derived.national_insurance_pct },
          { key: "health_insurance_pct",   label: "ביטוח בריאות",  derived: derived.health_insurance_pct  },
          { key: "harel_savings_pct",      label: "ניכוי הראל ש'", derived: derived.harel_savings_pct     },
          { key: "harel_study_pct",        label: "ניכוי הראל קר", derived: derived.harel_study_pct       },
        ] as { key: keyof PayrollSettings; label: string; derived: number }[]
      )
        .filter((r) => r.derived > 0)
        .map((r) => ({
          ...r,
          current: current[r.key] as number,
        })),
    [derived, current],
  );

  const [checked, setChecked] = useState<Set<keyof PayrollSettings>>(
    () => new Set(rows.filter((r) => Math.abs(r.derived - r.current) > 0.01).map((r) => r.key)),
  );

  const toggle = (key: keyof PayrollSettings) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleConfirm = () => {
    const patch: Partial<PayrollSettings> = {};
    for (const row of rows) {
      if (checked.has(row.key)) {
        (patch as Record<string, number>)[row.key as string] = parseFloat(row.derived.toFixed(2));
      }
    }
    onConfirm(patch);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg rounded-t-[28px] px-5 pt-5 pb-10 space-y-5"
        style={{
          background: "linear-gradient(180deg,#1a1510 0%,#0d0d0d 100%)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderBottom: "none",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        dir="rtl"
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-1 bg-white/15" />

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[15px] font-black text-white">AI זיהה את ניכויי השכר שלך</p>
            <p className="text-[11px] text-white/40">
              ממוצע מבוסס על {payslipCount} {payslipCount === 1 ? "תלוש" : "תלושים"}
            </p>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-2">
          {derived.avgGross > 0 && (
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-[10px] text-white/40 mb-0.5">ברוטו ממוצע</p>
              <p className="text-base font-black text-amber-300">{fmtNis(derived.avgGross)}</p>
            </div>
          )}
          {derived.avgNet > 0 && (
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-[10px] text-white/40 mb-0.5">נטו ממוצע</p>
              <p className="text-base font-black text-emerald-400">{fmtNis(derived.avgNet)}</p>
            </div>
          )}
        </div>

        {/* Deduction rows */}
        {rows.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              בחר ניכויים לעדכון בחוזה
            </p>
            {rows.map((row) => {
              const differs = Math.abs(row.derived - row.current) > 0.01;
              const isChecked = checked.has(row.key);
              return (
                <button
                  key={row.key}
                  onClick={() => toggle(row.key)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-3 transition-all text-right"
                  style={{
                    background: isChecked ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isChecked ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: isChecked ? "rgba(245,158,11,0.9)" : "rgba(255,255,255,0.08)",
                        border: `1px solid ${isChecked ? "transparent" : "rgba(255,255,255,0.15)"}`,
                      }}
                    >
                      {isChecked && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                    </div>
                    <span className="text-[13px] text-white/80 font-medium">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-white/30 line-through">{row.current.toFixed(2)}%</span>
                    <span
                      className="text-[13px] font-black"
                      style={{ color: differs ? "#f59e0b" : "rgba(255,255,255,0.5)" }}
                    >
                      {row.derived.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-white/40 text-center py-3">
            לא זוהו ניכויים ברורים — נסה תמונה ברורה יותר
          </p>
        )}

        {/* Tax — informational only */}
        {derived.taxPct > 0 && (
          <div className="rounded-xl bg-white/3 border border-white/8 px-3 py-2 flex items-center justify-between">
            <span className="text-[12px] text-white/40">מס הכנסה (מידע בלבד)</span>
            <span className="text-[12px] font-bold text-white/40">{derived.taxPct.toFixed(1)}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white/60 border border-white/10 bg-white/5 active:scale-95 transition-all"
          >
            ביטול
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            onClick={handleConfirm}
            disabled={isPending || checked.size === 0}
            className="flex-2 flex-1 py-3.5 rounded-2xl text-sm font-black text-black disabled:opacity-40 transition-all"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
              flex: 2,
            }}
          >
            {isPending ? "מעדכן..." : `✓ עדכן ${checked.size} שדות בחוזה`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WorkContract() {
  const saveSettings = useSavePayrollSettings();
  const { data: settings } = usePayrollSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);       // 0 = idle, 1–3 = which payslip
  const [totalSteps, setTotalSteps] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<
    { name: string; status: "pending" | "scanning" | "done" | "error" }[]
  >([]);
  const [results, setResults] = useState<ParsedPayslip[]>([]);
  const [derived, setDerived] = useState<DerivedPcts | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [newBonusLabel, setNewBonusLabel] = useState("");
  const [newBonusAmount, setNewBonusAmount] = useState("");

  const handleScanTap = useCallback(() => {
    haptics.tap();
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).slice(0, 3);
      e.target.value = "";
      if (!files.length) return;

      setScanning(true);
      setResults([]);
      setDerived(null);
      setTotalSteps(files.length);
      setFileStatuses(files.map((f) => ({ name: f.name, status: "pending" })));

      const parsed: ParsedPayslip[] = [];

      for (let i = 0; i < files.length; i++) {
        setStep(i + 1);
        setFileStatuses((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "scanning" } : f)),
        );

        try {
          const imageBase64 = await fileToBase64(files[i]);
          const res = await supabase.functions.invoke("payslip-parse-ai", {
            body: { imageBase64, mimeType: files[i].type || "image/jpeg" },
          });
          if (res.error) throw new Error(res.error.message);
          parsed.push(res.data as ParsedPayslip);
          setFileStatuses((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f)),
          );
          haptics.tap();
        } catch {
          setFileStatuses((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "error" } : f)),
          );
        }
      }

      const d = derivePcts(parsed);
      setResults(parsed);
      setDerived(d);
      setScanning(false);
      setStep(0);

      if (parsed.length > 0) {
        haptics.success();
        setShowConfirm(true);
      } else {
        toast.error("לא ניתן לנתח את הקבצים — נסה תמונות ברורות יותר");
      }
    },
    [],
  );

  const handleConfirm = useCallback(
    (patch: Partial<PayrollSettings>) => {
      if (!settings) return;
      saveSettings.mutate(
        { ...settings, ...patch } as PayrollSettings,
        {
          onSuccess: () => {
            haptics.success();
            const fields = Object.keys(patch).length;
            toast.success(`${fields} שדות ניכוי עודכנו בחוזה ✓`);
            setShowConfirm(false);
          },
          onError: () => {
            haptics.error();
            toast.error("שגיאה בעדכון הגדרות");
          },
        },
      );
    },
    [settings, saveSettings],
  );

  const addBonus = () => {
    const amount = parseFloat(newBonusAmount);
    if (!newBonusLabel.trim() || !amount || amount <= 0) {
      toast.error("הזן שם וסכום תקין");
      return;
    }
    setBonuses((prev) => [...prev, { label: newBonusLabel.trim(), amount }]);
    setNewBonusLabel("");
    setNewBonusAmount("");
  };

  // Averages from last scan for display
  const avgNet = useMemo(
    () =>
      results.length
        ? results.map((r) => r.netPay ?? 0).filter((v) => v > 0).reduce((a, b) => a + b, 0) /
          results.filter((r) => (r.netPay ?? 0) > 0).length || 0
        : 0,
    [results],
  );
  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-work" />
            <h3 className="text-sm font-semibold text-muted-foreground">תעריפים וחוזה</h3>
          </div>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-0.5 text-xs text-work hover:underline"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? "הסתר" : "תעריפים"}
          </button>
        </div>

        {/* Collapsible contract details */}
        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pb-1">
                <p className="text-xs text-muted-foreground font-medium">תעריפים</p>
                {contractDetails.map((d) => (
                  <div key={d.label} className="flex items-center justify-between py-1.5 px-1">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <span className="text-sm font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-medium">ניכויים</p>
                {deductionDetails.map((d) => (
                  <div key={d.label} className="flex items-center justify-between py-1.5 px-1">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <span className="text-sm font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── AI Payslip Scanner ─── */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold">סריקת תלושים חכמה עם AI</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            סרוק עד 3 תלושי שכר — ה-AI יחלץ אחוזי ניכוי ויציע לעדכן את החוזה שלך
          </p>

          {/* Scan button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            onClick={handleScanTap}
            disabled={scanning}
            className="w-full py-3.5 rounded-2xl font-black text-[14px] text-black flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              border: "1px solid rgba(245,158,11,0.4)",
            }}
            aria-label="סרוק תלושי שכר עם AI"
          >
            {scanning ? (
              <ScanLine className="h-4 w-4 animate-pulse" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {scanning ? `סורק תלוש ${step}/${totalSteps}...` : "📷 סרוק תלושים עם AI"}
          </motion.button>

          {/* Scanning overlay on file list */}
          <AnimatePresence>
            {scanning && (
              <motion.div
                key="scan-overlay"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl overflow-hidden border"
                style={{
                  background: "rgba(10,8,4,0.9)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        background:
                          i + 1 < step
                            ? "#f59e0b"
                            : i + 1 === step
                            ? "rgba(245,158,11,0.6)"
                            : "rgba(255,255,255,0.08)",
                        maxWidth: 40,
                      }}
                    />
                  ))}
                </div>

                {/* Animated scan line */}
                <div className="relative h-20 mx-4 mb-4 rounded-xl overflow-hidden bg-white/3">
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-amber-400"
                    style={{ boxShadow: "0 0 12px 3px rgba(245,158,11,0.6)" }}
                    animate={{ y: [8, 64, 8] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs font-bold text-amber-400/70">
                      AI מנתח תלוש {step}/{totalSteps}...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File status list (post-scan) */}
          {!scanning && fileStatuses.length > 0 && (
            <div className="space-y-1.5">
              {fileStatuses.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-white/30" />
                  <span className="flex-1 truncate text-[12px] text-white/60">{f.name}</span>
                  {f.status === "done"  && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {f.status === "error" && <XCircle     className="w-4 h-4 text-red-400 shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {/* Results summary + bonuses (shown after scan, before modal reopened) */}
          {!showConfirm && derived && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-xs font-bold text-amber-300">ניתוח {results.length} תלושים</p>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-[11px] font-bold text-amber-400 underline"
                >
                  עדכן חוזה ←
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {derived.avgGross > 0 && (
                  <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-[10px] text-white/40">ברוטו ממוצע</p>
                    <p className="text-base font-black text-amber-300">{fmtNis(derived.avgGross)}</p>
                  </div>
                )}
                {derived.avgNet > 0 && (
                  <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-[10px] text-white/40">נטו ממוצע</p>
                    <p className="text-base font-black text-emerald-300">{fmtNis(derived.avgNet)}</p>
                  </div>
                )}
              </div>

              {/* Bonuses */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">בונוסים</p>
                {bonuses.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{b.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">+{fmtNis(b.amount)}</span>
                      <button
                        onClick={() => setBonuses((prev) => prev.filter((_, j) => j !== i))}
                        className="text-red-400/50 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newBonusLabel}
                    onChange={(e) => setNewBonusLabel(e.target.value)}
                    placeholder="שם בונוס"
                    className="flex-1 rounded-lg bg-white/8 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/40"
                  />
                  <input
                    value={newBonusAmount}
                    onChange={(e) => setNewBonusAmount(e.target.value)}
                    placeholder="₪"
                    type="number"
                    className="w-20 rounded-lg bg-white/8 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/40"
                    dir="ltr"
                  />
                  <button
                    onClick={addBonus}
                    className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expected net */}
              {avgNet > 0 && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-center">
                  <p className="text-[10px] text-emerald-400/70 mb-1">נטו צפוי כולל בונוסים</p>
                  <p className="text-2xl font-black text-emerald-400">{fmtNis(avgNet + bonusTotal)}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && derived && settings && (
          <ConfirmModal
            key="confirm-modal"
            derived={derived}
            current={settings}
            payslipCount={results.length}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
            isPending={saveSettings.isPending}
          />
        )}
      </AnimatePresence>
    </>
  );
}
