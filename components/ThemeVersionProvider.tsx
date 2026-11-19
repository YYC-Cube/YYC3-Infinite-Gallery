/**
 * @file 主题与版本上下文提供者
 * @description 将选定主题应用到 DOM，跟踪断点，并提供版本状态
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
"use client";

import { useEffect, useState } from "react";
import type { GalleryVersion } from "@/lib/version-store";
import {
  applyThemeToDOM,
  getBreakpointFromWidth,
  useVersion,
} from "@/lib/version-store";

export default function ThemeVersionProvider() {
  const version = useVersion();
  const [breakpoint, setBreakpoint] = useState<ReturnType<
    typeof getBreakpointFromWidth
  >>("desktop");

  // 初始化时应用主题、断点和布局到 DOM data 属性
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    applyThemeToDOM(version.theme);
    setBreakpoint(getBreakpointFromWidth(window.innerWidth));
    root.dataset.theme = version.theme;
    root.dataset.layout = version.layout;
    root.dataset.breakpoint = breakpoint;
  }, [version.theme, version.layout]);

  // 监听窗口大小变化，更新断点 data 属性
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const onResize = () => {
      const next = getBreakpointFromWidth(window.innerWidth);
      setBreakpoint(next);
      root.dataset.breakpoint = next;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 当布局切换时更新 data-layout 属性
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.layout = version.layout;
  }, [version.layout]);

  return null;
}

export { useVersion };
export type { GalleryVersion };
