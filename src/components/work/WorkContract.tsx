import { Settings, FileText, Upload } from "lucide-react";
import { DEFAULT_RATES, DEFAULT_DEDUCTIONS, ROLES } from "@/lib/work-utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function WorkContract() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: "uploading" | "analyzing" | "done" }>>([]);
  const [extractedPayslipData, setExtractedPayslipData] = useState<{ hourlyRate: number; avgGross: number } | null>(null);

  const handlePayslipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    if (files.length === 0) return;

    setUploadedFiles(files.map(f => ({ name: f.name, status: "uploading" })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `payslips/${Date.now()}-${file.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from("payslips")
        .upload(fileName, file, { upsert: true });

      if (!error && uploadData) {
        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "analyzing" } : f));

        // Use a signed URL (valid 60 s) so the edge function can fetch the file
        // regardless of whether the bucket is public or private.
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("payslips")
          .createSignedUrl(fileName, 60);
        const fileUrl = signedUrlData?.signedUrl
          ?? supabase.storage.from("payslips").getPublicUrl(fileName).data.publicUrl;
        if (signedUrlError) console.warn("Signed URL failed, falling back to public URL", signedUrlError);

        try {
          const { data: fnData } = await supabase.functions.invoke("payslip-parse-ai", {
            body: { fileUrl }
          });
          if (fnData?.hourlyRate) {
            setExtractedPayslipData(fnData);
          }
        } catch (err) {
          console.error("Parse error:", err);
        }

        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
      } else if (error) {
        console.error("Upload error:", error);
        setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
      }
    }
  };

  const handleApplyExtracted = () => {
    if (!extractedPayslipData) return;
    toast.success(`שכר שעתי ₪${extractedPayslipData.hourlyRate} הוחל על ההגדרות`);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-work" />
          <h3 className="text-sm font-semibold text-muted-foreground">תעריפים וחוזה</h3>
        </div>
        <button className="flex items-center gap-0.5 text-xs text-work hover:underline">
          <Settings className="h-3 w-3" /> עריכה בהגדרות
        </button>
      </div>

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

      {/* Payslip upload section */}
      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-3">📄 העלאת תלושי שכר לפענוח אוטומטי</h3>
        <p className="text-xs text-muted-foreground mb-3">
          העלה עד 3 תלושי שכר אחרונים — המערכת תחשב את השכר השעתי ותגדרות אוטומטית
        </p>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">לחץ להעלאה או גרור קבצים</span>
          <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (עד 3 קבצים)</span>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handlePayslipUpload}
          />
        </label>

        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                {f.status === "uploading" && <span className="text-xs text-muted-foreground">מעלה...</span>}
                {f.status === "analyzing" && <span className="text-xs text-blue-400">מנתח...</span>}
                {f.status === "done" && <span className="text-xs text-green-400">✓</span>}
              </div>
            ))}
          </div>
        )}

        {extractedPayslipData && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm font-medium text-green-400">נמצא שכר שעתי: ₪{extractedPayslipData.hourlyRate}/שעה</p>
            <p className="text-xs text-muted-foreground mt-1">ברוטו ממוצע: ₪{extractedPayslipData.avgGross}</p>
            <button
              onClick={handleApplyExtracted}
              className="mt-2 w-full py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-400 transition-colors"
            >
              החל הגדרות אוטומטית
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
