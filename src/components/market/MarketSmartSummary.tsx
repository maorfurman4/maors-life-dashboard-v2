import { useState, useMemo } from "react";
import { Brain, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { useStockHoldings } from "@/hooks/use-sport-data";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { useProfile } from "@/hooks/use-profile";
import { generateText, parseGeminiJson } from "@/lib/ai-service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryResult {
  greeting: string;
  cot:      string[];
  summary:  string;
  tips:     string[];
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPortfolioPrompt(
  holdings:  any[],
  quoteMap:  Map<string, any>,
  firstName: string | null,
  gender:    string | null
): string {
  const suffix = gender === "נקבה" ? "ה" : "";
  const name   = firstName ?? (gender === "נקבה" ? "משקיעה" : "משקיע");

  const holdingsData = holdings.map((h) => {
    const q      = quoteMap.get(h.symbol?.toUpperCase());
    const price  = q?.price ?? Number(h.avg_price);
    const pl     = Number(h.shares) * price - Number(h.shares) * Number(h.avg_price);
    const plPct  = (pl / (Number(h.shares) * Number(h.avg_price))) * 100;
    return {
      symbol:    h.symbol,
      shares:    h.shares,
      avg_price: h.avg_price,
      current_price: price.toFixed(2),
      pl_usd:    pl.toFixed(2),
      pl_pct:    plPct.toFixed(1) + "%",
    };
  });

  const hebrewDate = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return `אתה אנליסט פיננסי מומחה המספק ניתוח תיק השקעות בעברית בסגנון ישיר ומקצועי.

תאריך: ${hebrewDate}
משתמש${suffix}: ${name}
נתוני תיק: ${JSON.stringify(holdingsData, null, 2)}

ספק ניתוח מקיף בפורמט JSON בלבד:
{
  "greeting": "ברכה קצרה בעברית, מותאמת מגדרית ל${name}",
  "cot": [
    "1. [שלב ניתוח ראשון — בדיקת הפוזיציות]",
    "2. [שלב ניתוח שני — רווח/הפסד כולל]",
    "3. [שלב שלישי — פיזור סיכונים]",
    "4. [שלב רביעי — מגמות שוק רלוונטיות]",
    "5. [שלב חמישי — סיכום והמלצות]"
  ],
  "summary": "סיכום 2–3 משפטים על מצב התיק, מה עובד, מה דורש תשומת לב",
  "tips": [
    "המלצה ספציפית ומעשית 1",
    "המלצה ספציפית ומעשית 2",
    "המלצה ספציפית ומעשית 3"
  ]
}
כתוב הכל בעברית. היה ישיר, מקצועי, וספציפי לנתוני התיק. ללא markdown, JSON תקין בלבד.`;
}

// ─── Fallback (if API unavailable) ───────────────────────────────────────────

function buildFallback(holdings: any[], quoteMap: Map<string, any>, firstName: string | null, gender: string | null): SummaryResult {
  const suffix  = gender === "נקבה" ? "ה" : "";
  const name    = firstName ?? (gender === "נקבה" ? "משקיעה" : "משקיע");
  const totalPL = holdings.reduce((s, h) => {
    const q     = quoteMap.get(h.symbol?.toUpperCase());
    const price = q?.price ?? Number(h.avg_price);
    return s + (Number(h.shares) * price - Number(h.shares) * Number(h.avg_price));
  }, 0);
  const hebrewDate = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  return {
    greeting: `שלום${suffix}, ${name}`,
    cot: [
      `1. בדיקת מספר הניירות בתיק: ${holdings.length} פוזיציות פעילות.`,
      `2. חישוב רווח/הפסד כולל: ${totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}$.`,
      "3. בחינת מצב השוק לפי שינוי יומי ממוצע.",
      "4. שקלול חשיפה סקטוריאלית.",
      "5. גיבוש המלצות (מצב לא מקוון).",
    ],
    summary: `היום, ${hebrewDate}. הרווח/הפסד הכולל: ${totalPL >= 0 ? "+" : ""}${Math.abs(totalPL).toFixed(2)}$. לחץ/י על "נתח תיק" לניתוח AI מלא.`,
    tips: [
      "גיוון בין סקטורים מפחית סיכון.",
      "שקול Stop-Loss על פוזיציות מפסידות.",
      "בחן רמת חשיפה מול מזומן.",
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MarketSmartSummary() {
  const { data: holdings } = useStockHoldings();
  const { data: profile  } = useProfile();

  const symbols  = useMemo(() => (holdings || []).map((h: any) => h.symbol), [holdings]);
  const { data: quotes } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  const [result,   setResult]   = useState<SummaryResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [cotOpen,  setCotOpen]  = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [aiError,  setAiError]  = useState<string | null>(null);

  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  const handleAnalyze = async () => {
    setLoading(true);
    setAiError(null);
    try {
      const prompt = buildPortfolioPrompt(holdings || [], quoteMap, firstName, profile?.gender ?? null);
      const raw    = await generateText(prompt);
      const parsed = parseGeminiJson<SummaryResult>(raw);
      setResult({
        greeting: parsed.greeting ?? "",
        cot:      Array.isArray(parsed.cot)  ? parsed.cot  : [],
        summary:  parsed.summary  ?? "",
        tips:     Array.isArray(parsed.tips) ? parsed.tips : [],
      });
    } catch (err) {
      console.error("Market AI error:", err);
      // Graceful degradation — show computed fallback
      const fallback = buildFallback(holdings || [], quoteMap, firstName, profile?.gender ?? null);
      setResult(fallback);
      setAiError("AI לא זמין — מוצג ניתוח מחושב");
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
            <p className="text-[10px] text-muted-foreground">AI · תובנות שוק · Chain of Thought</p>
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

      {aiError && (
        <p className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1.5">
          ⚠️ {aiError}
        </p>
      )}

      {!holdings || holdings.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">הוסף פוזיציות לתיק כדי לקבל ניתוח AI</p>
      ) : !result ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          לחץ/י על "נתח תיק" לקבלת תובנות מותאמות אישית
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-market">{result.greeting} 👋</p>
          <p className="text-xs text-foreground/90 leading-relaxed">{result.summary}</p>

          {/* Chain of Thought */}
          <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <button
              onClick={() => setCotOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold"
            >
              <span className="text-market">🧠 תהליך החשיבה (COT)</span>
              {cotOpen
                ? <ChevronUp   className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
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
              {tipsOpen
                ? <ChevronUp   className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {tipsOpen && (
              <ul className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
