import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMonthlyPayslip } from "@/hooks/use-work-data";
import { useMemo } from "react";

// ─── Auth helper ───
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Default expense categories ───
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "שכירות", icon: "🏠" },
  { name: "מנויים", icon: "🔄" },
  { name: "מזון", icon: "🛒" },
  { name: "דלק", icon: "⛽" },
  { name: "ביגוד", icon: "👕" },
  { name: "בית", icon: "🏡" },
  { name: "בילויים", icon: "🎉" },
  { name: "בריאות", icon: "💊" },
  { name: "טיולים", icon: "✈️" },
  { name: "אחר", icon: "📦" },
];

export function useActiveExpenseCategories() {
  const { data: dbCats } = useExpenseCategories();
  return useMemo(() => {
    if (dbCats && dbCats.length > 0) {
      return dbCats.map((c: any) => ({ name: c.name, icon: c.icon || "📦" }));
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  }, [dbCats]);
}

export const INCOME_CATEGORIES = [
  { value: "salary", label: "משכורת" },
  { value: "private_lessons", label: "שיעורים פרטיים" },
  { value: "freelance", label: "פרילנס" },
  { value: "other", label: "אחר" },
];

// ─── Expense Entries ───
export function useExpenseEntries(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["expense-entries", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_entries")
        .select("*")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: {
      amount: number;
      category: string;
      description?: string;
      date: string;
      expense_type: string;
      is_recurring: boolean;
      needs_review: boolean;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("expense_entries").insert({
        ...expense,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-entries"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-entries"] }),
  });
}

// ─── Income Entries ───
export function useIncomeEntries(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["income-entries", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_entries")
        .select("*")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (income: {
      amount: number;
      category: string;
      description?: string;
      date: string;
      source?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("income_entries").insert({
        ...income,
        source: income.source || "manual",
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income-entries"] }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income-entries"] }),
  });
}

// ─── Fixed Expenses ───
export function useFixedExpenses() {
  return useQuery({
    queryKey: ["fixed-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_expenses")
        .select("*")
        .order("charge_day", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddFixedExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: {
      name: string;
      amount: number;
      category: string;
      charge_day: number;
      is_active?: boolean;
      is_recurring?: boolean;
      notes?: string | null;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("fixed_expenses").insert({
        ...expense,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-expenses"] }),
  });
}

export function useUpdateFixedExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; amount?: number; category?: string; charge_day?: number; is_active?: boolean; is_recurring?: boolean; notes?: string }) => {
      const { error } = await supabase.from("fixed_expenses").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-expenses"] }),
  });
}

export function useDeleteFixedExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-expenses"] }),
  });
}

// ─── Finance Settings ───
export function useFinanceSettings() {
  return useQuery({
    queryKey: ["finance-settings"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await db
        .from("user_settings")
        .select("savings_goal_pct, income_sync_mode, savings_goal_amount")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      const row = data as { savings_goal_pct?: number; income_sync_mode?: string; savings_goal_amount?: number | null } | null;
      return {
        savings_goal_pct: row?.savings_goal_pct ?? 35,
        income_sync_mode: (row?.income_sync_mode as "net" | "bank") ?? "net",
        savings_goal_amount: (row?.savings_goal_amount ?? null) as number | null,
      };
    },
  });
}

export function useSaveFinanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { savings_goal_pct?: number; income_sync_mode?: "net" | "bank"; savings_goal_amount?: number | null }) => {
      const userId = await getUserId();
      const { data: existing } = await db
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        const { error } = await db
          .from("user_settings")
          .update(updates)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("user_settings")
          .insert({ user_id: userId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-settings"] }),
  });
}

// ─── Expense Categories (CRUD) ───
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpsertCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: { id?: string; name: string; icon?: string; budget_limit?: number | null; sort_order?: number }) => {
      const userId = await getUserId();
      if (cat.id) {
        const { error } = await supabase
          .from("expense_categories")
          .update({ name: cat.name, icon: cat.icon, budget_limit: cat.budget_limit, sort_order: cat.sort_order ?? 0 })
          .eq("id", cat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expense_categories").insert({
          user_id: userId,
          name: cat.name,
          icon: cat.icon,
          budget_limit: cat.budget_limit,
          sort_order: cat.sort_order ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-categories"] }),
  });
}

// ─── Monthly Finance Summary (computed) ───
export function useMonthlyFinance(year: number, month: number) {
  const { data: expenses } = useExpenseEntries(year, month);
  const { data: incomes } = useIncomeEntries(year, month);
  const { data: fixedExpenses } = useFixedExpenses();
  const { data: fixedIncome } = useFixedIncome();
  const { data: debts } = useDebts();
  const { data: financeSettings } = useFinanceSettings();
  const { payslip, settings: workSettings } = useMonthlyPayslip(year, month);

  return useMemo(() => {
    const savingsGoal = financeSettings?.savings_goal_pct ?? 35;
    const savingsGoalAmount = financeSettings?.savings_goal_amount ?? null;
    const syncMode = financeSettings?.income_sync_mode ?? "net";

    // Work income
    const workIncome = payslip
      ? syncMode === "bank" ? payslip.bankAmount : payslip.netPay
      : 0;
    const grossFromWork = payslip?.totalGross ?? 0;
    const netFromWork = payslip?.netPay ?? 0;

    // Manual income entries
    const manualIncome = (incomes || [])
      .filter((i: any) => (i.source ?? "manual") === "manual")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Fixed income (active, already credited this month)
    const today = new Date();
    const currentDay = today.getDate();
    const activeFixedIncome = (fixedIncome || []).filter((f: any) => f.is_active);
    const totalFixedIncomeMonthly = activeFixedIncome.reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const fixedIncomeAlreadyCredited = activeFixedIncome
      .filter((f: any) => f.day_of_month <= currentDay)
      .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    const totalIncome = workIncome + manualIncome + fixedIncomeAlreadyCredited;

    // Variable expenses
    const variableExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Fixed expenses (active)
    const activeFixed = (fixedExpenses || []).filter((f: any) => f.is_active);
    const totalFixedMonthly = activeFixed.reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const fixedAlreadyCharged = activeFixed
      .filter((f: any) => f.charge_day <= currentDay)
      .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const fixedRemaining = totalFixedMonthly - fixedAlreadyCharged;

    // Debt monthly payments (auto-deducted)
    const activeDebts = (debts || []).filter((d: any) => d.is_active !== false);
    const totalDebtMonthly = activeDebts.reduce((sum: number, d: any) => sum + Number(d.monthly_payment), 0);

    const totalExpenses = variableExpenses + fixedAlreadyCharged + totalDebtMonthly;
    const balance = totalIncome - totalExpenses;

    // Savings
    const savings = totalIncome > 0 ? balance : 0;
    const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const savingsTarget = savingsGoalAmount ?? (totalIncome * (savingsGoal / 100));
    const savingsGap = savingsTarget - savings;

    // Forecast (full month)
    const forecastExpenses = variableExpenses + totalFixedMonthly + totalDebtMonthly;
    const forecastIncome = workIncome + manualIncome + totalFixedIncomeMonthly;
    const forecastBalance = forecastIncome - forecastExpenses;
    const forecastSavingsPct = forecastIncome > 0 ? (forecastBalance / forecastIncome) * 100 : 0;

    // Status
    let savingsStatus: "on_target" | "close" | "far" = "far";
    if (savingsPct >= savingsGoal) savingsStatus = "on_target";
    else if (savingsPct >= savingsGoal - 10) savingsStatus = "close";

    // Category breakdown
    const categoryBreakdown = (expenses || []).reduce((acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const daysInMonth = new Date(year, month, 0).getDate();
    const avgDailyExpense = totalExpenses / Math.max(currentDay, 1);
    const avgDailyIncome = totalIncome / Math.max(currentDay, 1);

    return {
      workIncome,
      grossFromWork,
      netFromWork,
      manualIncome,
      totalIncome,
      variableExpenses,
      totalFixedMonthly,
      fixedAlreadyCharged,
      fixedRemaining,
      totalDebtMonthly,
      totalFixedIncomeMonthly,
      fixedIncomeAlreadyCredited,
      totalExpenses,
      balance,
      savings: Math.max(savings, 0),
      savingsPct: Math.max(savingsPct, 0),
      savingsGoal,
      savingsGoalAmount,
      savingsTarget,
      savingsGap,
      savingsStatus,
      forecastExpenses,
      forecastBalance,
      forecastSavingsPct,
      categoryBreakdown,
      avgDailyExpense,
      avgDailyIncome,
      daysInMonth,
      expenses: expenses || [],
      incomes: incomes || [],
      fixedExpenses: activeFixed,
      fixedIncome: activeFixedIncome,
      debts: activeDebts,
    };
  }, [expenses, incomes, fixedExpenses, fixedIncome, debts, payslip, financeSettings, workSettings, year, month]);
}

// ─── Historical data for trends (6 months) ───
export function useExpenseHistory(months: number = 6) {
  return useQuery({
    queryKey: ["expense-history", months],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const { data, error } = await supabase
        .from("expense_entries")
        .select("amount, category, date")
        .gte("date", startDate.toISOString().slice(0, 10))
        .order("date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useIncomeHistory(months: number = 6) {
  return useQuery({
    queryKey: ["income-history", months],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const { data, error } = await supabase
        .from("income_entries")
        .select("amount, date")
        .gte("date", startDate.toISOString().slice(0, 10))
        .order("date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Fixed Income ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useFixedIncome() {
  return useQuery({
    queryKey: ["fixed-income"],
    queryFn: async () => {
      const { data, error } = await db
        .from("fixed_income")
        .select("*")
        .order("day_of_month", { ascending: true });
      if (error) throw error;
      return (data || []) as Record<string, unknown>[];
    },
  });
}

export function useAddFixedIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (income: {
      name: string;
      amount: number;
      category: string;
      day_of_month: number;
      is_active?: boolean;
      notes?: string | null;
    }) => {
      const userId = await getUserId();
      const { error } = await db.from("fixed_income").insert({ ...income, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-income"] }),
  });
}

export function useUpdateFixedIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; amount?: number; category?: string; day_of_month?: number; is_active?: boolean; notes?: string }) => {
      const { error } = await db.from("fixed_income").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-income"] }),
  });
}

export function useDeleteFixedIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("fixed_income").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fixed-income"] }),
  });
}

// ─── Debts (Supabase) ───
export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: async () => {
      const { data, error } = await db
        .from("debts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Record<string, unknown>[];
    },
  });
}

export function useAddDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (debt: {
      name: string;
      type: string;
      principal: number;
      monthly_payment: number;
      annual_interest_rate: number;
      months_elapsed: number;
    }) => {
      const userId = await getUserId();
      const { error } = await db.from("debts").insert({ ...debt, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export const INCOME_CATEGORIES_FIXED = [
  { name: "משכורת",   icon: "💼" },
  { name: "פרילנס",   icon: "💻" },
  { name: "שיעורים",  icon: "📚" },
  { name: "שכ״ד",    icon: "🏠" },
  { name: "קצבה",    icon: "📋" },
  { name: "אחר",     icon: "💰" },
];
