import { Watch, Heart, Flame, Footprints, Plus } from "lucide-react";
import { useState } from "react";

export function SportAppleWatchEntry() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({
    calories: "",
    heartRate: "",
    steps: "",
    duration: "",
  });

  return (
    <div className="rounded-2xl border border-sport/15 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Watch className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">הזנת נתוני Apple Watch</h3>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[10px] text-sport font-semibold hover:underline"
        >
          {open ? "סגור" : "הזן נתונים"}
        </button>
      </div>

      {!open && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Flame, label: "קלוריות", value: "—", color: "text-sport" },
            { icon: Heart, label: "דופק ממוצע", value: "—", color: "text-rose-400" },
            { icon: Footprints, label: "צעדים", value: "—", color: "text-cyan-400" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-secondary/30 p-2.5 text-center">
              <item.icon className={`h-4 w-4 mx-auto mb-1 ${item.color}`} />
              <p className="text-xs font-bold">{item.value}</p>
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-2.5">
          {[
            { key: "calories" as const, label: "קלוריות שנשרפו", placeholder: "320", icon: Flame },
            { key: "heartRate" as const, label: "דופק ממוצע", placeholder: "142", icon: Heart },
            { key: "steps" as const, label: "צעדים", placeholder: "8500", icon: Footprints },
            { key: "duration" as const, label: "זמן פעילות (דקות)", placeholder: "45", icon: Watch },
          ].map((field) => (
            <div key={field.key} className="flex items-center gap-2.5">
              <field.icon className="h-4 w-4 text-sport/60 shrink-0" />
              <input
                type="number"
                placeholder={field.placeholder}
                value={data[field.key]}
                onChange={(e) => setData(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="flex-1 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-sport"
                dir="ltr"
              />
              <span className="text-[10px] text-muted-foreground w-16">{field.label}</span>
            </div>
          ))}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sport/15 text-sport text-sm font-semibold hover:bg-sport/25 transition-colors">
            <Plus className="h-4 w-4" />
            שמור נתונים
          </button>
        </div>
      )}
    </div>
  );
}
