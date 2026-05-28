import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        // Use the Supabase URL from the client configuration for a lightweight HEAD probe
        const supabaseUrl = (supabase as any).supabaseUrl as string | undefined;
        const probeUrl = supabaseUrl
          ? `${supabaseUrl}/rest/v1/`
          : 'https://oglhuhnppdlekviodkjb.supabase.co/rest/v1/';
        await fetch(probeUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000),
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const handleOnline = () => checkConnectivity();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground py-2 px-4 text-sm font-medium backdrop-blur-sm">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>אין חיבור לאינטרנט — שינויים יסתנכרנו בחזרה</span>
    </div>
  );
}
