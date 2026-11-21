/**
 * @file 本地媒体文件持久化单元测试
 * @description 覆盖 IndexedDB 写入、读取、删除与不可用降级
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-21
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- 需模拟 IndexedDB 动态回调结构 */

type StoredRow = { id: string; file: File; createdAt: number };

let rows: Record<string, StoredRow> = {};
let openShouldFail = false;
let storeExists = true;

const fakeIndexedDB = {
  open: jest.fn(() => {
    const request: any = {
      result: {
        objectStoreNames: { contains: () => storeExists },
        createObjectStore: jest.fn(),
        transaction: (_name: string) => {
          const tx: any = {
            objectStore: () => ({
              put: (value: StoredRow) => {
                queueMicrotask(() => {
                  rows[value.id] = value;
                  tx.oncomplete?.();
                });
                return {};
              },
              getAll: () => {
                const req: any = {};
                queueMicrotask(() => {
                  req.result = Object.values(rows);
                  req.onsuccess?.();
                });
                return req;
              },
              delete: (id: string) => {
                queueMicrotask(() => {
                  delete rows[id];
                  tx.oncomplete?.();
                });
                return {};
              },
            }),
          };
          return tx;
        },
        close: jest.fn(),
      },
      onupgradeneeded: null as any,
      onsuccess: null as any,
      onerror: null as any,
    };
    queueMicrotask(() => {
      if (openShouldFail) {
        request.error = new Error("db unavailable");
        request.onerror?.();
        return;
      }
      if (!storeExists) {
        storeExists = true;
        request.onupgradeneeded?.();
      }
      request.onsuccess?.();
    });
    return request;
  }),
};

Object.defineProperty(global, "indexedDB", {
  value: fakeIndexedDB,
  configurable: true,
});

import {
  loadMediaFiles,
  removeMediaFile,
  storeMediaFile,
} from "../media-db";

describe("media-db", () => {
  beforeEach(() => {
    rows = {};
    openShouldFail = false;
    storeExists = true;
    fakeIndexedDB.open.mockClear();
  });

  test("应写入并按创建时间读取媒体文件", async () => {
    const first = new File(["a"], "a.mp3", { type: "audio/mpeg" });
    const second = new File(["b"], "b.mp4", { type: "video/mp4" });
    expect(await storeMediaFile("old", first)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await storeMediaFile("new", second)).toBe(true);

    const files = await loadMediaFiles();
    expect(files).toHaveLength(2);
    expect(files[0]?.id).toBe("old");
    expect(files[1]?.id).toBe("new");
    expect(files[1]?.file.name).toBe("b.mp4");
  });

  test("应删除指定媒体文件", async () => {
    await storeMediaFile("target", new File(["x"], "x.mp3"));
    await removeMediaFile("target");
    expect(await loadMediaFiles()).toHaveLength(0);
  });

  test("数据库打开失败时写入应静默降级", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    openShouldFail = true;
    try {
      await expect(
        storeMediaFile("fail", new File(["x"], "x.mp3")),
      ).resolves.toBe(false);
      expect(await loadMediaFiles()).toEqual([]);
      await expect(removeMediaFile("fail")).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("IndexedDB 不存在时应返回空列表", async () => {
    const original = global.indexedDB;
    // @ts-expect-error 模拟无 IndexedDB 环境
    delete global.indexedDB;
    try {
      await expect(
        storeMediaFile("none", new File(["x"], "x.mp3")),
      ).resolves.toBe(false);
      expect(await loadMediaFiles()).toEqual([]);
    } finally {
      Object.defineProperty(global, "indexedDB", {
        value: original,
        configurable: true,
      });
    }
  });
});
