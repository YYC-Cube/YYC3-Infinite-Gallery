/**
 * @file 背景资源仓库单元测试
 * @description 验证 IndexedDB 主路径、localStorage 降级与异常兜底
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- IndexedDB mock 需模拟动态回调对象结构 */

// ---- 轻量 IndexedDB mock（覆盖 asset-store 使用的最小接口）----
let mockStore: Record<string, { id: string; file: Blob; createdAt: number }> = {};
let mockDBEnabled = true;
let mockStoreExists = true;
let mockCreateIndex = jest.fn();

const mockIndexedDB = {
  open: jest.fn(() => {
    const request: any = {
      result: {
        objectStoreNames: { contains: () => mockStoreExists },
        createObjectStore: jest.fn(() => ({ createIndex: mockCreateIndex })),
        transaction: (_name: string, _mode: string) => {
          const tx: any = {
            objectStore: () => ({
              put: (value: any) => {
                queueMicrotask(() => {
                  mockStore[value.id] = value;
                  tx.oncomplete?.();
                });
                return {};
              },
              get: (id: string) => {
                const req: any = {};
                queueMicrotask(() => {
                  req.result = mockStore[id];
                  req.onsuccess?.();
                });
                return req;
              },
              delete: (id: string) => {
                queueMicrotask(() => {
                  delete mockStore[id];
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
      if (mockDBEnabled) {
        if (!mockStoreExists) {
          request.onupgradeneeded?.();
          mockStoreExists = true;
        }
        request.onsuccess?.();
      } else {
        request.error = new Error("db unavailable");
        request.onerror?.(request.error);
      }
    });
    return request;
  }),
};

Object.defineProperty(global, "indexedDB", {
  value: mockIndexedDB,
  configurable: true,
});
// FileReader 使用 jsdom 原生实现（支持 File → dataURL）

import {
  storeBackgroundAsset,
  loadBackgroundAsset,
  removeBackgroundAsset,
} from "../asset-store";

describe("asset-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockStore = {};
    mockDBEnabled = true;
    mockStoreExists = true;
    mockCreateIndex = jest.fn();
    mockIndexedDB.open.mockClear();
  });

  test("storeBackgroundAsset 应通过 IndexedDB 保存并返回 id", async () => {
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    expect(id).toMatch(/^bg-/);
    expect(mockStore[id!]).toBeDefined();
    expect(mockStore[id!].file).toBe(file);
  });

  test("loadBackgroundAsset 应从 IndexedDB 读取", async () => {
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    const result = await loadBackgroundAsset(id!);
    expect(result).toBe(file);
  });

  test("removeBackgroundAsset 应删除 IndexedDB 记录", async () => {
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    await removeBackgroundAsset(id!);
    expect(mockStore[id!]).toBeUndefined();
  });

  test("IndexedDB 不可用时 storeBackgroundAsset 应降级到 localStorage", async () => {
    mockDBEnabled = false;
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    expect(id).toMatch(/^bg-/);
    expect(window.localStorage.getItem(`yyc3-bg-asset:${id}`)).toMatch(
      /^data:image\/png;base64,/,
    );
  });

  test("IndexedDB 无记录时应读取 localStorage 降级数据", async () => {
    window.localStorage.setItem("yyc3-bg-asset:test-id", "data:image/png;base64,mock");
    const mockFetch = jest.fn().mockResolvedValue({
      blob: async () => new Blob(["img"]),
    });
    global.fetch = mockFetch as any;
    const result = await loadBackgroundAsset("test-id");
    expect(result).toBeInstanceOf(Blob);
    expect(mockFetch).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("无记录且无降级数据时应返回 null", async () => {
    const result = await loadBackgroundAsset("nonexistent");
    expect(result).toBeNull();
  });

  test("removeBackgroundAsset 应清理 localStorage 降级数据", async () => {
    window.localStorage.setItem("yyc3-bg-asset:test-id", "data:x");
    await removeBackgroundAsset("test-id");
    expect(window.localStorage.getItem("yyc3-bg-asset:test-id")).toBeNull();
  });

  test("localStorage 写入异常时降级应静默失败但不返回 null（仍返回 id）", async () => {
    mockDBEnabled = false;
    const originalSetItem = Storage.prototype.setItem;
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    expect(id).toMatch(/^bg-/);
    jest.restoreAllMocks();
    Storage.prototype.setItem = originalSetItem;
  });

  test("首次使用应触发 onupgradeneeded 创建 store 与索引", async () => {
    mockStoreExists = false;
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    expect(id).toMatch(/^bg-/);
    expect(mockCreateIndex).toHaveBeenCalledWith(
      "createdAt",
      "createdAt",
      { unique: false },
    );
  });

  test("IndexedDB 全局缺失时应降级到 localStorage", async () => {
    const originalIDB = global.indexedDB;
    // @ts-expect-error 模拟完全无 IndexedDB 环境
    delete global.indexedDB;
    const file = new File(["img"], "bg.png", { type: "image/png" });
    const id = await storeBackgroundAsset(file);
    expect(id).toMatch(/^bg-/);
    expect(window.localStorage.getItem(`yyc3-bg-asset:${id}`)).toBeTruthy();
    Object.defineProperty(global, "indexedDB", {
      value: originalIDB,
      configurable: true,
    });
  });

  test("降级数据 blob 解析失败时应返回 null", async () => {
    window.localStorage.setItem("yyc3-bg-asset:broken", "data:x");
    global.fetch = jest.fn().mockRejectedValue(new Error("decode failed")) as any;
    expect(await loadBackgroundAsset("broken")).toBeNull();
  });
});
