export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;
  source: 'url' | 'file' | 'google-fonts';
  sourceUrl?: string;
  blobData: ArrayBuffer;
  format: 'woff2' | 'ttf' | 'otf' | 'woff';
  addedAt: number;
}

const DB_NAME = 'fontcode';
const DB_VERSION = 1;
const STORE_NAME = 'custom-fonts';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      dbPromise = null;
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB 被阻塞'));
    };
  });
  return dbPromise;
}

async function saveFont(font: CustomFont): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(font);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('保存字体失败'));
  });
}

export async function loadAllFonts(): Promise<CustomFont[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const raw = request.result as CustomFont[];
      const valid = raw.filter(
        (f): f is CustomFont =>
          f != null &&
          typeof f.id === 'string' &&
          typeof f.name === 'string' &&
          f.blobData instanceof ArrayBuffer
      );
      resolve(valid);
    };
    request.onerror = () => reject(request.error ?? new Error('读取字体列表失败'));
  });
}

async function removeFontById(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('删除字体失败'));
  });
}
