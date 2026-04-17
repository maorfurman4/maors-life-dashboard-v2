import { createFileRoute } from "@tanstack/react-router";
import { Settings, Save, Info } from "lucide-react";
import { SettingsPersonal } from "@/components/settings/SettingsPersonal";
import { SettingsNutrition } from "@/components/settings/SettingsNutrition";
import { SettingsSport } from "@/components/settings/SettingsSport";
import { SettingsWork } from "@/components/settings/SettingsWork";
import { SettingsFinance } from "@/components/settings/SettingsFinance";
import { SettingsFinanceCategories } from "@/components/settings/SettingsFinanceCategories";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">הגדרות</h1>
            <p className="text-xs text-muted-foreground">פרופיל, יעדים והעדפות</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors min-h-[44px]">
          <Save className="h-4 w-4" />
          שמור
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          כל השדות ריקים כברירת מחדל — הזן את הנתונים האישיים שלך. הנתונים יישמרו אחרי חיבור לחשבון.
        </p>
      </div>

      <SettingsPersonal />
      <SettingsNutrition />
      <SettingsSport />
      <SettingsWork />
      <SettingsFinance />
      <SettingsFinanceCategories />

      <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-semibold">כללי</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">שפה</span>
          <span className="text-sm font-medium">עברית</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">ערכת נושא</span>
          <span className="text-sm font-medium">כהה</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">גרסה</span>
          <span className="text-sm font-medium text-muted-foreground" dir="ltr">1.0.0</span>
        </div>
      </div>
    </div>
  );
}
