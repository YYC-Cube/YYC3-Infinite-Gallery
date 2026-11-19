/**
 * @file 性能监控埋点
 * @description 采集 Web Vitals 核心指标（LCP/CLS/INP/FCP/TTFB），本地持久化并支持宿主上报
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

export interface PerformanceMetrics {
  lcp?: number;
  cls?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
  collectedAt: number;
}

export type MetricName = "lcp" | "cls" | "inp" | "fcp" | "ttfb";

export interface PerformanceRating {
  label: "good" | "needs-improvement" | "poor" | "unknown";
  value: number | undefined;
}

const STORAGE_KEY = "yyc3-gallery-performance-v1";
export const PERFORMANCE_EVENT = "yyc3:performance";

export const METRIC_THRESHOLDS: Record<
  MetricName,
  { good: number; poor: number; unit: "ms" | "score" }
> = {
  lcp: { good: 2500, poor: 4000, unit: "ms" },
  cls: { good: 0.1, poor: 0.25, unit: "score" },
  inp: { good: 200, poor: 500, unit: "ms" },
  fcp: { good: 1800, poor: 3000, unit: "ms" },
  ttfb: { good: 800, poor: 1800, unit: "ms" },
};

let metrics: PerformanceMetrics = readMetrics();

function readMetrics(): PerformanceMetrics {
  if (typeof window === "undefined") {
    return { collectedAt: Date.now() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { collectedAt: Date.now() };
    const parsed = JSON.parse(raw) as Partial<PerformanceMetrics>;
    return {
      lcp: typeof parsed.lcp === "number" ? parsed.lcp : undefined,
      cls: typeof parsed.cls === "number" ? parsed.cls : undefined,
      inp: typeof parsed.inp === "number" ? parsed.inp : undefined,
      fcp: typeof parsed.fcp === "number" ? parsed.fcp : undefined,
      ttfb: typeof parsed.ttfb === "number" ? parsed.ttfb : undefined,
      collectedAt:
        typeof parsed.collectedAt === "number"
          ? parsed.collectedAt
          : Date.now(),
    };
  } catch {
    return { collectedAt: Date.now() };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    /* 存储不可用时忽略 */
  }
}

/** 记录单个指标；相同指标以更差值为准（反映真实最差体验） */
export function recordMetric(name: MetricName, value: number): void {
  const current = metrics[name];
  const isWorse = current === undefined || value > current;
  if (isWorse) {
    metrics = { ...metrics, [name]: value, collectedAt: Date.now() };
    persist();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<PerformanceMetrics>(PERFORMANCE_EVENT, {
        detail: metrics,
      }),
    );
  }

  if (process.env.NODE_ENV === "development") {
    const rating = getRating(name, metrics[name]);
    console.info(
      `[YYC³ Perf] ${name.toUpperCase()} = ${formatValue(name, value)} (${rating.label})`,
    );
  }
}

export function getMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/** @internal 重置内存指标（仅供测试隔离使用） */
export function resetMetrics(): void {
  metrics = { collectedAt: Date.now() };
}

export function getRating(name: MetricName, value: number | undefined): PerformanceRating {
  if (value === undefined) return { label: "unknown", value };
  const { good, poor } = METRIC_THRESHOLDS[name];
  if (value <= good) return { label: "good", value };
  if (value <= poor) return { label: "needs-improvement", value };
  return { label: "poor", value };
}

export function formatValue(name: MetricName, value: number | undefined): string {
  if (value === undefined) return "N/A";
  return METRIC_THRESHOLDS[name].unit === "ms"
    ? `${Math.round(value)}ms`
    : value.toFixed(3);
}

/** 生成人类可读的性能报告，供配置面板或调试使用 */
export function getPerformanceReport(): Record<
  MetricName,
  PerformanceRating & { display: string }
> {
  const names: MetricName[] = ["lcp", "cls", "inp", "fcp", "ttfb"];
  const report = {} as Record<
    MetricName,
    PerformanceRating & { display: string }
  >;
  names.forEach((name) => {
    const rating = getRating(name, metrics[name]);
    report[name] = { ...rating, display: formatValue(name, rating.value) };
  });
  return report;
}

export const PERFORMANCE_STORAGE_KEY = STORAGE_KEY;
