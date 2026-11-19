/**
 * @file 文档标规校验脚本
 * @description 校验团队标规/开发指南目录的 front matter、品牌写法、标头标尾与相对链接
 * @author YYC³ Team
 * @version 1.0.1
 * @created 2026-11-18
 * @updated 2026-11-19
 */
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const STRICT_DIRS = [
  join(ROOT, "docs/YYC3-团队通用-标规文档"),
  join(ROOT, "docs/YYC3-团队通用-开发指南"),
];
const SKIP_DIRS = [
  join(ROOT, "node_modules"),
  join(ROOT, ".next"),
  join(ROOT, "out"),
  join(ROOT, "docs/YYC3-MusAI-开源组件库"),
];
const SLOGAN_LINES = [
  "> **_YYC³_**（YanYuCloudCube™ · 注册商标）",
  "> _言启象限 | 语枢未来_",
  "> **_Words Initiate Quadrants, Language Serves as Core for Future_**",
  "> _万象归元于云枢 | 深栈智启新纪元_",
  "> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**",
];
const REQUIRED_FIELDS = [
  "file",
  "title",
  "description",
  "author",
  "version",
  "created",
  "updated",
  "status",
  "tags",
  "category",
  "language",
  "audience",
  "complexity",
];
const BRAND_VIOLATION =
  /YanYuCloudCube(?!™)|yanyucloud\.com|YanYuCloudCube\s+0\d/i;
const errors = [];

function collectMarkdown(dir) {
  const out = [];
  if (!existsSync(dir) || SKIP_DIRS.includes(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      const stats = lstatSync(full);
      if (stats.isSymbolicLink()) continue;
      if (stats.isDirectory()) out.push(...collectMarkdown(full));
      else if (entry.endsWith(".md")) out.push(full);
    } catch {
      continue;
    }
  }
  return out;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fields;
}

const allDocs = collectMarkdown(ROOT).filter(
  (f) =>
    !f.includes(`${join("node_modules")}/`) &&
    !f.includes("/.next/") &&
    !f.includes("/out/"),
);

for (const file of allDocs) {
  const content = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const strict = STRICT_DIRS.some((dir) => file.startsWith(`${dir}/`));

  if (strict) {
    const fm = parseFrontMatter(content);
    if (!fm) {
      errors.push(`${rel}: 缺少 front matter`);
    } else {
      for (const field of REQUIRED_FIELDS) {
        if (!(field in fm))
          errors.push(`${rel}: front matter 缺少字段 ${field}`);
      }
      const expectedOrder = REQUIRED_FIELDS.filter((f) => f in fm);
      const actualOrder = Object.keys(fm).filter((f) =>
        REQUIRED_FIELDS.includes(f),
      );
      if (expectedOrder.join(",") !== actualOrder.join(",")) {
        errors.push(`${rel}: front matter 字段顺序不符合规范`);
      }
      if (fm.file !== basename(file)) {
        errors.push(`${rel}: file 字段 "${fm.file}" 与磁盘文件名不一致`);
      }
      const h1 = content.match(/^# (.+)$/m)?.[1]?.trim();
      if (h1 && fm.title !== h1) {
        errors.push(`${rel}: title "${fm.title}" 与 H1 "${h1}" 不一致`);
      }
      if (fm.tags && !/^\[[^\]]+\]$/.test(fm.tags)) {
        errors.push(`${rel}: tags 必须为合法 YAML 流式序列`);
      }
    }

    for (const line of SLOGAN_LINES) {
      if (!content.includes(line))
        errors.push(`${rel}: 缺少品牌标语行 "${line}"`);
    }
    if (!content.includes("## 变更历史")) errors.push(`${rel}: 缺少变更历史表`);
    const withoutCode = content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "");
    const footerCount = (withoutCode.match(/<p align="center">/g) ?? []).length;
    if (footerCount !== 1)
      errors.push(`${rel}: 品牌页脚应恰好 1 处，实际 ${footerCount} 处`);
  }

  const cleaned = content.replace(/```[\s\S]*?```/g, "");
  for (const line of cleaned.split("\n")) {
    if (/禁止|不得|校验命令|grep -rn/.test(line)) continue;
    const brandMatch = line.match(BRAND_VIOLATION);
    if (brandMatch) errors.push(`${rel}: 品牌写法违规 "${brandMatch[0]}"`);
  }

  for (const link of content.matchAll(/\]\((\.{1,2}\/[^)#]+)(?:#[^)]+)?\)/g)) {
    const target = resolve(dirname(file), link[1]);
    if (!existsSync(target)) errors.push(`${rel}: 失效相对链接 "${link[1]}"`);
  }
}

if (errors.length > 0) {
  console.error(`文档标规校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`文档标规校验通过：${allDocs.length} 个 Markdown 文档`);
