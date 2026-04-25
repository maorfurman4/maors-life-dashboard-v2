import { useState } from "react";
import { BrainCircuit, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/ai-service";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export function SportAIConsultant() {
  const { data: profile } = useProfile();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [bullets, setBullets] = useState<string[]>([]);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error("נא לכתוב שאלה לפני שליחה");
      return;
    }
    setIsLoading(true);
    setResponse("");
    setBullets([]);

    try {
      const sportTypes = profile?.sport_types?.join(", ") || "ספורט כללי";
      const level = profile?.sport_level || "בינוני";
      const goals = profile?.sport_goals?.join(", ") || "שיפור כושר כללי";

      const prompt = `אתה מאמן ספורט ישראלי מנוסה. המשתמש עוסק ב${sportTypes}. רמה: ${level}. יעדים: ${goals}.
שאלת המשתמש: ${question}
ענה בעברית ישירה (דוגרי), עם 3-4 המלצות מעשיות. היה ספציפי, לא כללי.
פרמט את התשובה עם נקודות המתחילות ב"• " (כוכבית ורווח).`;

      const text = await generateText(prompt);
      setResponse(text);

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"));

      if (lines.length >= 2) {
        setBullets(lines.map((l) => l.replace(/^[•\-*]\s*/, "")));
      } else {
        setBullets([]);
      }
    } catch {
      toast.error("שגיאה בקבלת עצה מה-AI");
    } finally {
      setIsLoading(false);
    }
  };

  const displayContent = bullets.length > 0 ? null : response;

  return (
    <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-sport/35 shadow-[0_0_30px_rgba(0,255,135,0.12)] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-sport/20 border border-sport/30 flex items-center justify-center shadow-[0_0_16px_rgba(0,255,135,0.25)]">
          <BrainCircuit className="h-5 w-5 text-sport" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white tracking-tight">ייעוץ ספורטיבי AI</h3>
          <p className="text-[11px] text-white/40">שאל/י כל שאלה על אימונים ובריאות</p>
        </div>
      </div>

      {/* Profile tags */}
      {profile && (
        <div className="flex flex-wrap gap-1.5">
          {profile.sport_types?.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-sport/15 text-sport border border-sport/25 font-semibold">
              {s}
            </span>
          ))}
          {profile.sport_level && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
              רמה: {profile.sport_level}
            </span>
          )}
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="תאר/י את האתגר או השאלה שלך... למשל: איך לשפר סיבולת בריצה? מה לאכול לפני אימון?"
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sport/40 focus:ring-1 focus:ring-sport/30 resize-none"
        />
        <Button
          className="w-full bg-sport hover:opacity-90 text-sport-foreground font-bold rounded-2xl shadow-[0_0_20px_rgba(0,255,135,0.25)] transition-opacity"
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 ml-2 animate-spin" />מעבד...</>
          ) : (
            <><BrainCircuit className="h-4 w-4 ml-2" />קבל/י עצה</>
          )}
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-sport/20 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="h-3 bg-white/10 animate-pulse rounded-full" style={{ width: `${70 + i * 8}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* Response */}
      {(bullets.length > 0 || displayContent) && !isLoading && (
        <div className="rounded-2xl bg-sport/10 border border-sport/20 p-3.5 space-y-2.5">
          <p className="text-xs font-black uppercase tracking-widest text-sport">המלצות המאמן</p>
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-sport flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">{displayContent}</p>
          )}
          <button
            className="text-xs text-white/30 hover:text-white/60 transition-colors pt-1"
            onClick={() => { setResponse(""); setBullets([]); setQuestion(""); }}
          >
            שאל שאלה נוספת
          </button>
        </div>
      )}
    </div>
  );
}
