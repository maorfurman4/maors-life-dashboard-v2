import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_prompt_dismissed";

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const apple = isIOS();
    setIsApple(apple);

    if (apple) {
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 inset-x-3 z-50 rounded-2xl p-4 shadow-2xl"
          style={{
            background: "rgba(20, 20, 40, 0.97)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
          }}
          dir="rtl"
        >
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <Smartphone className="h-5 w-5 text-indigo-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white mb-1">📲 הוסף לדף הבית</p>
              {isApple ? (
                <p className="text-xs text-white/60 leading-relaxed">
                  לחץ על &apos;שתף&apos; ואז &apos;הוסף למסך הבית&apos;
                </p>
              ) : (
                <p className="text-xs text-white/60">
                  התקן את האפליקציה לגישה מהירה
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isApple && deferredPrompt && (
                <button
                  onClick={install}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "rgba(99,102,241,0.85)",
                    color: "white",
                  }}
                >
                  התקן
                </button>
              )}
              <button
                onClick={dismiss}
                className="h-7 w-7 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                aria-label="סגור"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
