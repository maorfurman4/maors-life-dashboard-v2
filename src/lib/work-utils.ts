// Verified work data types and calculation utilities

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'long_morning' | 'long_night' | 'briefing' | 'vacation' | 'sick';
export type WorkRole = 'guard' | 'shift_manager';

export const SHIFT_TYPES: Record<ShiftType, { label: string; start: string; end: string; hours: number }> = {
  morning:      { label: 'בוקר',         start: '07:00', end: '15:00', hours: 8 },
  afternoon:    { label: 'צהריים',       start: '15:00', end: '23:00', hours: 8 },
  night:        { label: 'לילה',         start: '23:00', end: '07:00', hours: 8 },
  long_morning: { label: 'ארוכה בוקר',   start: '07:00', end: '19:00', hours: 12 },
  long_night:   { label: 'ארוכה לילה',   start: '19:00', end: '07:00', hours: 12 },
  briefing:     { label: 'רענון',         start: '06:00', end: '19:00', hours: 8 },
  vacation:     { label: 'חופש',         start: '—',     end: '—',     hours: 0 },
  sick:         { label: 'מחלה',         start: '—',     end: '—',     hours: 0 },
};

export const ROLES: Record<WorkRole, { label: string; rate: number }> = {
  guard:         { label: 'מאבטח רגיל',      rate: 57.48 },
  shift_manager: { label: 'אחראי משמרת',    rate: 61.08 },
};

export const DEFAULT_RATES = {
  guardRate: 57.48,
  shiftManagerRate: 61.08,
  travelAllowance: 22.60,
  briefingAllowance: 13.58,
  shabbatMultiplier: 1.5,
};

export const DEFAULT_DEDUCTIONS = {
  unionPct: 0.95,
  pensionPct: 7.0,
  educationFundPct: 2.5,
};

export interface ShiftEntry {
  type: ShiftType;
  role: WorkRole;
  date: string;
  isShabbatHoliday: boolean;
  hours: number;
}

export function calcShiftGross(
  shift: ShiftEntry,
  rates = DEFAULT_RATES
): number {
  if (shift.type === 'vacation' || shift.type === 'sick') return 0;

  const baseRate = shift.role === 'shift_manager' ? rates.shiftManagerRate : rates.guardRate;
  const hours = shift.hours || SHIFT_TYPES[shift.type].hours;
  const multiplier = shift.isShabbatHoliday ? rates.shabbatMultiplier : 1;

  let gross = hours * baseRate * multiplier;
  gross += rates.travelAllowance;
  if (shift.type === 'briefing') {
    gross += rates.briefingAllowance;
  }
  return Math.round(gross * 100) / 100;
}

export function calcMonthlyDeductions(
  gross: number,
  deductions = DEFAULT_DEDUCTIONS
) {
  const union = gross * (deductions.unionPct / 100);
  const pension = gross * (deductions.pensionPct / 100);
  const educationFund = gross * (deductions.educationFundPct / 100);
  const totalDeductions = union + pension + educationFund;
  const net = gross - totalDeductions;

  return {
    union: Math.round(union * 100) / 100,
    pension: Math.round(pension * 100) / 100,
    educationFund: Math.round(educationFund * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}
