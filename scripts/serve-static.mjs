/**
 * @file 极简静态文件服务器
 * @description 为 E2E 测试提供 out/ 静态导出目录的本地服务，零外部依赖
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.argv[2] ?? 3100);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let filePath = join(ROOT, urlPath === "/" ? "index.html" : urlPath);

  // 目录穿越防护
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  // 无扩展名路径回退（静态导出的客户端路由）
  if (!extname(filePath) || !existsSync(filePath)) {
    const htmlFallback = join(ROOT, urlPath.replace(/\/$/, ""), "index.html");
    filePath = existsSync(htmlFallback) ? htmlFallback : join(ROOT, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404).end("Not Found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[YYC³ E2E] serving out/ at http://127.0.0.1:${PORT}`);
});
