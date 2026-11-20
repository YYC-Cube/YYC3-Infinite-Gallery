/**
 * @file 状态恢复路径单元测试
 * @description 覆盖各 store 在模块加载期从 localStorage 恢复的分支（有效/损坏/部分字段）
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

describe("store 模块加载恢复", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  describe("widget-store", () => {
    test("应从 localStorage 恢复组件启用状态与位置", async () => {
      window.localStorage.setItem(
        "yyc3-widget-space-v1",
        JSON.stringify({
          version: 1,
          items: {
            "widget-clock": {
              id: "widget-clock",
              kind: "clock",
              enabled: true,
              minimized: true,
              shape: "circle",
              x: 99,
              y: 88,
              w: 300,
              h: 200,
              z: 50,
              notes: "恢复的笔记",
            },
          },
          order: ["widget-clock"],
        }),
      );
      const mod = await import("../widget-store");
      const clock = mod.getWidgetsSnapshot().items["widget-clock"];
      expect(clock.enabled).toBe(true);
      expect(clock.minimized).toBe(true);
      expect(clock.shape).toBe("circle");
      expect(clock.x).toBe(99);
      expect(clock.notes).toBe("恢复的笔记");
    });

    test("非法 shape 与越界尺寸应回退安全值", async () => {
      window.localStorage.setItem(
        "yyc3-widget-space-v1",
        JSON.stringify({
          version: 1,
          items: {
            "widget-notes": {
              id: "widget-notes",
              kind: "notes",
              enabled: true,
              shape: "invalid-shape",
              w: 10,
              h: 10,
              notes: "x".repeat(3000),
            },
          },
        }),
      );
      const mod = await import("../widget-store");
      const notes = mod.getWidgetsSnapshot().items["widget-notes"];
      expect(notes.shape).toBe("capsule");
      expect(notes.w).toBeGreaterThanOrEqual(160);
      expect(notes.h).toBeGreaterThanOrEqual(92);
      expect(notes.notes.length).toBeLessThanOrEqual(2000);
    });

    test("损坏 JSON 应回退默认状态", async () => {
      window.localStorage.setItem("yyc3-widgets-v1", "{bad json");
      const mod = await import("../widget-store");
      const items = Object.values(mod.getWidgetsSnapshot().items);
      expect(items).toHaveLength(4);
      expect(items.every((w) => !w.enabled)).toBe(true);
    });

    test("items 字段缺失应回退默认状态", async () => {
      window.localStorage.setItem(
        "yyc3-widget-space-v1",
        JSON.stringify({ version: 1 }),
      );
      const mod = await import("../widget-store");
      expect(Object.keys(mod.getWidgetsSnapshot().items)).toHaveLength(4);
    });
  });

  describe("recommendation-store", () => {
    test("应恢复偏好数据与禁用状态", async () => {
      window.localStorage.setItem(
        "yyc3-recommendation-v1",
        JSON.stringify({
          version: 1,
          enabled: false,
          affinity: {
            "a.jpg": {
              exposureMs: 5000,
              interactions: 3,
              lastSeenAt: 123,
            },
          },
          updatedAt: 999,
        }),
      );
      const mod = await import("../recommendation-store");
      const snap = mod.getRecommendationSnapshot();
      expect(snap.enabled).toBe(false);
      expect(snap.affinity["a.jpg"].exposureMs).toBe(5000);
      expect(snap.updatedAt).toBe(999);
    });

    test("非法 affinity 值应归零", async () => {
      window.localStorage.setItem(
        "yyc3-recommendation-v1",
        JSON.stringify({
          affinity: {
            bad: { exposureMs: "oops", interactions: null, lastSeenAt: "x" },
            nullItem: null,
          },
        }),
      );
      const mod = await import("../recommendation-store");
      const snap = mod.getRecommendationSnapshot();
      expect(snap.affinity["bad"].exposureMs).toBe(0);
      expect(snap.affinity["bad"].interactions).toBe(0);
      expect(snap.affinity["nullItem"]).toBeUndefined();
    });

    test("损坏 JSON 应回退默认", async () => {
      window.localStorage.setItem("yyc3-recommendation-v1", "not-json");
      const mod = await import("../recommendation-store");
      expect(mod.getRecommendationSnapshot().enabled).toBe(true);
      expect(mod.getRecommendationSnapshot().affinity).toEqual({});
    });
  });

  describe("favorites-store", () => {
    test("应恢复收藏列表并过滤非字符串项", async () => {
      window.localStorage.setItem(
        "yyc3-favorites-v1",
        JSON.stringify(["t1", "t2", 123, null]),
      );
      const mod = await import("../favorites-store");
      expect(mod.getFavoritesSnapshot()).toEqual(["t1", "t2"]);
      expect(mod.isFavorite("t1")).toBe(true);
    });

    test("损坏 JSON 应回退空列表", async () => {
      window.localStorage.setItem("yyc3-favorites-v1", "bad");
      const mod = await import("../favorites-store");
      expect(mod.getFavoritesSnapshot()).toEqual([]);
    });
  });

  describe("performance-monitor", () => {
    test("应恢复历史性能数据", async () => {
      window.localStorage.setItem(
        "yyc3-gallery-performance-v1",
        JSON.stringify({ lcp: 1800, cls: 0.05, collectedAt: 777 }),
      );
      const mod = await import("../performance-monitor");
      expect(mod.getMetrics().lcp).toBe(1800);
      expect(mod.getMetrics().cls).toBe(0.05);
      expect(mod.getMetrics().collectedAt).toBe(777);
    });

    test("非法指标值应忽略", async () => {
      window.localStorage.setItem(
        "yyc3-gallery-performance-v1",
        JSON.stringify({ lcp: "bad", inp: null, collectedAt: "x" }),
      );
      const mod = await import("../performance-monitor");
      expect(mod.getMetrics().lcp).toBeUndefined();
      expect(mod.getMetrics().inp).toBeUndefined();
      expect(typeof mod.getMetrics().collectedAt).toBe("number");
    });

    test("存储异常场景 recordMetric 不应抛出", async () => {
      const mod = await import("../performance-monitor");
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota");
      });
      expect(() => mod.recordMetric("fcp", 1200)).not.toThrow();
      jest.restoreAllMocks();
    });
  });
});
