/**
 * @file 媒体地址解析
 * @description 将 public 相对路径解析为可配置媒体基址（CDN / 对象存储）地址，实现资产外迁零代码改动
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */

/** 媒体基址：构建期由 NEXT_PUBLIC_MEDIA_BASE_URL 注入，留空表示随站点同源分发 */
const RAW_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";

/** 去掉尾部斜杠，避免拼接出双斜杠 */
const MEDIA_BASE = RAW_BASE.trim().replace(/\/+$/, "");

/** 已是绝对地址或运行时对象地址时不再前缀 */
const ABSOLUTE_URL = /^(https?:)?\/\//i;

export function getMediaBaseUrl(): string {
  return MEDIA_BASE;
}

/**
 * 解析媒体相对路径：
 * - 绝对 URL / data: / blob: 原样返回
 * - `/foo` 或 `foo` → `${MEDIA_BASE}/foo`（未配置基址时返回 `/foo`）
 */
export function mediaUrl(path: string): string {
  if (!path) return path;
  if (ABSOLUTE_URL.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return MEDIA_BASE ? `${MEDIA_BASE}${normalized}` : normalized;
}
