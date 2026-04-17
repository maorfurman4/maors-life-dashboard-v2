---
name: Finance module
description: Expense categories, fixed/variable expenses, savings goal 35%, work income sync, pie chart, insights
type: feature
---
- Expenses split: fixed (recurring monthly) vs variable (one-time)
- Categories: שכירות, מנויים, מזון, דלק, ביגוד, בית, בילויים, בריאות, טיולים, אחר
- Income: automatic from work (payroll engine net/bank) + manual (freelance, private lessons, other)
- Savings goal: 35% of monthly income (configurable in settings)
- Tables: fixed_expenses, expense_categories (DB), expense_entries (extended with expense_type, is_recurring, needs_review), income_entries (extended with source)
- Settings: savings_goal_pct in user_settings, income_sync_mode (net/bank)
- Charts: PieChart for category breakdown, savings progress bar
- Insights: anomaly detection, top categories, daily average, forecast
