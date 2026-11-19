/**
 * @file 性能监控组件
 * @description 注册 web-vitals 采集 LCP/CLS/INP/FCP/TTFB，接入性能监控埋点系统
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { recordMetric, type MetricName } from "@/lib/performance-monitor";

export default function PerformanceMonitor() {
  useEffect(() => {
    const handle = (name: MetricName) => (metric: { value: number }) => {
      recordMetric(name, metric.value);
    };

    onLCP(handle("lcp"));
    onCLS(handle("cls"));
    onINP(handle("inp"));
    onFCP(handle("fcp"));
    onTTFB(handle("ttfb"));
  }, []);

  return null;
}
