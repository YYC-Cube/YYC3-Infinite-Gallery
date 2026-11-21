/**
 * @file 主题与版本上下文提供者
 * @description 将主题与布局模式应用到 DOM；断点由 CSS @media 原生响应，仅手动覆盖时写入 data-breakpoint
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-20
 */
"use client";

import { useEffect } from "react";
import type { GalleryVersion } from "@/lib/version-store";
import { applyThemeToDOM, useVersion } from "@/lib/version-store";
import { syncSpaceMode } from "@/lib/media-space/store";

export default function ThemeVersionProvider() {
  const version = useVersion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    // 主题与布局始终由状态驱动
    applyThemeToDOM(version.theme);
    root.dataset.layout = version.layout;

    // 断点：仅当用户手动覆盖时写入 data-breakpoint，
    // 否则移除该属性，让 CSS @media 原生响应窗口宽度（避免 FOUC 与 resize 监听）
    if (version.breakpointOverride) {
      root.dataset.breakpoint = version.breakpoint;
    } else {
      delete root.dataset.breakpoint;
    }

    // 减少动效：同步到 DOM（兼容系统级 prefers-reduced-motion）
    if (version.reducedMotion) {
      root.dataset.reducedMotion = "true";
    } else {
      delete root.dataset.reducedMotion;
    }
  }, [
    version.theme,
    version.layout,
    version.breakpoint,
    version.breakpointOverride,
    version.reducedMotion,
  ]);

  // 布局以设计系统为唯一事实源：版本切换后同步媒体空间模式
  useEffect(() => {
    syncSpaceMode(version.layout);
  }, [version.layout]);

  return null;
}

export { useVersion };
export type { GalleryVersion };
