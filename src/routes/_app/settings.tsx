import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { SettingsPersonal } from "@/components/settings/SettingsPersonal";
import { SettingsNutrition } from "@/components/settings/SettingsNutrition";
import { SettingsSport } from "@/components/settings/SettingsSport";
import { SettingsWork } from "@/components/settings/SettingsWork";
import { SettingsFinance } from "@/components/settings/SettingsFinance";
import { SettingsFinanceCategories } from "@/components/settings/SettingsFinanceCategories";
import { SettingsModules } from "@/components/settings/SettingsModules";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="relative -m-3 md:-m-6 min-h-[calc(100vh+3.5rem)]">
      {/* Background image — fixed so it doesn't scroll */}
      <div className="fixed inset-0 bg-[url('/settings-bg.jpg')] bg-cover bg-center" style={{ zIndex: 0 }} />
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/70" style={{ zIndex: 0 }} />

      {/* Content */}
      <div
        className="relative space-y-5 pb-24 max-w-4xl mx-auto px-3 md:px-6"
        style={{ zIndex: 1, paddingTop: "calc(3.5rem + 1.25rem)" }}
      >
        <SettingsPersonal />
        <SettingsSport />
        <SettingsNutrition />
        <SettingsFinance />
        <SettingsFinanceCategories />
        <SettingsWork />
        <SettingsModules />

        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">כללי</h3>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-sm text-white/50">שפה</span>
            <span className="text-sm font-medium text-white">עברית</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-sm text-white/50">ערכת נושא</span>
            <span className="text-sm font-medium text-white">כהה</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-white/50">גרסה</span>
            <span className="text-sm font-medium text-white/40" dir="ltr">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
