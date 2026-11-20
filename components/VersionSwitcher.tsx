/**
 * @file 多版本切换器
 * @description 悬浮版本控制面板，支持主题/断点/布局切换
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-20
 */
"use client";

import { useCallback } from "react";
import { LayoutDashboard, Smartphone, Monitor, Palette, ArrowLeftRight } from "lucide-react";

import type {
  GalleryTheme,
  LayoutVersion,
  BreakpointVersion,
} from "@/lib/version-store";
import {
  setBreakpoint,
  resetBreakpoint,
  setLayout,
  setTheme,
  setReducedMotion,
  THEME_DEFINITIONS,
  useVersion,
} from "@/lib/version-store";

export default function VersionSwitcher() {
  const version = useVersion();

  const handleThemeChange = useCallback((theme: GalleryTheme) => {
    setTheme(theme);
  }, []);

  const handleLayoutChange = useCallback((layout: LayoutVersion) => {
    setLayout(layout);
  }, []);

  const handleBreakpointChange = useCallback((bp: BreakpointVersion) => {
    setBreakpoint(bp);
  }, []);

  const handleToggleReducedMotion = useCallback(() => {
    setReducedMotion(!version.reducedMotion);
  }, [version.reducedMotion]);

  return (
    <div
      className="version-switcher fixed bottom-6 right-6 z-[9998] flex flex-col gap-2"
      aria-label="版本切换面板"
    >
      <div className="glass-effect rounded-2xl border border-warm/25 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-widest text-warm-primary/70 uppercase">
            多版本设计 · 设计系统
          </span>
          <button
            type="button"
            onClick={() => {
              // 无操作，仅收起展开状态由 CSS 控制
            }}
            className="rounded p-1 text-warm-primary/40 hover:text-warm-primary"
            title="展开/收起"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        {/* 主题切换 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Palette size={12} className="text-warm-primary/50" />
            <span className="text-[10px] text-white/60">主题版本</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {THEME_DEFINITIONS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                className={`w-8 h-8 rounded-full border shadow-sm transition-all ${
                  version.theme === theme.id
                    ? "ring-2 ring-warm-primary scale-105"
                    : "border-warm/20 hover:border-warm/50"
                }`}
                style={{ backgroundColor: theme.colors["--warm-primary"] }}
                title={theme.name}
                aria-label={`切换到 ${theme.name}`}
              />
            ))}
          </div>
        </div>

        {/* 布局切换 */}
        <div className="mb-3 border-t border-warm/10 pt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <LayoutDashboard size={12} className="text-warm-primary/50" />
            <span className="text-[10px] text-white/60">布局模式</span>
          </div>
          <div className="flex gap-1.5">
            {(["split", "unified"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => handleLayoutChange(layout)}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                  version.layout === layout
                    ? "bg-warm/20 border-warm/40 text-warm-primary"
                    : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
                }`}
                title={layout === "split" ? "独立窗口布局" : "统一界面布局"}
              >
                {layout === "split" ? "拆分" : "统一"}
              </button>
            ))}
          </div>
        </div>

        {/* 断点切换 */}
        <div className="mb-3 border-t border-warm/10 pt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Monitor size={12} className="text-warm-primary/50" />
            <span className="text-[10px] text-white/60">断点版本</span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={resetBreakpoint}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                !version.breakpointOverride
                  ? "bg-warm/20 border-warm/40 text-warm-primary"
                  : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
              }`}
              title="自动响应窗口宽度（CSS 原生）"
              aria-label="自动断点模式"
            >
              自动
            </button>
            {(["desktop", "tablet", "mobile"] as const).map((bp) => (
              <button
                key={bp}
                type="button"
                onClick={() => handleBreakpointChange(bp)}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                  version.breakpointOverride && version.breakpoint === bp
                    ? "bg-warm/20 border-warm/40 text-warm-primary"
                    : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
                }`}
                title={
                  bp === "desktop"
                    ? "桌面版"
                    : bp === "tablet"
                      ? "平板版"
                      : "移动版"
                }
              >
                {bp === "desktop" ? "桌面" : bp === "tablet" ? "平板" : "移动"}
              </button>
            ))}
          </div>
        </div>

        {/* 动效减少 */}
        <div className="border-t border-warm/10 pt-2">
          <button
            type="button"
            onClick={handleToggleReducedMotion}
            className="w-full flex items-center justify-between py-1.5 rounded-lg border border-warm/15 bg-black/30 text-[10px] text-white/50 hover:border-warm/30 hover:text-warm-primary"
          >
            <span className="flex items-center gap-1.5">
              <Smartphone size={12} className="text-warm-primary/40" />
              <span>减少动效</span>
            </span>
            <span className={`text-warm-primary/70 ${version.reducedMotion ? "font-bold" : ""}`}>
              {version.reducedMotion ? "开启" : "关闭"}
            </span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-1 right-1 z-[9999] text-[10px] text-white/30">
        YYC³ Design System v3.0
      </div>
    </div>
  );
}
