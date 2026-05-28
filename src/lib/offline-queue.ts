// Simple IndexedDB-based queue for offline mutations

const DB_NAME = 'livedash-offline';
const STORE_NAME = 'mutation-queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface QueuedMutation {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

export async function queueMutation(
  mutation: Omit<QueuedMutation, 'id' | 'timestamp'>,
): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ ...mutation, timestamp: Date.now() });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openDatabase();
  try {
    return await new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueuedMutation[]);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function clearMutation(id: number): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } finally {
    db.close();
  }
}

/** Remove all mutations older than 7 days. Should be called before flushing the queue. */
export async function purgeExpiredMutations(): Promise<void> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const db = await openDatabase();
  try {
    const all = await new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as QueuedMutation[]);
      req.onerror = () => reject(req.error);
    });

    const expired = all.filter((m) => m.timestamp < sevenDaysAgo && m.id != null);
    if (expired.length === 0) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const m of expired) {
      store.delete(m.id!);
    }
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } finally {
    db.close();
  }
}
