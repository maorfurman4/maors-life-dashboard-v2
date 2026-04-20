import { useState, useMemo } from "react";
import { Brain, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { useStockHoldings } from "@/hooks/use-sport-data";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { useProfile } from "@/hooks/use-profile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryResult {
  greeting: string;
  cot: string[];      // Chain-of-thought reasoning steps
  summary: string;
  tips: string[];
}

// ─── Stub — replace with real Gemini / GPT call ───────────────────────────────
async function analyzePortfolioStub(
  holdings: any[],
  quoteMap: Map<string, any>,
  firstName: string | null,
  gender: string | null
): Promise<SummaryResult> {
  // TODO: call analyzeMarket(prompt) from @/lib/gemini when API is ready
  const totalPL = holdings.reduce((s, h) => {
    const q = quoteMap.get(h.symbol.toUpperCase());
    const price = q?.price ?? Number(h.avg_price);
    return s + (Number(h.shares) * price - Number(h.shares) * Number(h.avg_price));
  }, 0);

  const name    = firstName || (gender === "נקבה" ? "משקיעה" : "משקיע");
  const suffix  = gender === "נקבה" ? "ה" : "";
  const greeting = `שלום${suffix}, ${name}`;

  const hebrewDate = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return {
    greeting,
    cot: [
      `1. בדיקת מספר הניירות בתיק: ${holdings.length} פוזיציות פעילות.`,
      `2. חישוב רווח/הפסד כולל: ${totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}$.`,
      `3. בחינת מצב השוק לפי שינוי יומי ממוצע של הניירות.`,
      `4. שקלול חשיפה סקטוריאלית וגיוון.`,
      `5. גיבוש המלצות בהתבסס על פרופיל הסיכון.`,
    ],
    summary: `היום, ${hebrewDate}. תיק ההשקעות שלך${suffix} מציג ${totalPL >= 0 ? "רווח" : "הפסד"} כולל של ${Math.abs(totalPL).toFixed(2)}$. השוק פועל לפי שעות המסחר הרגילות. ניתוח AI מלא יופעל לאחר חיבור ה-API.`,
    tips: [
      "גיוון בין סקטורים מפחית סיכון — בחן אם התיק מרוכז מדי.",
      `שינוי של 1% ביום בשוק ה-S&P 500 ישפיע על תיק מגוון ב-${(holdings.length * 0.7).toFixed(1)}% בממוצע.`,
      "שקול לקבוע יעדי Stop-Loss להגנת הרווחים.",
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MarketSmartSummary() {
  const { data: holdings } = useStockHoldings();
  const { data: profile } = useProfile();

  const symbols = useMemo(() => (holdings || []).map((h: any) => h.symbol), [holdings]);
  const { data: quotes } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  const [result, setResult]       = useState<SummaryResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [cotOpen, setCotOpen]     = useState(false);
  const [tipsOpen, setTipsOpen]   = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzePortfolioStub(
        holdings || [],
        quoteMap,
        firstName,
        profile?.gender ?? null
      );
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-market/20 bg-market/5 p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-market/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-market" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>ניתוח AI חכם</h3>
            <p className="text-[10px] text-muted-foreground">תובנות שוק יומיות · Chain of Thought</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !holdings || holdings.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-market text-market-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[32px]"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? "מנתח..." : "נתח תיק"}
        </button>
      </div>

      {!holdings || holdings.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          הוסף פוזיציות לתיק כדי לקבל ניתוח AI
        </p>
      ) : !result ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          לחץ/י על "נתח תיק" לקבלת תובנות מותאמות אישית
        </p>
      ) : (
        <div className="space-y-3">
          {/* Greeting */}
          <p className="text-sm font-bold text-market">{result.greeting} 👋</p>

          {/* Summary */}
          <p className="text-xs text-foreground/90 leading-relaxed">{result.summary}</p>

          {/* Chain of Thought */}
          <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <button
              onClick={() => setCotOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold"
            >
              <span className="text-market">🧠 תהליך החשיבה (COT)</span>
              {cotOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {cotOpen && (
              <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                {result.cot.map((step, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                    <span className="text-market mt-0.5 shrink-0">→</span>
                    <span>{step}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <button
              onClick={() => setTipsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold"
            >
              <span>💡 המלצות לשיפור</span>
              {tipsOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {tipsOpen && (
              <ul className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
                <li className="text-[10px] text-muted-foreground/40 italic pt-1">
                  * ניתוח מלא יופעל לאחר חיבור Gemini API
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
