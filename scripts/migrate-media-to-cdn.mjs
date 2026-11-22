/**
 * @file 媒体资产外迁清单生成器
 * @description 扫描 public 媒体目录，输出体积、文件清单与可执行的 rclone / AWS CLI 同步命令（不自动上传）
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */
import { lstatSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const MEDIA_DIRS = [
  "public/mp3",
  "public/mv-3x4",
  "public/mv-4x3",
  "public/artist-3x4",
  "public/artist-4x3",
];
const MB = 1024 * 1024;

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

const entries = [];
for (const dir of MEDIA_DIRS) {
  try {
    for (const file of walk(join(ROOT, dir))) {
      entries.push({
        path: relative(join(ROOT, "public"), file.path).split("\\").join("/"),
        size: file.size,
      });
    }
  } catch {
    /* 目录不存在时跳过 */
  }
}

const total = entries.reduce((sum, item) => sum + item.size, 0);
const asJson = process.argv.includes("--json");

if (asJson) {
  console.log(JSON.stringify({ total, count: entries.length, entries }, null, 2));
} else {
  console.log("媒体外迁清单（public → 对象存储）：");
  console.log(`  文件数: ${entries.length}；总量: ${(total / MB).toFixed(1)}MB`);
  for (const item of entries) {
    console.log(`  - ${item.path} (${(item.size / MB).toFixed(2)}MB)`);
  }
  console.log("\n步骤：");
  console.log("  1) 设置环境变量 NEXT_PUBLIC_MEDIA_BASE_URL=<CDN 基址> 后重新构建");
  console.log("  2) 上传以下 5 个目录（保持相对路径不变）：");
  for (const dir of MEDIA_DIRS) console.log(`     ${dir.replace("public/", "")}/`);
  console.log("\n参考命令（任选其一）：");
  console.log("  # rclone（S3/R2/OSS 通用，需先 rclone config 配置 remote）");
  for (const dir of MEDIA_DIRS) {
    const name = dir.replace("public/", "");
    console.log(`  rclone copy public/${name} <remote>:<bucket>/${name}`);
  }
  console.log("  # AWS CLI（R2 不支持 --acl，请改用桶级公开读或自定义域）");
  for (const dir of MEDIA_DIRS) {
    const name = dir.replace("public/", "");
    console.log(`  aws s3 sync public/${name} s3://<bucket>/${name}`);
  }
  console.log("\n  3) 校验：curl -I <CDN 基址>/mp3/<文件名> 返回 200");
  console.log("  4) 迁移完成后可从 public/ 移除对应文件，并运行 pnpm assets:check");
}
