import { useState, useEffect } from "react";
import { Zap, RefreshCw } from "lucide-react";
import { generateText } from "@/lib/ai-service";
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
    <div className="rounded-3xl bg-sport/15 backdrop-blur-md border border-sport/25 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-sport" />
          <p className="text-xs font-bold uppercase tracking-widest text-sport">עובדת היום</p>
        </div>
        {!loading && (
          <button
            onClick={() => fetchFact(true)}
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="עובדה חדשה"
          >
            <RefreshCw className="h-3 w-3 text-white/60" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-white/10 animate-pulse rounded-full w-full" />
          <div className="h-3 bg-white/10 animate-pulse rounded-full w-4/5" />
          <div className="h-3 bg-white/10 animate-pulse rounded-full w-3/5" />
        </div>
      ) : (
        <p className="text-sm text-white/80 leading-relaxed">{fact}</p>
      )}
    </div>
  );
}
