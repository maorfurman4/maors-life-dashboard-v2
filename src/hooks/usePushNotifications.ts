import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('התראות Push אינן נתמכות בדפדפן זה');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('הרשאה נדחתה');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer
          : undefined,
      };
      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use type assertion to bypass strict Supabase table typing for the
        // push_subscriptions table (not yet in generated types).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        });
      }
      setIsSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרשמה להתראות');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isLoading, error, subscribe };
}
