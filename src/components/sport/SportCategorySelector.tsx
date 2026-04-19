import { useState } from "react";
import { ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPORT_CATEGORIES: Record<string, string[]> = {
  "כוח ושרירים": ["חדר כושר", "כאליסתניקה", "פאוורליפטינג", "CrossFit", "מאמן אישי"],
  "סבולת": ["ריצה", "אופניים", "שחייה", "חתירה", "HIIT"],
  "גמישות ומיינד": ["יוגה", "פילאטס", "מדיטציה", "מתיחות"],
  "אמנויות לחימה": ["בוקסינג", "קיקבוקסינג", "ג׳יו-ג׳יטסו", "קראטה", "MMA"],
  "ספורט קבוצתי": ["כדורגל", "כדורסל", "כדורעף", "טניס", "פדל"],
  "מים": ["גלישה", "SUP", "ספינינג מים", "שחייה פתוחה"],
  "חוץ": ["הליכה", "טיולים", "אופניי שטח", "טיפוס סלעים"],
};

interface Props {
  selected?: string;
  onSelect: (category: string) => void;
  recentWorkouts?: string[];
}

export function SportCategorySelector({ selected, onSelect, recentWorkouts = [] }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>("כוח ושרירים");
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const recentUnique = [...new Set(recentWorkouts)].slice(0, 6);

  const handleSelect = (name: string) => {
    onSelect(name);
  };

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onSelect(customText.trim());
      setCustomText("");
      setShowCustom(false);
    }
  };

  return (
    <div className="space-y-3">
      {recentUnique.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">לאחרונה</p>
          <div className="flex flex-wrap gap-2">
            {recentUnique.map((workout) => (
              <button
                key={workout}
                onClick={() => handleSelect(workout)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selected === workout
                    ? "bg-sport text-sport-foreground border-sport"
                    : "bg-sport/10 text-sport border-sport/20 hover:bg-sport/20"
                }`}
              >
                {workout}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(SPORT_CATEGORIES).map(([category, items]) => (
          <div key={category} className="rounded-xl border border-border overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/50 hover:bg-secondary transition-colors"
              onClick={() =>
                setOpenCategory(openCategory === category ? null : category)
              }
            >
              <span className="text-sm font-semibold">{category}</span>
              {openCategory === category ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {openCategory === category && (
              <div className="p-3 flex flex-wrap gap-2">
                {items.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelect(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected === item
                        ? "bg-sport text-sport-foreground border-sport"
                        : "bg-card text-foreground border-border hover:bg-sport/10 hover:border-sport/30 hover:text-sport"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {showCustom ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="הקלד סוג ספורט..."
              className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sport"
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              autoFocus
            />
            <Button size="sm" onClick={handleCustomSubmit} disabled={!customText.trim()}>
              אישור
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)}>
              ביטול
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            אחר (הקלד בחופשי)
          </button>
        )}
      </div>
    </div>
  );
}
