import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const STORAGE_KEY = 'notification-prompt-dismissed';
const PROMPT_DELAY_MS = 30_000; // 30 seconds after first load

export function NotificationPermission() {
  const [visible, setVisible] = useState(false);
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();

  useEffect(() => {
    // Don't show if already dismissed or not supported or already subscribed
    if (!isSupported || isSubscribed) return;
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) return;
    // Also don't show if the browser already granted/denied permission
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleSubscribe = async () => {
    await subscribe();
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="הרשמה להתראות"
      className="fixed bottom-20 inset-x-4 md:inset-x-auto md:right-6 md:left-auto md:w-[360px] z-[90] rounded-2xl bg-card border border-border shadow-2xl p-5 flex flex-col gap-3"
      dir="rtl"
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        aria-label="סגור"
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">קבל התראות חכמות</h3>
          <p className="text-xs text-muted-foreground">הישאר על המסלול בכל תחומי החיים</p>
        </div>
      </div>

      {/* Benefits list */}
      <ul className="text-sm text-muted-foreground space-y-1 pr-2">
        <li className="flex items-center gap-2">
          <span className="text-primary">💪</span> תזכורות לאימון
        </li>
        <li className="flex items-center gap-2">
          <span className="text-primary">💰</span> התראות תקציב
        </li>
        <li className="flex items-center gap-2">
          <span className="text-primary">🔥</span> אזהרת שבירת רצף
        </li>
      </ul>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="flex-1 rounded-xl bg-primary text-primary-foreground text-sm font-medium py-2 px-4 hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isLoading ? 'מפעיל...' : 'אפשר התראות'}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-xl border border-border text-sm text-muted-foreground py-2 px-4 hover:bg-muted/50 transition-colors"
        >
          אחר כך
        </button>
      </div>
    </div>
  );
}
