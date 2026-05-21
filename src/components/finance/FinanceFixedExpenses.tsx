/**
 * FinanceFixedExpenses — delegates to the unified FinanceRecurringExpenses component.
 * Kept as a named export for backward-compatibility with existing imports.
 */
import { FinanceRecurringExpenses } from "./FinanceRecurringExpenses";

export function FinanceFixedExpenses() {
  return <FinanceRecurringExpenses mode="all" />;
}
