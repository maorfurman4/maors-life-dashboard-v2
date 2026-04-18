import { useState, useEffect } from "react";
import { TrendingUp, Save } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

const INVESTMENT_TYPES = [
  "מניות", "אג\"ח", "קרנות מחקות / ETF",
  "קריפטו", "נדל\"ן", "סחורות",
];
const INVESTMENT_LEVELS = ["מתחיל", "בינוני", "מנוסה", "מקצועי"];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
        selected
          ? "bg-market/20 border-market text-market"
          : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      }`}>
      {label}
    </button>
  );
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export function SettingsMarket() {
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [draft, setDraft] = useState({
    invests_in_market: false,
    investment_types: [] as string[],
    investment_level: "",
  });

  useEffect(() => {
    if (!profile) return;
    setDraft({
      invests_in_market: profile.invests_in_market ?? false,
      investment_types: profile.investment_types ?? [],
      investment_level: profile.investment_level ?? "",
    });
  }, [profile]);

  const handleSave = () => {
    updateProfile(
      {
        invests_in_market: draft.invests_in_market,
        investment_types: draft.investment_types,
        investment_level: draft.investment_level || null,
      },
      {
        onSuccess: () => toast.success("הגדרות שוק ההון נשמרו"),
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-market" />
        <h3 className="text-sm font-semibold">שוק ההון</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">האם אתה משקיע?</label>
          <div className="flex gap-2">
            <Chip label="כן" selected={draft.invests_in_market === true}
              onClick={() => setDraft((d) => ({ ...d, invests_in_market: true }))} />
            <Chip label="לא עדיין" selected={draft.invests_in_market === false}
              onClick={() => setDraft((d) => ({ ...d, invests_in_market: false }))} />
          </div>
        </div>

        {draft.invests_in_market && (
          <>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">סוגי השקעה</label>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_TYPES.map((t) => (
                  <Chip key={t} label={t} selected={draft.investment_types.includes(t)}
                    onClick={() => setDraft((d) => ({ ...d, investment_types: toggle(d.investment_types, t) }))} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">רמת ניסיון</label>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_LEVELS.map((l) => (
                  <Chip key={l} label={l} selected={draft.investment_level === l}
                    onClick={() => setDraft((d) => ({ ...d, investment_level: l }))} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-market/15 text-market text-sm font-medium hover:bg-market/25 transition-colors disabled:opacity-50 min-h-[44px]">
        <Save className="h-4 w-4" />
        {isPending ? "שומר..." : "שמור הגדרות שוק"}
      </button>
    </div>
  );
}
