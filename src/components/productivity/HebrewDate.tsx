import { getHebrewDate, getGregorianDateHebrew } from "@/lib/hebrew-date";

export function HebrewDate() {
  const hebrew = getHebrewDate();
  const gregorian = getGregorianDateHebrew();
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{gregorian}</p>
      {hebrew && <p className="text-xs text-muted-foreground/70">{hebrew}</p>}
    </div>
  );
}
