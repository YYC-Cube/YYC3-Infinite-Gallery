/**
 * @file Service Worker 预缓存清单生成器
 * @description 构建后扫描静态导出中的 JS/CSS/字体资源，生成 sw-assets.js
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, "out");
const STATIC_DIR = join(OUT_DIR, "_next", "static");
const OUTPUT = join(OUT_DIR, "sw-assets.js");
const SW_OUTPUT = join(OUT_DIR, "sw.js");
const SW_PLACEHOLDER = "__YYC3_SW_VERSION__";
const EXTENSIONS = new Set([".js", ".css", ".woff2"]);
const PUBLIC_FILES = [
  "manifest.json",
  "offline.html",
  "favicon.ico",
  "icon.svg",
  "D-1998.png",
  "1.webp",
  "2.webp",
  "3.webp",
  "4.webp",
  "5.webp",
  "6.webp",
  "7.webp",
  "8.webp",
  "D-icons/icon-192.png",
  "D-icons/icon-512.png",
];
const GALLERY_DIRS = ["artist-3x4", "artist-4x3"];

function collect(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collect(full));
      continue;
    }
    if ([...EXTENSIONS].some((extension) => entry.name.endsWith(extension))) {
      files.push(full);
    }
  }
  return files;
}

function collectImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && /\.(jpe?g|png|webp)$/i.test(entry.name),
    )
    .map((entry) => join(dir, entry.name));
}

if (!existsSync(STATIC_DIR)) {
  console.error("未找到 out/_next/static，请先执行 next build");
  process.exitCode = 1;
} else {
  const files = [
    ...collect(STATIC_DIR),
    ...PUBLIC_FILES.map((file) => join(OUT_DIR, file)).filter((file) =>
      existsSync(file),
    ),
    ...GALLERY_DIRS.flatMap((dir) => collectImages(join(OUT_DIR, dir))),
  ];
  const assets = files
    .map((file) => `/${relative(OUT_DIR, file).split(sep).join("/")}`)
    .sort();
  const output = `self.__YYC3_PRECACHE__ = ${JSON.stringify(assets)};\n`;
  writeFileSync(OUTPUT, output, "utf8");

  const version = createHash("sha256")
    .update(JSON.stringify(assets))
    .digest("hex")
    .slice(0, 12);
  const serviceWorker = readFileSync(SW_OUTPUT, "utf8");
  writeFileSync(
    SW_OUTPUT,
    serviceWorker.replaceAll(SW_PLACEHOLDER, version),
    "utf8",
  );
  console.log(
    `已生成 sw-assets.js，共 ${assets.length} 个静态资源；SW 版本 ${version}`,
  );
}
