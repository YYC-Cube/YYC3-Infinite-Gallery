/**
 * @file 背景资源仓库
 * @description 使用 IndexedDB 保存上传背景，配置仅持久化 assetId
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */

const DB_NAME = "yyc3-gallery-assets";
const STORE_NAME = "backgrounds";
const DB_VERSION = 1;
const FALLBACK_PREFIX = "yyc3-bg-asset:";

interface StoredAsset {
  id: string;
  file: Blob;
  createdAt: number;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function saveFallback(id: string, dataUrl: string) {
  try {
    localStorage.setItem(`${FALLBACK_PREFIX}${id}`, dataUrl);
  } catch {
    /* 配额仍不可用时仅保留当前会话预览 */
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB 不可用"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeBackgroundAsset(file: File): Promise<string | null> {
  const id = `bg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({
        id,
        file,
        createdAt: Date.now(),
      } satisfies StoredAsset);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
    return id;
  } catch {
    try {
      saveFallback(id, await readAsDataUrl(file));
      return id;
    } catch {
      return null;
    }
  }
}

export async function loadBackgroundAsset(id: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<Blob | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const asset = request.result as StoredAsset | undefined;
        resolve(asset?.file ?? null);
      };
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (result) return result;
  } catch {
    /* 继续检查降级存储 */
  }

  try {
    const fallback = localStorage.getItem(`${FALLBACK_PREFIX}${id}`);
    if (!fallback) return null;
    const response = await fetch(fallback);
    return await response.blob();
  } catch {
    return null;
  }
}

export async function removeBackgroundAsset(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  } catch {
    /* 清理失败不影响新背景使用 */
  }
  try {
    localStorage.removeItem(`${FALLBACK_PREFIX}${id}`);
  } catch {
    /* 忽略本地存储清理失败 */
  }
}
