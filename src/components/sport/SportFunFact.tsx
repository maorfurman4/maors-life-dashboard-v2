import { useState, useEffect } from "react";
import { Zap, RefreshCw } from "lucide-react";
import { generateText } from "@/lib/gemini";
import { useProfile } from "@/hooks/use-profile";

export function SportFunFact() {
  const { data: profile } = useProfile();
  const [fact, setFact] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchFact = (force = false) => {
    if (!profile) return;
    const cacheKey = "sport_fact_" + new Date().toDateString();
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setFact(cached);
        return;
      }
    }

    setLoading(true);
    const topics = profile.interest_topics?.join(", ") || "ספורט כללי";
    const sportTypes = profile.sport_types?.join(", ") || "כושר";
    generateText(
      `ספר עובדה מעניינת ומפתיעה אחת (2-3 משפטים בעברית) על ${sportTypes} או ${topics}. היה ספציפי ומדויק. אל תתחיל ב"עובדה".`
    )
      .then((text) => {
        setFact(text);
        sessionStorage.setItem(cacheKey, text);
      })
      .catch(() => setFact(""))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!fact && !loading) return null;

  return (
    <div className="rounded-2xl bg-sport/10 border border-sport/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-sport" />
          <p className="text-xs font-semibold text-sport">עובדת היום</p>
        </div>
        {!loading && (
          <button
            onClick={() => fetchFact(true)}
            className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-sport/20 transition-colors"
            title="עובדה חדשה"
          >
            <RefreshCw className="h-3 w-3 text-sport/70" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-sport/15 animate-pulse rounded-full w-full" />
          <div className="h-3 bg-sport/15 animate-pulse rounded-full w-4/5" />
          <div className="h-3 bg-sport/15 animate-pulse rounded-full w-3/5" />
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed">{fact}</p>
      )}
    </div>
  );
}
