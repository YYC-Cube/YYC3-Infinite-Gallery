/**
 * @file 本地媒体清单同步
 * @description 将 IndexedDB 中本地媒体的元数据清单经宿主桥接同步；离线时自动进入 outbox，恢复在线后由 flushOutbox 上报
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import { hostStorageSet } from "@/lib/host-bridge";
import { loadMediaFiles } from "@/lib/media-db";

export const MEDIA_MANIFEST_KEY = "yyc3-local-media-manifest";

export interface MediaManifestItem {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface MediaManifest {
  version: 1;
  items: MediaManifestItem[];
  updatedAt: number;
}

/**
 * 同步本地媒体元数据清单。
 * 仅上传元数据（不含文件二进制），大文件始终留在本地 IndexedDB。
 * 宿主离线时 hostStorageSet 自动写入 outbox，网络恢复后由 flushOutbox 补传。
 */
export async function syncMediaManifest(): Promise<MediaManifest> {
  const stored = await loadMediaFiles();
  const manifest: MediaManifest = {
    version: 1,
    items: stored.map((item) => ({
      id: item.id,
      name: item.file.name,
      type: item.file.type,
      size: item.file.size,
      createdAt: item.createdAt,
    })),
    updatedAt: Date.now(),
  };
  await hostStorageSet(MEDIA_MANIFEST_KEY, manifest);
  return manifest;
}
