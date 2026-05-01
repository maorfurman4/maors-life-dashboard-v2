import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/use-sport-data";

const TOGGLEABLE_MODULES = [
  { id: "market", label: "שוק ההון" },
  { id: "work",   label: "עבודה"    },
];

export function SettingsModules() {
  const { data: settings } = useUserSettings();
  const { mutate: updateSettings } = useUpdateUserSettings();

  const hiddenModules = (settings?.hidden_modules as string[]) ?? [];
  const isHidden = (id: string) => hiddenModules.includes(id);

  const toggleModule = (id: string) => {
    const updated = isHidden(id)
      ? hiddenModules.filter((m) => m !== id)
      : [...hiddenModules, id];
    updateSettings({ hidden_modules: updated });
  };

  return (
    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-white/70" />
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest">מודולים פעילים</h3>
          <p className="text-xs text-white/40">בחר אילו מודולים יוצגו בניווט</p>
        </div>
      </div>

      <div className="space-y-3">
        {TOGGLEABLE_MODULES.map((module) => (
          <div key={module.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <span className="text-sm text-white/70">{module.label}</span>
            <Switch checked={!isHidden(module.id)} onCheckedChange={() => toggleModule(module.id)} />
          </div>
        ))}
      </div>

      <p className="text-xs text-white/30">
        בית, ספורט, תזונה וכלכלה תמיד פעילים
      </p>
    </div>
  );
}
