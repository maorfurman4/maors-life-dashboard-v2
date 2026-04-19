export function getHebrewDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function getGregorianDateHebrew(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDueDate(dateStr: string): {
  label: string;
  isOverdue: boolean;
  isDueSoon: boolean;
} {
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0)
    return {
      label: `איחור של ${Math.abs(diffDays)} ימים`,
      isOverdue: true,
      isDueSoon: false,
    };
  if (diffDays === 0)
    return { label: "היום", isOverdue: false, isDueSoon: true };
  if (diffDays === 1)
    return { label: "מחר", isOverdue: false, isDueSoon: true };
  if (diffDays <= 7)
    return {
      label: `בעוד ${diffDays} ימים`,
      isOverdue: false,
      isDueSoon: true,
    };
  return {
    label: due.toLocaleDateString("he-IL"),
    isOverdue: false,
    isDueSoon: false,
  };
}
