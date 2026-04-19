import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/use-sport-data";

const TOGGLEABLE_MODULES = [
  { id: "market", label: "שוק ההון" },
  { id: "work", label: "עבודה" },
  { id: "coupons", label: "קופונים" },
  { id: "tasks", label: "משימות" },
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
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">מודולים פעילים</h3>
          <p className="text-xs text-muted-foreground">בחר אילו מודולים יוצגו בניווט</p>
        </div>
      </div>

      <div className="space-y-3">
        {TOGGLEABLE_MODULES.map((module) => (
          <div key={module.id} className="flex items-center justify-between">
            <span className="text-sm">{module.label}</span>
            <Switch
              checked={!isHidden(module.id)}
              onCheckedChange={() => toggleModule(module.id)}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        בית, ספורט, תזונה וכלכלה תמיד פעילים
      </p>
    </div>
  );
}
