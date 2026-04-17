import { useEffect, useRef, useState } from "react";
import { Timer, Pause, Play, RotateCcw, X, Plus, Minus } from "lucide-react";

interface RestTimerProps {
  open: boolean;
  onClose: () => void;
  defaultSeconds?: number;
}

const PRESETS = [30, 45, 60, 90, 120, 180];

export function RestTimer({ open, onClose, defaultSeconds = 60 }: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (open) {
      setSecondsLeft(defaultSeconds);
      setTotalSeconds(defaultSeconds);
      setRunning(true);
    }
  }, [open, defaultSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          playBeep();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const reset = () => {
    setSecondsLeft(totalSeconds);
    setRunning(true);
  };
  const adjust = (delta: number) => {
    const next = Math.max(5, secondsLeft + delta);
    setSecondsLeft(next);
    if (next > totalSeconds) setTotalSeconds(next);
  };
  const setPreset = (sec: number) => {
    setTotalSeconds(sec);
    setSecondsLeft(sec);
    setRunning(true);
  };

  if (!open) return null;

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const dash = (1 - progress / 100) * 251;
  const min = Math.floor(secondsLeft / 60);
  const sec = secondsLeft % 60;
  const isDone = secondsLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-card border border-border p-6 space-y-5 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-sport" />
            <h3 className="text-base font-bold">טיימר מנוחה</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary/50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" className="stroke-border" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className={isDone ? "stroke-emerald-400" : "stroke-sport"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${251 - dash} 251`}
                style={{ transition: "stroke-dasharray 0.3s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black tabular-nums ${isDone ? "text-emerald-400" : "text-foreground"}`} dir="ltr">
                {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">{isDone ? "✓ סיים מנוחה!" : running ? "פועל" : "בהמתנה"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => adjust(-15)} className="h-11 w-11 rounded-xl bg-secondary/40 flex items-center justify-center hover:bg-secondary/60">
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="h-14 w-14 rounded-full bg-sport text-sport-foreground flex items-center justify-center shadow-lg shadow-sport/30 hover:opacity-90"
          >
            {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
          <button onClick={reset} className="h-11 w-11 rounded-xl bg-secondary/40 flex items-center justify-center hover:bg-secondary/60">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => adjust(15)} className="h-11 w-11 rounded-xl bg-secondary/40 flex items-center justify-center hover:bg-secondary/60">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 text-center">קיצורים מהירים</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                  totalSeconds === p ? "bg-sport/20 text-sport border border-sport/30" : "bg-secondary/30 hover:bg-secondary/50"
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
