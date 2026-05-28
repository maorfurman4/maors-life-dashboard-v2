import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

const MONTH_NAMES_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function reverseHebrew(text: string): string {
  return text.split("").reverse().join("");
}

export async function exportMonthlyReport(params: {
  month: number;
  year: number;
  income: number;
  expenses: { category: string; amount: number }[];
  workHours?: number;
  xpEarned?: number;
  userName?: string;
}): Promise<void> {
  const { month, year, income, expenses, workHours, xpEarned, userName } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const savings = income - totalExpenses;
  const monthName = MONTH_NAMES_HE[month - 1];

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = `Monthly Report - ${reverseHebrew(monthName)} ${year}`;
  doc.text(title, 105, 20, { align: "center" });

  if (userName) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(reverseHebrew(userName), 105, 28, { align: "center" });
  }

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IL")}`, 105, 34, { align: "center" });
  doc.setTextColor(0, 0, 0);

  doc.autoTable({
    startY: 40,
    head: [["Item", "Amount (ILS)"]],
    body: [
      [reverseHebrew("הכנסות"), `${income.toLocaleString("he-IL")}`],
      [reverseHebrew("סה\"כ הוצאות"), `${totalExpenses.toLocaleString("he-IL")}`],
      [reverseHebrew("חיסכון"), `${savings.toLocaleString("he-IL")}`],
    ],
    styles: { halign: "right", font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [30, 30, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 14, right: 14 },
  });

  const summaryEndY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 80;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(reverseHebrew("פירוט הוצאות לפי קטגוריה"), 196, summaryEndY + 12, { align: "right" });

  const expenseRows = expenses.map((e) => [
    reverseHebrew(e.category),
    `${e.amount.toLocaleString("he-IL")}`,
  ]);

  doc.autoTable({
    startY: summaryEndY + 16,
    head: [[reverseHebrew("קטגוריה"), reverseHebrew("סכום")]],
    body: expenseRows,
    styles: { halign: "right", font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [50, 50, 80], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 14, right: 14 },
  });

  const expenseEndY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 140;

  let extraY = expenseEndY + 12;
  const extras: [string, string][] = [];
  if (workHours !== undefined) extras.push([reverseHebrew("שעות עבודה"), `${workHours}`]);
  if (xpEarned !== undefined) extras.push(["XP Earned", `${xpEarned}`]);

  if (extras.length > 0) {
    doc.autoTable({
      startY: extraY,
      head: [["Metric", "Value"]],
      body: extras,
      styles: { halign: "right", font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [60, 80, 60], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    extraY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? extraY + 30;
  }

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Life Dashboard — ${new Date().toLocaleDateString("en-IL")}`,
    105,
    pageHeight - 8,
    { align: "center" }
  );

  const mm = String(month).padStart(2, "0");
  doc.save(`report_${year}_${mm}.pdf`);
}
