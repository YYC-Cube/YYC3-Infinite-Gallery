/**
 * @file 宿主桥接层单元测试
 * @description 验证能力协商、网络代理、存储同步与离线 outbox 逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

// jsdom 未提供 AbortSignal.timeout，为能力探测补充最小 polyfill
type AbortSignalWithTimeout = typeof AbortSignal & {
  timeout?: (ms: number) => AbortSignal;
};
if (typeof AbortSignal !== "undefined" && !AbortSignal.timeout) {
  (AbortSignal as AbortSignalWithTimeout).timeout = () =>
    new AbortController().signal;
}

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import {
  probeHost,
  hostFetch,
  hostStorageSet,
  hostStorageGet,
  flushOutbox,
  configureHostEndpoint,
  hostIsAvailable,
  getHostSnapshot,
  subscribeHost,
  useHostState,
} from "../host-bridge";

describe("host-bridge", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    window.localStorage.clear();
    jest.useFakeTimers();
    // 重置为直连模式（无端点）
    configureHostEndpoint("");
  });

  afterEach(() => jest.useRealTimers());

  test("无端点时 probeHost 应进入 direct 模式", async () => {
    configureHostEndpoint("");
    const state = await probeHost();
    expect(state.connection).toBe("direct");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("端点可用时 probeHost 应协商能力", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: "3.0", capabilities: ["storage", "network"] }),
    });
    configureHostEndpoint("https://host.example", false);
    const probed = await probeHost();
    expect(probed.connection).toBe("online");
    expect(probed.version).toBe("3.0");
    expect(probed.capabilities).toEqual(["storage", "network"]);
  });

  test("能力探测 404 应标记 incompatible", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    configureHostEndpoint("https://host.example", false);
    const state = await probeHost();
    expect(state.connection).toBe("incompatible");
  });

  test("能力探测异常应标记 offline", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    configureHostEndpoint("https://host.example", false);
    const state = await probeHost();
    expect(state.connection).toBe("offline");
  });

  test("直连模式 hostFetch 应直接透传 fetch", async () => {
    configureHostEndpoint("");
    const response = { ok: true, status: 200 };
    mockFetch.mockResolvedValue(response);
    const result = await hostFetch("/api/data");
    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/data", undefined);
  });

  test("在线模式 hostFetch 应走宿主代理", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ version: "1", capabilities: [] }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    configureHostEndpoint("https://host.example", false);
    await probeHost();
    await hostFetch("/api/data", { method: "POST", body: "payload" });
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://host.example/v1/network/fetch",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("无端点时 hostStorageSet 应跳过同步", async () => {
    configureHostEndpoint("");
    await hostStorageSet("key", { a: 1 });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("yyc3-host-outbox-v1")).toBeNull();
  });

  test("离线时 hostStorageSet 应写入 outbox", async () => {
    configureHostEndpoint("https://host.example", false);
    // 未 probeHost，connection 为 checking，应入队
    await hostStorageSet("key", { a: 1 });
    const outbox = JSON.parse(
      window.localStorage.getItem("yyc3-host-outbox-v1") ?? "[]",
    );
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ key: "key", value: { a: 1 } });
  });

  test("hostStorageGet 应读取本地存储", async () => {
    window.localStorage.setItem("test-key", JSON.stringify({ b: 2 }));
    const result = await hostStorageGet("test-key");
    expect(result).toEqual({ b: 2 });
  });

  test("flushOutbox 离线时不应清空队列", async () => {
    configureHostEndpoint("https://host.example", false);
    await hostStorageSet("key", { a: 1 });
    await flushOutbox();
    const outbox = JSON.parse(
      window.localStorage.getItem("yyc3-host-outbox-v1") ?? "[]",
    );
    expect(outbox).toHaveLength(1);
  });

  test("hostIsAvailable 无端点时为 true，离线时为 false", async () => {
    configureHostEndpoint("");
    expect(hostIsAvailable()).toBe(true);
    mockFetch.mockRejectedValue(new Error("down"));
    configureHostEndpoint("https://host.example", false);
    await probeHost();
    expect(hostIsAvailable()).toBe(false);
  });

  test("subscribeHost 应在状态变更时通知", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeHost(listener);
    configureHostEndpoint("");
    await probeHost();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  test("getHostSnapshot 与 useHostState 应读到一致快照", () => {
    expect(getHostSnapshot()).toBeDefined();
    expect(typeof useHostState).toBe("function");
  });
});
