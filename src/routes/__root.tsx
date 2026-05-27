import { Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { IncompleteOnboardingModal } from "@/components/onboarding/IncompleteOnboardingModal";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

// ─── Global Error Boundary ───────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GlobalErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-background px-4"
          dir="rtl"
        >
          <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">אופס! משהו השתבש</h1>
              <p className="text-sm text-muted-foreground">
                אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground/60 mt-2 font-mono break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
            >
              נסה שוב
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Not Found ───────────────────────────────────────────────────────────────

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          הדף לא נמצא
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          הדף שחיפשת לא קיים או שהועבר.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          <Toaster />
          <IncompleteOnboardingModal />
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
