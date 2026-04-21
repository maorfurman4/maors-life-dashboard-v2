import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { generateText } from "@/lib/gemini";
import { useProfile } from "@/hooks/use-profile";
import { useNutritionEntries } from "@/hooks/use-sport-data";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_QUESTIONS = [
  "מה אני צריך לאכול לפני אימון?",
  "כמה חלבון ביום?",
  "ארוחת בוקר עם הרבה חלבון",
  "מה לאכול לפני שינה?",
  "איך להגדיל מסה בצורה בריאה?",
  "מה הכי מומלץ לאחרי אימון?",
];

export function NutritionAIZone() {
  const { data: profile } = useProfile();
  const { data: entries = [] } = useNutritionEntries(new Date().toISOString().slice(0, 10));

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const name    = profile?.full_name?.split(" ")[0] ?? "המשתמש";
    const goal    = profile?.nutrition_goal ?? "לא הוגדר";
    const weight  = profile?.weight_kg ? `${profile.weight_kg} ק"ג` : "לא ידוע";
    const todayCal = entries.reduce((s, e) => s + (e.calories || 0), 0);
    const todayPro = entries.reduce((s, e) => s + (e.protein_g || 0), 0);
    return `אתה דיאטן ישראלי מומחה, ענה בעברית קצרה וישירה (דוגרי, מקסימום 3 משפטים או 4 נקודות).
פרטי המשתמש: שם=${name}, משקל=${weight}, יעד=${goal}, קלוריות היום=${todayCal} קל׳, חלבון היום=${todayPro}g.
אל תאמר "שלום" ואל תתחיל בנימוסים — ישר לתשובה.`;
  };

  const sendMessage = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "משתמש" : "דיאטן"}: ${m.text}`)
        .join("\n");

      const prompt = `${buildContext()}

היסטוריה:
${history}

משתמש: ${userMsg}
דיאטן:`;

      const response = await generateText(prompt);
      setMessages((prev) => [...prev, { role: "assistant", text: response.trim() }]);
    } catch {
      toast.error("שגיאה — נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setMessages([]);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col" style={{ minHeight: 380 }} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-nutrition/5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-nutrition/15 flex items-center justify-center">
            <Bot className="h-4 w-4 text-nutrition" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>דיאטן AI</h3>
            <p className="text-[10px] text-muted-foreground">שאל כל שאלת תזונה</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center pt-2">שאל שאלה או בחר נושא:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-2.5 py-1.5 rounded-full bg-nutrition/10 text-nutrition text-[11px] font-medium border border-nutrition/20 hover:bg-nutrition/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-nutrition text-nutrition-foreground rounded-tr-sm"
                    : "bg-secondary text-foreground rounded-tl-sm"
                }`}
              >
                {m.role === "assistant" && (
                  <Sparkles className="h-3 w-3 text-nutrition inline ml-1 mb-0.5" />
                )}
                {m.text}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-end">
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-nutrition" />
              <span className="text-xs text-muted-foreground">חושב...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage(input)}
            placeholder="שאל על תזונה, מתכונים, מאקרו..."
            disabled={loading}
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-nutrition min-h-[44px] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="h-11 w-11 rounded-xl bg-nutrition text-nutrition-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
