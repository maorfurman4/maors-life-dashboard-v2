import { useState } from "react";
import { User } from "lucide-react";

interface PersonalData {
  fullName: string;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
}

export function SettingsPersonal() {
  const [data, setData] = useState<PersonalData>({
    fullName: "",
    dateOfBirth: "",
    heightCm: "",
    weightKg: "",
  });

  const update = (key: keyof PersonalData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">פרטים אישיים</h3>
      </div>
      <div className="space-y-3">
        {([
          { key: "fullName" as const, label: "שם מלא", type: "text", placeholder: "הזן שם" },
          { key: "dateOfBirth" as const, label: "תאריך לידה", type: "date", placeholder: "" },
          { key: "heightCm" as const, label: 'גובה (ס"מ)', type: "number", placeholder: "170" },
          { key: "weightKg" as const, label: 'משקל (ק"ג)', type: "number", placeholder: "75" },
        ]).map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{f.label}</label>
            <input
              type={f.type}
              value={data[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-36 md:w-40 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
              dir="ltr"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
