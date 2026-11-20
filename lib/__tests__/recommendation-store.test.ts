/**
 * @file 个性化推荐引擎单元测试
 * @description 验证曝光/互动采集、亲和度评分与排序逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  affinityScore,
  recommendOrder,
  getRecommendationSnapshot,
  recordExposure,
  recordInteraction,
  setRecommendationEnabled,
  clearRecommendationData,
  subscribeRecommendation,
  useRecommendation,
} from "../recommendation-store";

describe("recommendation-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearRecommendationData();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  test("affinityScore 无数据时为 0", () => {
    expect(affinityScore(undefined)).toBe(0);
  });

  test("affinityScore 随曝光和互动增长", () => {
    const base = affinityScore({ exposureMs: 1000, interactions: 0, lastSeenAt: 0 });
    const more = affinityScore({ exposureMs: 10000, interactions: 5, lastSeenAt: 0 });
    expect(more).toBeGreaterThan(base);
  });

  test("recommendOrder 应将高亲和度作品提前", () => {
    const images = [
      { src: "a.jpg" },
      { src: "b.jpg" },
      { src: "c.jpg" },
    ];
    const affinity = {
      "c.jpg": { exposureMs: 50000, interactions: 10, lastSeenAt: 0 },
    };
    const ordered = recommendOrder(images, affinity, true);
    expect(ordered[0].src).toBe("c.jpg");
  });

  test("recommendOrder 关闭时保持原顺序", () => {
    const images = [{ src: "a" }, { src: "b" }, { src: "c" }];
    const affinity = { c: { exposureMs: 99999, interactions: 99, lastSeenAt: 0 } };
    expect(recommendOrder(images, affinity, false)).toEqual(images);
  });

  test("recordExposure 与 recordInteraction 应累计", () => {
    recordExposure("x", 1500);
    recordInteraction("x");
    const snap = getRecommendationSnapshot();
    expect(snap.affinity["x"].exposureMs).toBe(1500);
    expect(snap.affinity["x"].interactions).toBe(1);
  });

  test("禁用后不再记录行为", () => {
    setRecommendationEnabled(false);
    recordExposure("y", 1000);
    expect(getRecommendationSnapshot().affinity["y"]).toBeUndefined();
  });

  test("行为变更应持久化到 localStorage", () => {
    recordExposure("persist-key", 2000);
    jest.runAllTimers();
    const stored = JSON.parse(
      window.localStorage.getItem("yyc3-recommendation-v1") ?? "{}",
    );
    expect(stored.affinity["persist-key"].exposureMs).toBe(2000);
  });

  test("subscribeRecommendation 可取消订阅", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeRecommendation(listener);
    recordInteraction("sub-key");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    recordInteraction("sub-key2");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("useRecommendation 应为可用 hook", () => {
    expect(typeof useRecommendation).toBe("function");
  });
});
