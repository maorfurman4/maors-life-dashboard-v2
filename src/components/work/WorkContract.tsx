import { Settings, FileText, Upload, Sparkles, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { DEFAULT_RATES, DEFAULT_DEDUCTIONS, ROLES } from "@/lib/work-utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSavePayrollSettings, usePayrollSettings } from "@/hooks/use-work-data";

const contractDetails = [
  { label: "תפקיד", value: ROLES.guard.label },
  { label: "שכר שעתי (מאבטח)", value: `₪${DEFAULT_RATES.guardRate}` },
  { label: "שכר שעתי (אחראי)", value: `₪${DEFAULT_RATES.shiftManagerRate}` },
  { label: "נסיעות ליום", value: `₪${DEFAULT_RATES.travelAllowance}` },
  { label: "תדרוך", value: `₪${DEFAULT_RATES.briefingAllowance}` },
  { label: "שבת/חג", value: `${DEFAULT_RATES.shabbatMultiplier * 100}%` },
];

const deductionDetails = [
  { label: "הסתדרות", value: `${DEFAULT_DEDUCTIONS.unionPct}%` },
  { label: "פנסיה", value: `${DEFAULT_DEDUCTIONS.pensionPct}%` },
  { label: "קרן השתלמות", value: `${DEFAULT_DEDUCTIONS.educationFundPct}%` },
];

interface PayslipData {
  hourlyRate?: number;
  grossPay?: number;
  netPay?: number;
  nationalInsurance?: number;
  healthInsurance?: number;
  pension?: number;
  educationFund?: number;
  avgGross?: number;
}

interface Bonus {
  label: string;
  amount: number;
}

function fmtNis(n: number) { return `₪${Math.round(n).toLocaleString("he-IL")}`; }

export function WorkContract() {
  const saveSettings = useSavePayrollSettings();
  const { data: settings } = usePayrollSettings();

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: "uploading" | "analyzing" | "done" | "error" }>>([]);
  const [payslipResults, setPayslipResults] = useState<PayslipData[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [newBonusLabel, setNewBonusLabel] = useState("");
  const [newBonusAmount, setNewBonusAmount] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handlePayslipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    if (files.length === 0) return;

    setUploadedFiles(files.map(f => ({ name: f.name, status: "uploading" })));
    setPayslipResults([]);

    const results: PayslipData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `payslips/${Date.now()}-${file.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from("payslips")
        .upload(fileName, file, { upsert: true });

      if (!error && uploadData) {
        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "analyzing" } : f));

        const { data: signedUrlData } = await supabase.storage
          .from("payslips")
          .createSignedUrl(fileName, 60);
        const fileUrl = signedUrlData?.signedUrl
          ?? supabase.storage.from("payslips").getPublicUrl(fileName).data.publicUrl;

        try {
          const { data: fnData } = await supabase.functions.invoke("payslip-parse-ai", {
            body: { fileUrl }
          });
          if (fnData && !fnData.error) {
            results.push(fnData as PayslipData);
          }
        } catch (err) {
          console.error("Parse error:", err);
        }

        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
      } else {
        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error" } : f));
      }
    }

    setPayslipResults(results);
    if (results.length > 0) toast.success(`נותחו ${results.length} תלושים בהצלחה ✅`);
  };

  const avg = (field: keyof PayslipData) => {
    const vals = payslipResults.map(r => r[field] as number).filter(v => v && v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const avgGross = avg("grossPay") || avg("avgGross");
  const avgNet = avg("netPay");
  const avgHourly = avg("hourlyRate");
  const avgNI = avg("nationalInsurance");
  const avgHealth = avg("healthInsurance");
  const avgPension = avg("pension");
  const avgEdFund = avg("educationFund");
  const totalDeductions = avgNI + avgHealth + avgPension + avgEdFund;
  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);

  const handleApply = () => {
    if (!settings || !avgHourly) return;
    saveSettings.mutate(
      { ...settings, base_hourly_rate: avgHourly } as any,
      {
        onSuccess: () => toast.success(`שכר שעתי ₪${avgHourly.toFixed(2)} הוחל על ההגדרות ✅`),
        onError: () => toast.error("שגיאה בשמירת ההגדרות"),
      }
    );
  };

  const addBonus = () => {
    const amount = parseFloat(newBonusAmount);
    if (!newBonusLabel.trim() || !amount || amount <= 0) { toast.error("הזן שם וסכום תקין"); return; }
    setBonuses(prev => [...prev, { label: newBonusLabel.trim(), amount }]);
    setNewBonusLabel(""); setNewBonusAmount("");
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-work" />
          <h3 className="text-sm font-semibold text-muted-foreground">תעריפים וחוזה</h3>
        </div>
        <button
          onClick={() => setShowDetails(v => !v)}
          className="flex items-center gap-0.5 text-xs text-work hover:underline"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? "הסתר" : "תעריפים"}
        </button>
      </div>

      {showDetails && (
        <>
          <div className="space-y-2">
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
        </>
      )}

      {/* AI Payslip Analysis */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">ניתוח תלושים עם AI</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          העלה עד 3 תלושי שכר אחרונים — ה-AI יחשב ממוצעים, ינתח את מבנה השכר שלך ויציג את התלוש "הנכון" שלך
        </p>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-7 h-7 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">לחץ להעלאה או גרור קבצים</span>
          <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — עד 3 תלושים</span>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handlePayslipUpload} />
        </label>

        {uploadedFiles.length > 0 && (
          <div className="space-y-1.5">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                {f.status === "uploading" && <span className="text-xs text-muted-foreground">מעלה...</span>}
                {f.status === "analyzing" && <span className="text-xs text-blue-400 animate-pulse">מנתח עם AI...</span>}
                {f.status === "done" && <span className="text-xs text-green-400">✓</span>}
                {f.status === "error" && <span className="text-xs text-red-400">✗</span>}
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis Result */}
        {payslipResults.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-bold text-amber-300">
                ניתוח מבוסס {payslipResults.length} תלושים
              </p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
              {avgHourly > 0 && (
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                  <p className="text-[10px] text-white/40">שכר שעתי ממוצע</p>
                  <p className="text-base font-black text-amber-300">{fmtNis(avgHourly)}</p>
                </div>
              )}
              {avgGross > 0 && (
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                  <p className="text-[10px] text-white/40">ברוטו ממוצע</p>
                  <p className="text-base font-black text-blue-300">{fmtNis(avgGross)}</p>
                </div>
              )}
              {avgNet > 0 && (
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                  <p className="text-[10px] text-white/40">נטו ממוצע</p>
                  <p className="text-base font-black text-emerald-300">{fmtNis(avgNet)}</p>
                </div>
              )}
              {totalDeductions > 0 && (
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                  <p className="text-[10px] text-white/40">ניכויים ממוצע</p>
                  <p className="text-base font-black text-red-300">-{fmtNis(totalDeductions)}</p>
                </div>
              )}
            </div>

            {/* Deductions breakdown */}
            {totalDeductions > 0 && (
              <div className="space-y-1 border-t border-white/10 pt-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">פירוט ניכויים ממוצע</p>
                {avgNI > 0 && <div className="flex justify-between text-xs"><span className="text-white/50">ביטוח לאומי</span><span className="text-red-400">-{fmtNis(avgNI)}</span></div>}
                {avgHealth > 0 && <div className="flex justify-between text-xs"><span className="text-white/50">ביטוח בריאות</span><span className="text-red-400">-{fmtNis(avgHealth)}</span></div>}
                {avgPension > 0 && <div className="flex justify-between text-xs"><span className="text-white/50">פנסיה</span><span className="text-red-400">-{fmtNis(avgPension)}</span></div>}
                {avgEdFund > 0 && <div className="flex justify-between text-xs"><span className="text-white/50">קרן השתלמות</span><span className="text-red-400">-{fmtNis(avgEdFund)}</span></div>}
              </div>
            )}

            {/* Bonuses */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">בונוסים והטבות</p>
              {bonuses.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{b.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">+{fmtNis(b.amount)}</span>
                    <button onClick={() => setBonuses(prev => prev.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newBonusLabel}
                  onChange={e => setNewBonusLabel(e.target.value)}
                  placeholder="שם בונוס (למשל: מענק)"
                  className="flex-1 rounded-lg bg-white/8 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/40"
                />
                <input
                  value={newBonusAmount}
                  onChange={e => setNewBonusAmount(e.target.value)}
                  placeholder="₪"
                  type="number"
                  className="w-20 rounded-lg bg-white/8 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/40"
                  dir="ltr"
                />
                <button onClick={addBonus} className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Expected net with bonuses */}
            {(avgNet > 0 || avgGross > 0) && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-center">
                <p className="text-[10px] text-emerald-400/70 mb-1">נטו צפוי כולל בונוסים</p>
                <p className="text-2xl font-black text-emerald-400">
                  {fmtNis((avgNet || (avgGross - totalDeductions)) + bonusTotal)}
                </p>
              </div>
            )}

            {/* Apply button */}
            {avgHourly > 0 && (
              <button
                onClick={handleApply}
                disabled={saveSettings.isPending}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-sm font-black hover:bg-amber-400 transition-colors disabled:opacity-60 active:scale-95"
              >
                {saveSettings.isPending ? "מחיל..." : `✓ החל שכר שעתי ${fmtNis(avgHourly)} על ההגדרות`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
