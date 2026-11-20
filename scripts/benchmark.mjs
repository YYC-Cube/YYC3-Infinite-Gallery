/**
 * @file 性能基准脚本
 * @description 对核心计算函数执行可复现的 micro-benchmark，输出中位数与 P95，建立性能基线
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
import { performance } from "node:perf_hooks";
import { arch, cpus, platform, release, totalmem } from "node:os";

const RUNS = 3;
const ITERATIONS = 20_000;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

/** 对 fn 执行一轮 ITERATIONS 次，返回总耗时（ms） */
function runOnce(fn) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i += 1) fn(i);
  return performance.now() - start;
}

/** 基准一个函数，跑 RUNS 轮取中位数 */
function bench(name, fn) {
  const samples = [];
  for (let r = 0; r < RUNS; r += 1) samples.push(runOnce(fn));
  const perOp = (ms) => (ms / ITERATIONS) * 1000; // 微秒/次
  return {
    name,
    medianUs: +perOp(median(samples)).toFixed(3),
    p95Us: +perOp(percentile(samples, 0.95)).toFixed(3),
    samplesMs: samples.map((s) => +s.toFixed(2)),
  };
}

// ---- 被测函数（与 lib 实现保持一致，避免引入 TS 运行时依赖） ----

function affinityScore(affinity) {
  if (!affinity) return 0;
  const exposure = Math.log10(1 + affinity.exposureMs / 1000) * 2;
  const interaction = Math.log10(1 + affinity.interactions) * 3;
  return exposure + interaction;
}

function recommendOrder(images, affinity) {
  const scored = images.map((image, index) => ({
    image,
    index,
    score: affinityScore(affinity[image.src]),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((item) => item.image);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// ---- 数据集 ----
const images = Array.from({ length: 12 }, (_, i) => ({ src: `/img/${i}.jpg` }));
const affinity = {
  "/img/3.jpg": { exposureMs: 50000, interactions: 12, lastSeenAt: 0 },
  "/img/7.jpg": { exposureMs: 20000, interactions: 5, lastSeenAt: 0 },
};
const tracks = Array.from({ length: 30 }, (_, i) => ({ id: `t${i}`, title: `曲 ${i}` }));

// ---- 执行基准 ----
console.log("=== YYC³ Infinite Gallery 性能基线 ===");
console.log(
  `环境: ${platform()} ${release()} · ${arch()} · ${cpus().length} vCPU · ${(totalmem() / 1024 ** 3).toFixed(1)} GB RAM`,
);
console.log(`Node: ${process.version} · 每基准 ${RUNS} 轮 × ${ITERATIONS.toLocaleString()} 次\n`);

const results = [
  bench("affinityScore（亲和度评分）", (i) =>
    affinityScore(affinity[`/img/${i % 12}.jpg`]),
  ),
  bench("recommendOrder（12 图排序）", () => recommendOrder(images, affinity)),
  bench("clamp（窗口边界计算）", (i) => clamp(i % 1000, 8, 900)),
  bench("queue.find（30 曲目查找）", (i) =>
    tracks.find((t) => t.id === `t${i % 30}`),
  ),
];

console.table(
  results.map((r) => ({
    基准: r.name,
    "中位数(μs/次)": r.medianUs,
    "P95(μs/次)": r.p95Us,
    "样本(ms)": r.samplesMs.join(" / "),
  })),
);

console.log("\n基线已输出。后续优化须以此数据对比，无实测不得声称提升。");
