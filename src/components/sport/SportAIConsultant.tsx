import { useState } from "react";
import { BrainCircuit, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/gemini";
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

      // Parse bullet points
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"));

      if (lines.length >= 2) {
        setBullets(lines.map((l) => l.replace(/^[•\-*]\s*/, "")));
      } else {
        // Fallback: show as plain text
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
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-sport/10 flex items-center justify-center">
          <BrainCircuit className="h-4 w-4 text-sport" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">יועץ ספורט AI</h3>
          <p className="text-xs text-muted-foreground">שאל כל שאלה על אימונים ובריאות</p>
        </div>
      </div>

      {profile && (
        <div className="flex flex-wrap gap-1.5">
          {profile.sport_types?.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full bg-sport/10 text-sport border border-sport/20"
            >
              {s}
            </span>
          ))}
          {profile.sport_level && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
              רמה: {profile.sport_level}
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="תאר את האתגר או השאלה שלך... למשל: איך אני יכול לשפר את הסיבולת שלי בריצה? מה לאכול לפני אימון?"
          rows={3}
          className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sport resize-none"
        />
        <Button
          className="w-full bg-sport hover:bg-sport/90 text-sport-foreground"
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <BrainCircuit className="h-4 w-4 ml-2" />
              קבל עצה
            </>
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-sport/20 animate-pulse flex-shrink-0 mt-0.5" />
              <div
                className="h-3 bg-sport/10 animate-pulse rounded-full"
                style={{ width: `${70 + i * 8}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {(bullets.length > 0 || displayContent) && !isLoading && (
        <div className="rounded-xl bg-secondary p-3 space-y-2">
          <p className="text-xs font-bold text-sport">המלצות המאמן</p>
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-sport flex-shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayContent}</p>
          )}
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            onClick={() => {
              setResponse("");
              setBullets([]);
              setQuestion("");
            }}
          >
            שאל שאלה נוספת
          </button>
        </div>
      )}
    </div>
  );
}
