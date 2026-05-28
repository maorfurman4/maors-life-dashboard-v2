import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthlyFinance } from "@/hooks/use-finance-data";
import { exportMonthlyReport } from "@/lib/pdf-export";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface FinanceExportButtonProps {
  year: number;
  month: number;
}

export function FinanceExportButton({ year, month }: FinanceExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const fin = useMonthlyFinance(year, month);
  const { user } = useAuth();

  async function handleExport() {
    setLoading(true);
    try {
      const categoryBreakdown = fin.categoryBreakdown ?? {};
      const expenses = Object.entries(categoryBreakdown).map(([category, amount]) => ({
        category,
        amount: amount as number,
      }));

      const userName =
        user?.user_metadata?.full_name ??
        user?.email?.split("@")[0] ??
        undefined;

      await exportMonthlyReport({
        month,
        year,
        income: fin.totalIncome,
        expenses,
        xpEarned: undefined,
        userName,
      });
      toast.success("הדוח יוצא בהצלחה ✅");
    } catch {
      toast.error("שגיאה בייצוא הדוח");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      ייצוא PDF
    </Button>
  );
}
