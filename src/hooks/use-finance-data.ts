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
      const { data, error } = await supabase
        .from("user_settings")
        .select("savings_goal_pct, income_sync_mode")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return {
        savings_goal_pct: data?.savings_goal_pct ?? 35,
        income_sync_mode: (data?.income_sync_mode as "net" | "bank") ?? "net",
      };
    },
  });
}

export function useSaveFinanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { savings_goal_pct?: number; income_sync_mode?: "net" | "bank" }) => {
      const userId = await getUserId();
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update(updates)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
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
  const { data: financeSettings } = useFinanceSettings();
  const { payslip, settings: workSettings } = useMonthlyPayslip(year, month);

  return useMemo(() => {
    const savingsGoal = financeSettings?.savings_goal_pct ?? 35;
    const syncMode = financeSettings?.income_sync_mode ?? "net";

    // Work income
    const workIncome = payslip
      ? syncMode === "bank" ? payslip.bankAmount : payslip.netPay
      : 0;
    const grossFromWork = payslip?.totalGross ?? 0;
    const netFromWork = payslip?.netPay ?? 0;

    // Manual income
    const manualIncome = (incomes || [])
      .filter((i: any) => (i.source ?? "manual") === "manual")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    const totalIncome = workIncome + manualIncome;

    // Variable expenses
    const variableExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Fixed expenses (active)
    const activeFixed = (fixedExpenses || []).filter((f: any) => f.is_active);
    const totalFixedMonthly = activeFixed.reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    // Which fixed expenses already passed this month
    const today = new Date();
    const currentDay = today.getDate();
    const fixedAlreadyCharged = activeFixed
      .filter((f: any) => f.charge_day <= currentDay)
      .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const fixedRemaining = totalFixedMonthly - fixedAlreadyCharged;

    const totalExpenses = variableExpenses + fixedAlreadyCharged;
    const balance = totalIncome - totalExpenses;

    // Savings
    const savings = totalIncome > 0 ? balance : 0;
    const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const savingsTarget = totalIncome * (savingsGoal / 100);
    const savingsGap = savingsTarget - savings;

    // Forecast
    const forecastExpenses = variableExpenses + totalFixedMonthly;
    const forecastBalance = totalIncome - forecastExpenses;
    const forecastSavingsPct = totalIncome > 0 ? (forecastBalance / totalIncome) * 100 : 0;

    // Status
    let savingsStatus: "on_target" | "close" | "far" = "far";
    if (savingsPct >= savingsGoal) savingsStatus = "on_target";
    else if (savingsPct >= savingsGoal - 10) savingsStatus = "close";

    // Category breakdown
    const categoryBreakdown = (expenses || []).reduce((acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    // Average daily expense
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
      totalExpenses,
      balance,
      savings: Math.max(savings, 0),
      savingsPct: Math.max(savingsPct, 0),
      savingsGoal,
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
    };
  }, [expenses, incomes, fixedExpenses, payslip, financeSettings, workSettings, year, month]);
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
