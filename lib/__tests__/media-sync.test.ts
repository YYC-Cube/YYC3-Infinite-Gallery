/**
 * @file 本地媒体清单同步单元测试
 * @description 验证媒体元数据清单生成与同步调用
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

const mockHostStorageSet = jest.fn().mockResolvedValue(undefined);
const mockLoadMediaFiles = jest.fn();

jest.mock("@/lib/host-bridge", () => ({
  hostStorageSet: (...args: unknown[]) => mockHostStorageSet(...args),
}));

jest.mock("@/lib/media-db", () => ({
  loadMediaFiles: () => mockLoadMediaFiles(),
}));

import { syncMediaManifest, MEDIA_MANIFEST_KEY } from "../media-sync";

describe("media-sync", () => {
  beforeEach(() => {
    mockHostStorageSet.mockClear();
    mockLoadMediaFiles.mockReset();
  });

  test("应生成包含全部媒体元数据的清单", async () => {
    mockLoadMediaFiles.mockResolvedValue([
      {
        id: "m1",
        file: new File(["a"], "song.mp3", { type: "audio/mpeg" }),
        createdAt: 1000,
      },
      {
        id: "m2",
        file: new File(["b"], "clip.mp4", { type: "video/mp4" }),
        createdAt: 2000,
      },
    ]);

    const manifest = await syncMediaManifest();
    expect(manifest.version).toBe(1);
    expect(manifest.items).toHaveLength(2);
    expect(manifest.items[0]).toMatchObject({
      id: "m1",
      name: "song.mp3",
      type: "audio/mpeg",
      createdAt: 1000,
    });
  });

  test("清单不应包含文件二进制（file）字段", async () => {
    mockLoadMediaFiles.mockResolvedValue([
      {
        id: "m1",
        file: new File(["a"], "song.mp3", { type: "audio/mpeg" }),
        createdAt: 1000,
      },
    ]);
    const manifest = await syncMediaManifest();
    expect(manifest.items[0]).not.toHaveProperty("file");
    expect(manifest.items[0]).toHaveProperty("size");
  });

  test("应通过 hostStorageSet 同步到清单 key", async () => {
    mockLoadMediaFiles.mockResolvedValue([]);
    await syncMediaManifest();
    expect(mockHostStorageSet).toHaveBeenCalledTimes(1);
    expect(mockHostStorageSet.mock.calls[0][0]).toBe(MEDIA_MANIFEST_KEY);
  });
});
