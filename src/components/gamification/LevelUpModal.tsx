import { useEffect, useState } from "react";

interface LevelUpModalProps {
  newLevel: number | null;
  onDismiss: () => void;
}

export function LevelUpModal({ newLevel, onDismiss }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!newLevel) {
      setVisible(false);
      return;
    }
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 5000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [newLevel, onDismiss]);

  if (!newLevel) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-[300] flex items-center justify-center",
        "bg-black/70 backdrop-blur-sm",
        "transition-opacity duration-400",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onClick={() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="עלית רמה"
    >
      <div
        className={[
          "flex flex-col items-center gap-4 px-8 py-10 rounded-3xl",
          "bg-gradient-to-b from-yellow-900/80 to-orange-900/80 border border-yellow-500/40",
          "shadow-2xl shadow-yellow-900/50 max-w-xs w-[90vw]",
          "transition-all duration-400",
          visible ? "scale-100 opacity-100" : "scale-75 opacity-0",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl animate-bounce">🎉</div>
        <div className="text-center" dir="rtl">
          <p className="text-lg font-bold text-yellow-300 mb-1">עלית רמה!</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-6xl font-black text-white">{newLevel}</span>
          </div>
          <p className="text-sm text-white/60 mt-2">כל הכבוד, המשך כך!</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 400);
          }}
          className="mt-2 px-6 py-2 rounded-full bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition-colors"
        >
          תודה!
        </button>
      </div>
    </div>
  );
}
