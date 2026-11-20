/**
 * @file AI 内容标注单元测试
 * @description 验证本地启发式标注、缓存与远程降级逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  annotate,
  clearAnnotations,
  getAnnotation,
  localHeuristicProvider,
  createRemoteProvider,
} from "../annotation-store";

describe("annotation-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAnnotations();
  });

  test("本地启发式应从文件名推断标签", async () => {
    const result = await localHeuristicProvider.annotate(
      "artist-cover-01.jpg",
      "/images/artist-cover-01.jpg",
    );
    expect(result.source).toBe("local");
    expect(result.tags).toContain("艺术");
    expect(result.tags).toContain("封面");
  });

  test("annotate 应缓存结果，重复调用不再生成", async () => {
    const spy = jest.spyOn(localHeuristicProvider, "annotate");
    await annotate("x.jpg", "/music-x.jpg", localHeuristicProvider);
    await annotate("x.jpg", "/music-x.jpg", localHeuristicProvider);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test("命中缓存应直接返回", async () => {
    const first = await annotate("y.jpg", "/album-y.jpg", localHeuristicProvider);
    const second = getAnnotation("y.jpg");
    expect(second).toEqual(first);
  });

  test("远程服务失败时应回退本地标注", async () => {
    const globalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    const provider = createRemoteProvider("/api/annotate");
    const result = await provider.annotate("z.jpg", "/song-z.jpg");
    expect(result.source).toBe("local");
    expect(result.tags.length).toBeGreaterThan(0);
    global.fetch = globalFetch;
  });

  test("远程服务成功时应返回远程标注", async () => {
    const globalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tags: ["肖像", "光影"],
        description: "AI 描述",
      }),
    });
    const provider = createRemoteProvider("/api/annotate");
    const result = await provider.annotate("remote.jpg", "/remote.jpg");
    expect(result.source).toBe("remote");
    expect(result.tags).toEqual(["肖像", "光影"]);
    expect(result.description).toBe("AI 描述");
    global.fetch = globalFetch;
  });

  test("远程响应非法时应回退本地标注", async () => {
    const globalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: true }),
    });
    const provider = createRemoteProvider("/api/annotate");
    const result = await provider.annotate("bad.jpg", "/bad.jpg");
    expect(result.source).toBe("local");
    global.fetch = globalFetch;
  });

  test("模块加载时应从 localStorage 恢复缓存", async () => {
    const cached = {
      "cached-id": {
        id: "cached-id",
        tags: ["恢复标签"],
        description: "从存储恢复",
        source: "remote",
        createdAt: 12345,
      },
    };
    window.localStorage.setItem(
      "yyc3-annotations-v1",
      JSON.stringify(cached),
    );
    jest.resetModules();
    const restored = await import("../annotation-store");
    expect(restored.getAnnotation("cached-id")?.tags).toEqual(["恢复标签"]);
    expect(restored.getAnnotation("cached-id")?.createdAt).toBe(12345);
  });

  test("损坏的缓存数据应被安全忽略", async () => {
    window.localStorage.setItem("yyc3-annotations-v1", "not-json");
    jest.resetModules();
    const restored = await import("../annotation-store");
    expect(restored.getAnnotation("anything")).toBeUndefined();
  });
});
