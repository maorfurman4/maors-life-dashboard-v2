import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

// Routes where the modal must NOT appear
const SUPPRESSED_PATHS = ["/login", "/auth"];

export function IncompleteOnboardingModal() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (
    isLoading ||
    !user ||
    !profile ||
    profile.onboarding_completed ||
    dismissed ||
    SUPPRESSED_PATHS.includes(location.pathname)
  ) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-10"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setDismissed(true)}
      />

      {/* Glass card — slides up from bottom */}
      <div className="relative w-full max-w-sm backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        <div className="space-y-2">
          <h2 className="text-lg font-black text-white">היי, עוד קצת וסיימנו! 👋</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            כדי שנוכל להתאים עבורך את הנתונים המדויקים ביותר, נשמח שתשלים/י את הגדרת הפרופיל שלך.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            className="w-full py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            השלם עכשיו
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
          >
            אחר כך
          </button>
        </div>
      </div>
    </div>
  );
}
