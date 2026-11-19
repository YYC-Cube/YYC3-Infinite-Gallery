/**
 * @file 性能监控埋点单元测试
 * @description 验证指标记录、评级、格式化与报告生成逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  recordMetric,
  getMetrics,
  getRating,
  formatValue,
  getPerformanceReport,
  resetMetrics,
  METRIC_THRESHOLDS,
  PERFORMANCE_EVENT,
  type MetricName,
} from "../performance-monitor";

describe("performance-monitor", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetMetrics();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("阈值定义应覆盖 5 个核心指标", () => {
    const names: MetricName[] = ["lcp", "cls", "inp", "fcp", "ttfb"];
    names.forEach((name) => expect(METRIC_THRESHOLDS[name]).toBeDefined());
  });

  test("recordMetric 应记录并持久化指标", () => {
    recordMetric("lcp", 2000);
    expect(getMetrics().lcp).toBe(2000);
    const stored = JSON.parse(
      window.localStorage.getItem("yyc3-gallery-performance-v1") ?? "{}",
    );
    expect(stored.lcp).toBe(2000);
  });

  test("recordMetric 应派发自定义事件", () => {
    const listener = jest.fn();
    window.addEventListener(PERFORMANCE_EVENT, listener);
    recordMetric("cls", 0.05);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(PERFORMANCE_EVENT, listener);
  });

  test("recordMetric 对更差值才覆盖，优异值不覆盖", () => {
    recordMetric("lcp", 3000);
    recordMetric("lcp", 1200); // 更优，不应覆盖
    expect(getMetrics().lcp).toBe(3000);
    recordMetric("lcp", 4500); // 更差，应覆盖
    expect(getMetrics().lcp).toBe(4500);
  });

  test("getRating 应按阈值正确分级", () => {
    expect(getRating("lcp", 2000).label).toBe("good");
    expect(getRating("lcp", 3000).label).toBe("needs-improvement");
    expect(getRating("lcp", 5000).label).toBe("poor");
    expect(getRating("lcp", undefined).label).toBe("unknown");
  });

  test("CLS 评级应使用 score 阈值", () => {
    expect(getRating("cls", 0.05).label).toBe("good");
    expect(getRating("cls", 0.15).label).toBe("needs-improvement");
    expect(getRating("cls", 0.3).label).toBe("poor");
  });

  test("formatValue 应区分 ms 与 score", () => {
    expect(formatValue("lcp", 2100)).toBe("2100ms");
    expect(formatValue("cls", 0.12345)).toBe("0.123");
    expect(formatValue("fcp", undefined)).toBe("N/A");
  });

  test("getPerformanceReport 应返回全部 5 个指标", () => {
    recordMetric("lcp", 1800);
    recordMetric("inp", 150);
    const report = getPerformanceReport();
    expect(report.lcp.display).toBe("1800ms");
    expect(report.lcp.label).toBe("good");
    expect(report.inp.label).toBe("good");
    expect(report.cls.label).toBe("unknown");
    expect(report.ttfb.label).toBe("unknown");
  });
});
