import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcMonthlyPayslip, DEFAULT_PAYROLL_SETTINGS, type PayrollSettings, type ShiftRow } from "@/lib/payroll-engine";
import { useMemo } from "react";

// ─── Auth helper ───
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Work Shifts ───
export function useWorkShifts(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["work-shifts", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_shifts")
        .select("*")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as ShiftRow[];
    },
  });
}

export function useAddShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shift: {
      date: string;
      type: string;
      role: string;
      is_shabbat_holiday: boolean;
      has_briefing: boolean;
      hours: number | null;
      notes: string | null;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("work_shifts").insert({
        ...shift,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-shifts"] }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ShiftRow>) => {
      const { error } = await supabase.from("work_shifts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-shifts"] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-shifts"] }),
  });
}

// ─── User Settings (payroll-related) ───
export function usePayrollSettings() {
  return useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_PAYROLL_SETTINGS;
      return {
        base_hourly_rate: data.base_hourly_rate ?? DEFAULT_PAYROLL_SETTINGS.base_hourly_rate,
        alt_hourly_rate: data.alt_hourly_rate ?? DEFAULT_PAYROLL_SETTINGS.alt_hourly_rate,
        recovery_per_hour: data.recovery_per_hour ?? DEFAULT_PAYROLL_SETTINGS.recovery_per_hour,
        excellence_per_hour: data.excellence_per_hour ?? DEFAULT_PAYROLL_SETTINGS.excellence_per_hour,
        shabbat_hourly_rate: data.shabbat_hourly_rate ?? DEFAULT_PAYROLL_SETTINGS.shabbat_hourly_rate,
        travel_per_shift: data.travel_per_shift ?? DEFAULT_PAYROLL_SETTINGS.travel_per_shift,
        briefing_per_shift: data.briefing_per_shift ?? DEFAULT_PAYROLL_SETTINGS.briefing_per_shift,
        national_insurance_pct: data.national_insurance_pct ?? DEFAULT_PAYROLL_SETTINGS.national_insurance_pct,
        health_insurance_pct: data.health_insurance_pct ?? DEFAULT_PAYROLL_SETTINGS.health_insurance_pct,
        lunch_deduction: data.lunch_deduction ?? DEFAULT_PAYROLL_SETTINGS.lunch_deduction,
        union_national_deduction: data.union_national_deduction ?? DEFAULT_PAYROLL_SETTINGS.union_national_deduction,
        harel_savings_pct: data.harel_savings_pct ?? DEFAULT_PAYROLL_SETTINGS.harel_savings_pct,
        harel_study_pct: data.harel_study_pct ?? DEFAULT_PAYROLL_SETTINGS.harel_study_pct,
        harel_travel_pct: data.harel_travel_pct ?? DEFAULT_PAYROLL_SETTINGS.harel_travel_pct,
        extra_harel_pct: data.extra_harel_pct ?? DEFAULT_PAYROLL_SETTINGS.extra_harel_pct,
        income_sync_mode: (data.income_sync_mode as 'net' | 'bank') ?? DEFAULT_PAYROLL_SETTINGS.income_sync_mode,
      } satisfies PayrollSettings;
    },
  });
}

export function useSavePayrollSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<PayrollSettings>) => {
      const userId = await getUserId();
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update(settings)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ user_id: userId, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-settings"] }),
  });
}

// ─── Monthly Payslip (computed) ───
export function useMonthlyPayslip(year: number, month: number) {
  const { data: shifts, isLoading: shiftsLoading } = useWorkShifts(year, month);
  const { data: settings, isLoading: settingsLoading } = usePayrollSettings();

  const payslip = useMemo(() => {
    if (!shifts || !settings) return null;
    return calcMonthlyPayslip(shifts, settings);
  }, [shifts, settings]);

  return {
    payslip,
    shifts: shifts || [],
    settings: settings || DEFAULT_PAYROLL_SETTINGS,
    isLoading: shiftsLoading || settingsLoading,
  };
}
