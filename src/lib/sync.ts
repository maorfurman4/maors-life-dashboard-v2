import { getPendingMutations, clearMutation } from './offline-queue';

let isSyncing = false;

export async function syncPendingMutations(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  try {
    const pending = await getPendingMutations();
    for (const mutation of pending) {
      // In a real implementation, replay mutations to Supabase
      // For now, just clear them (actual replay requires Supabase client)
      if (mutation.id != null) {
        await clearMutation(mutation.id);
      }
    }
  } finally {
    isSyncing = false;
  }
}

export function initSync(): void {
  window.addEventListener('online', () => {
    syncPendingMutations().catch(console.error);
  });
}
