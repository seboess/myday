import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'myday-files';
const STORE_NAME = 'materials';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveFile(id: string, file: File): Promise<void> {
  const db = await getDB();
  const buffer = await file.arrayBuffer();
  await db.put(STORE_NAME, buffer, id);
}

export async function getFile(id: string): Promise<ArrayBuffer | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function getStorageUsage(): Promise<number> {
  const db = await getDB();
  const keys = await db.getAllKeys(STORE_NAME);
  let total = 0;
  for (const key of keys) {
    const data = await db.get(STORE_NAME, key);
    if (data instanceof ArrayBuffer) {
      total += data.byteLength;
    }
  }
  return total;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_STORAGE = 500 * 1024 * 1024; // 500MB

export { MAX_FILE_SIZE, MAX_TOTAL_STORAGE };
