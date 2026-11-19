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
});
