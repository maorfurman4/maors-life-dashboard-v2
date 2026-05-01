import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { RootLayout } from "@/components/layout/RootLayout";

export const Route = createFileRoute("/login")({
  component: AuthScreen,
});

type Tab = "register" | "login";

function AuthScreen() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const errorDesc = params.get("error_description") || hashParams.get("error_description");
    if (errorDesc) {
      setError(decodeURIComponent(errorDesc));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const resetMessages = () => { setError(null); setSuccess(null); };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    resetMessages();

    try {
      if (tab === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          setSuccess("נרשמת בהצלחה! מעביר אותך...");
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) setSuccess("נשלח מייל אישור — לחץ על הקישור כדי להשלים את ההרשמה");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid login credentials")) setError("אימייל או סיסמה שגויים");
      else if (msg.includes("Email not confirmed")) setError("המייל עדיין לא אושר — בדוק את תיבת הדואר");
      else if (msg.includes("User already registered")) setError("משתמש קיים — התחבר במקום זאת");
      else if (msg.includes("Password should be at least")) setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      else if (msg.includes("Unable to validate email")) setError("כתובת אימייל לא תקינה");
      else setError(`שגיאה: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    resetMessages();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("לא התקבלה כתובת הפניה מ-Google");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("missing OAuth secret") || msg.includes("Unsupported provider")) {
        setError("התחברות עם Google טרם הוגדרה — השתמש באימייל וסיסמה");
      } else {
        setError(`שגיאה בהתחברות עם Google: ${msg}`);
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RootLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/40 border-t-white" />
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12"
        dir="rtl"
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Logo + Title */}
          <div className="text-center space-y-2">
            <div className="mx-auto mb-4 h-20 w-20 rounded-3xl overflow-hidden">
              <img src="/icon-192.png" alt="My Life" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-4xl font-black text-white">My Life</h1>
            <p className="text-sm text-white/70">הניהול האישי שלך במקום אחד</p>
          </div>

          {/* Glass card */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-white/10 border border-white/10 p-1 gap-1">
              <button
                onClick={() => { setTab("register"); resetMessages(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === "register"
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                הרשמה
              </button>
              <button
                onClick={() => { setTab("login"); resetMessages(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === "login"
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                התחברות
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {tab === "register" && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  placeholder="אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full rounded-2xl bg-white/10 border border-white/15 pr-10 pl-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="סיסמה (מינימום 6 תווים)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full rounded-2xl bg-white/10 border border-white/15 pr-10 pl-10 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-300 text-center bg-red-500/10 rounded-2xl py-2.5 px-3 border border-red-400/20">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-300 text-center bg-emerald-500/10 rounded-2xl py-2.5 px-3 border border-emerald-400/20">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-black text-gray-900 transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/30 border-t-gray-900" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {tab === "login" ? "התחבר" : "צור חשבון"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-xs text-white/40">או</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-[0.98] disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              המשך עם Google
            </button>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
