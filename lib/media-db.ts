/**
 * @file 本地媒体文件持久化
 * @description 使用 IndexedDB 保存用户上传的音频/视频，使刷新后仍可恢复播放列表
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-18
 * @updated 2026-11-18
 */

const DB_NAME = 'yyc3-infinite-gallery-media';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';

export interface StoredMediaFile {
	id: string;
	file: File;
	createdAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB 不可用'));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
				store.createIndex('createdAt', 'createdAt', { unique: false });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function storeMediaFile(id: string, file: File): Promise<void> {
	try {
		const db = await openDatabase();
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			transaction.objectStore(STORE_NAME).put({
				id,
				file,
				createdAt: Date.now(),
			} satisfies StoredMediaFile);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
		db.close();
	} catch (error) {
		console.warn('[YYC³ Media] 上传文件持久化失败', error);
	}
}

export async function loadMediaFiles(): Promise<StoredMediaFile[]> {
	try {
		const db = await openDatabase();
		const files = await new Promise<StoredMediaFile[]>((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readonly');
			const request = transaction.objectStore(STORE_NAME).getAll();
			request.onsuccess = () =>
				resolve((request.result as StoredMediaFile[]) ?? []);
			request.onerror = () => reject(request.error);
		});
		db.close();
		return files.sort((a, b) => a.createdAt - b.createdAt);
	} catch {
		return [];
	}
}

export async function removeMediaFile(id: string): Promise<void> {
	try {
		const db = await openDatabase();
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			transaction.objectStore(STORE_NAME).delete(id);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
		db.close();
	} catch (error) {
		console.warn('[YYC³ Media] 删除文件失败', error);
	}
}
