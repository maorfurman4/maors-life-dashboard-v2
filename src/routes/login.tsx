import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff, User } from "lucide-react";


export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "login" | "register";

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setSuccess("נשלח מייל אישור — בדוק את תיבת הדואר שלך");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid login credentials")) setError("אימייל או סיסמה שגויים");
      else if (msg.includes("User already registered")) setError("משתמש קיים — התחבר במקום זאת");
      else if (msg.includes("Password should be at least")) setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      else setError("שגיאה — נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-3xl font-bold text-primary">M</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Life</h1>
          <p className="text-sm text-muted-foreground">הניהול האישי שלך במקום אחד</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-secondary/30 p-1">
          <button
            onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            התחברות
          </button>
          <button
            onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            הרשמה
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl bg-secondary/40 border border-border pr-10 pl-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-xl bg-secondary/40 border border-border pr-10 pl-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמה (מינימום 6 תווים)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-xl bg-secondary/40 border border-border pr-10 pl-10 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg py-2.5 px-3 border border-destructive/20">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-400 text-center bg-emerald-400/10 rounded-lg py-2.5 px-3 border border-emerald-400/20">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {mode === "login" ? "התחבר" : "צור חשבון"}
          </button>
        </form>

      </div>
    </div>
  );
}
