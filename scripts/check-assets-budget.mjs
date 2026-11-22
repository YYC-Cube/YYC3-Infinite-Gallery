/**
 * @file 静态资产预算门禁
 * @description 校验 public/ 资产总量、分类配额、单文件上限与文件名安全性，防止仓库与 Pages 产物失控增长
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */
import { lstatSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PUBLIC_DIR = join(ROOT, "public");
const MB = 1024 * 1024;

/** 预算阈值（MB）：按 2026-11-22 实测基线上浮约 10%，只防增长不压制既有资产 */
export const BUDGETS = {
  total: 120,
  audio: 75,
  video: 28,
  image: 16,
  singleFile: 8,
};

/** 制品与跨文件系统不安全的文件名字符 */
const UNSAFE_NAME = /[:<>|"*?]/;

const CATEGORY_RULES = [
  { name: "audio", pattern: /\.(mp3|flac|wav|ogg|m4a|aac)$/i },
  { name: "video", pattern: /\.(mp4|webm|mov|mkv)$/i },
  { name: "image", pattern: /\.(jpe?g|png|webp|avif|svg|ico)$/i },
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const stats = lstatSync(full);
    if (stats.isSymbolicLink()) continue;
    if (stats.isDirectory()) files.push(...walk(full));
    else files.push({ path: full, size: stats.size });
  }
  return files;
}

if (process.argv[1] && process.argv[1].endsWith("check-assets-budget.mjs")) {
  const files = walk(PUBLIC_DIR);
  const totals = { total: 0, audio: 0, video: 0, image: 0, other: 0 };
  const errors = [];
  let largest = { path: "", size: 0 };

  for (const file of files) {
    const rel = relative(ROOT, file.path);
    totals.total += file.size;
    const rule = CATEGORY_RULES.find((item) => item.pattern.test(file.path));
    if (rule) totals[rule.name] += file.size;
    else totals.other += file.size;

    if (file.size > largest.size) largest = { path: rel, size: file.size };
    if (file.size > BUDGETS.singleFile * MB) {
      errors.push(
        `${rel}: 单文件 ${(file.size / MB).toFixed(2)}MB 超过 ${BUDGETS.singleFile}MB 上限`,
      );
    }
    if (UNSAFE_NAME.test(file.path)) {
      errors.push(`${rel}: 文件名含非法字符（冒号/尖括号等不兼容制品上传）`);
    }
  }

  const checks = [
    ["total", "资产总量"],
    ["audio", "音频总量"],
    ["video", "视频总量"],
    ["image", "图片总量"],
  ];

  console.log("静态资产预算检查：");
  for (const [key, label] of checks) {
    const value = totals[key] / MB;
    const budget = BUDGETS[key];
    const ratio = (value / budget) * 100;
    console.log(
      `  ${label}: ${value.toFixed(1)}MB / ${budget}MB (${ratio.toFixed(0)}%)`,
    );
    if (value > budget) {
      errors.push(`${label} ${value.toFixed(1)}MB 超出预算 ${budget}MB`);
    }
  }
  console.log(
    `  文件数: ${files.length}；最大单文件: ${largest.path} (${(largest.size / MB).toFixed(2)}MB)`,
  );

  if (errors.length > 0) {
    console.error(`\n资产预算校验失败（${errors.length} 项）：`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
  } else {
    console.log("资产预算校验通过");
  }
}
