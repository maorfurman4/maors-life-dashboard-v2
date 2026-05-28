import { getPendingMutations, clearMutation, purgeExpiredMutations, QueuedMutation } from './offline-queue';
import { supabase } from '@/integrations/supabase/client';

let isSyncing = false;

async function replayMutation(mutation: QueuedMutation): Promise<boolean> {
  try {
    const { table, operation, data } = mutation;

    if (operation === 'insert') {
      const { error } = await (supabase as any).from(table).insert(data);
      if (error) throw error;
    } else if (operation === 'update') {
      const { id, ...updateData } = data;
      const { error } = await (supabase as any).from(table).update(updateData).eq('id', id);
      if (error) throw error;
    } else if (operation === 'delete') {
      const { error } = await (supabase as any).from(table).delete().eq('id', data.id);
      if (error) throw error;
    }
    return true;
  } catch (e) {
    console.error('Failed to replay mutation:', mutation, e);
    return false;
  }
}

export async function syncPendingMutations(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  try {
    // Remove expired mutations before replaying
    await purgeExpiredMutations();

    const pending = await getPendingMutations();
    for (const mutation of pending) {
      if (mutation.id == null) continue;
      const success = await replayMutation(mutation);
      // Only remove from queue if replay succeeded
      if (success) {
        await clearMutation(mutation.id);
      }
    }
  } finally {
    isSyncing = false;
  }
}

// Module-level reference so we can remove the exact same listener
let syncListener: (() => void) | null = null;

export function initSync(): void {
  // Remove any previously registered listener to prevent accumulation
  if (syncListener) {
    window.removeEventListener('online', syncListener);
  }
  syncListener = () => {
    syncPendingMutations().catch(console.error);
  };
  window.addEventListener('online', syncListener);
}

export function stopSync(): void {
  if (syncListener) {
    window.removeEventListener('online', syncListener);
    syncListener = null;
  }
}
