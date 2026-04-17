---
name: Payroll engine and work-finance sync
description: Automatic payroll calculation from shifts, deduction rules, and income sync to finance module
type: feature
---
## Payroll Engine
- `src/lib/payroll-engine.ts` — calculates monthly payslip from shifts + settings
- Salary components: base pay, recovery, excellence, shabbat, travel, briefing
- Deduction groups: mandatory (NI, health), office (lunch, union), pension (4x harel)
- Default rates from real payslips (base 52.80, alt 56.20, shabbat 79.20)

## Data Hooks
- `src/hooks/use-work-data.ts` — useWorkShifts, useAddShift, useDeleteShift, usePayrollSettings, useSavePayrollSettings, useMonthlyPayslip

## Work-Finance Sync
- FinanceBalanceCard reads payroll net/bank as automatic work income
- user_settings.income_sync_mode controls whether 'net' or 'bank' amount syncs
- No manual income entry needed for work salary

## DB Columns Added
- work_shifts: has_briefing (boolean)
- user_settings: 16 new payroll columns (rates, deduction %, sync mode)
