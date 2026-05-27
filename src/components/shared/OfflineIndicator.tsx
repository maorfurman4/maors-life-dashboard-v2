import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground py-2 px-4 text-sm font-medium backdrop-blur-sm">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>אין חיבור לאינטרנט — שינויים יסתנכרנו בחזרה</span>
    </div>
  );
}
