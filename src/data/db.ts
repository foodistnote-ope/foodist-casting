import type { Foodist } from './types';

// ============================================================
// IndexedDB ユーティリティ
//   DB名:    foodist_db
//   バージョン: 1
//   ストア名:  foodists  (keyPath: 'id')
// ============================================================

const DB_NAME = 'foodist_db';
const DB_VERSION = 1;
const STORE_NAME = 'foodists';

/** DB インスタンスをキャッシュ（同一ページ内で1つだけ開く） */
let _dbPromise: Promise<IDBDatabase> | null = null;

/**
 * DB を開く（初回のみ onupgradeneeded でスキーマを作成）
 */
export const openDB = (): Promise<IDBDatabase> => {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
            _dbPromise = null; // 失敗時はキャッシュをリセットして再試行可能に
            reject(req.error);
        };
    });

    return _dbPromise;
};

/** 全件取得 */
export const getAllFoodists = async (): Promise<Foodist[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result as Foodist[]);
        req.onerror = () => reject(req.error);
    });
};

/** 登録件数を取得 */
export const countFoodists = async (): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

/** 1件追加 or 更新（upsert） */
export const putFoodist = async (foodist: Foodist): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(foodist);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

/** 複数件を一括 upsert（既存データはそのまま保持） */
export const putManyFoodists = async (list: Foodist[]): Promise<void> => {
    if (list.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        let pending = list.length;
        for (const f of list) {
            const req = store.put(f);
            req.onsuccess = () => { if (--pending === 0) resolve(); };
            req.onerror = () => reject(req.error);
        }
        tx.onerror = () => reject(tx.error);
    });
};

/** 全件削除してから全件 upsert（バックアップ復元・全件入れ替えに使用） */
export const replaceAllFoodists = async (list: Foodist[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const clearReq = store.clear();
        clearReq.onsuccess = () => {
            if (list.length === 0) { resolve(); return; }
            let pending = list.length;
            for (const f of list) {
                const req = store.put(f);
                req.onsuccess = () => { if (--pending === 0) resolve(); };
                req.onerror = () => reject(req.error);
            }
        };
        clearReq.onerror = () => reject(clearReq.error);
        tx.onerror = () => reject(tx.error);
    });
};

/** 1件削除 */
export const deleteFoodistById = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};
