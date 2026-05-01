import { useEffect, useState } from "react";
import { RootLayout } from "@/components/layout/RootLayout";

const MESSAGES = [
  "מסנכרנים את המטרות שלך...",
  "בונים את הפרופיל האישי...",
  "מכוונים את ההמלצות...",
  "כמעט מוכן! 🎉",
];

const STEP_DURATION = 900; // ms per message

interface Props {
  name: string;
  onComplete: () => void;
}

export function MagicMoment({ name, onComplete }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const firstName = name.trim().split(" ")[0] || "אתה";

  useEffect(() => {
    const total = MESSAGES.length * STEP_DURATION;

    const msgTimer = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, STEP_DURATION);

    // Smooth progress bar via rAF
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min((elapsed / total) * 100, 100));
      if (elapsed < total) {
        rafId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      clearInterval(msgTimer);
      cancelAnimationFrame(rafId);
    };
  }, [onComplete]);

  return (
    <RootLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-8 gap-10" dir="rtl">
        {/* Logo */}
        <div className="h-20 w-20 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-4xl font-black text-white">M</span>
        </div>

        {/* Greeting */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">
            {firstName}, מכינים את האפליקציה עבורך...
          </h2>
          <p
            key={msgIdx}
            className="text-sm text-white/60 animate-in fade-in duration-300"
          >
            {MESSAGES[msgIdx]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </RootLayout>
  );
}
