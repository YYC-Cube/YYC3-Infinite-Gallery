/**
 * @file 多版本设计状态管理
 * @description 支持主题/断点/布局版本切换，持久化到 localStorage
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-20
 */

import { useSyncExternalStore } from "react";
import { hostStorageSet } from "@/lib/host-bridge";

export type GalleryTheme = "warm-art" | "deep-night" | "aurora" | "minimal";
export type LayoutVersion = "split" | "unified";
export type BreakpointVersion = "desktop" | "tablet" | "mobile";

export interface GalleryVersion {
  version: 1;
  theme: GalleryTheme;
  layout: LayoutVersion;
  breakpoint: BreakpointVersion;
  /** 是否为用户手动覆盖断点（true 时写入 data-breakpoint，否则由 CSS @media 自动响应） */
  breakpointOverride: boolean;
  reducedMotion: boolean;
}

export interface ThemeDefinition {
  id: GalleryTheme;
  name: string;
  description: string;
  colors: Record<string, string>;
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: "warm-art",
    name: "温润艺术风",
    description: "暖色调背景光效，适合摄影与影像展示",
    colors: {
      "--background": "#0a0908",
      "--foreground": "#f5f0e8",
      "--warm-primary": "#d4a574",
      "--warm-secondary": "#c9956c",
      "--warm-accent": "#e8c9a0",
      "--ambient-top": "rgba(212, 165, 116, 0.08)",
      "--ambient-left": "rgba(255, 200, 150, 0.06)",
      "--ambient-right": "rgba(255, 180, 130, 0.05)",
      "--ambient-center": "rgba(232, 201, 160, 0.03)",
      "--text-primary": "rgba(245, 240, 232, 0.9)",
      "--text-secondary": "rgba(245, 240, 232, 0.7)",
      "--text-muted": "rgba(245, 240, 232, 0.4)",
      "--glow-intensity": "1",
      "--blur-amount": "40px",
    },
  },
  {
    id: "deep-night",
    name: "深夜极简",
    description: "深色底色与冷白光效，适合夜间观看",
    colors: {
      "--background": "#050507",
      "--foreground": "#e8eaf6",
      "--warm-primary": "#8b9dc3",
      "--warm-secondary": "#7a8bb0",
      "--warm-accent": "#c0c9e0",
      "--ambient-top": "rgba(139, 157, 195, 0.06)",
      "--ambient-left": "rgba(120, 140, 180, 0.05)",
      "--ambient-right": "rgba(100, 130, 170, 0.04)",
      "--ambient-center": "rgba(160, 170, 190, 0.03)",
      "--text-primary": "rgba(232, 234, 246, 0.9)",
      "--text-secondary": "rgba(232, 234, 246, 0.7)",
      "--text-muted": "rgba(232, 234, 246, 0.4)",
      "--glow-intensity": "0.8",
      "--blur-amount": "32px",
    },
  },
  {
    id: "aurora",
    name: "极光律动",
    description: "渐变极光背景，动态光效呼吸",
    colors: {
      "--background": "#060a0e",
      "--foreground": "#f0fdf4",
      "--warm-primary": "#34d399",
      "--warm-secondary": "#22c55e",
      "--warm-accent": "#86efac",
      "--ambient-top": "rgba(52, 211, 153, 0.08)",
      "--ambient-left": "rgba(34, 197, 94, 0.06)",
      "--ambient-right": "rgba(16, 185, 129, 0.05)",
      "--ambient-center": "rgba(134, 239, 172, 0.03)",
      "--text-primary": "rgba(240, 253, 244, 0.9)",
      "--text-secondary": "rgba(240, 253, 244, 0.7)",
      "--text-muted": "rgba(240, 253, 244, 0.4)",
      "--glow-intensity": "1.2",
      "--blur-amount": "48px",
    },
  },
  {
    id: "minimal",
    name: "纯净极简",
    description: "无装饰背景，聚焦内容本身",
    colors: {
      "--background": "#ffffff",
      "--foreground": "#0f172a",
      "--warm-primary": "#64748b",
      "--warm-secondary": "#475569",
      "--warm-accent": "#94a3b8",
      "--ambient-top": "rgba(100, 116, 139, 0.04)",
      "--ambient-left": "rgba(71, 85, 105, 0.03)",
      "--ambient-right": "rgba(71, 85, 105, 0.02)",
      "--ambient-center": "rgba(148, 163, 184, 0.02)",
      "--text-primary": "rgba(15, 23, 42, 0.9)",
      "--text-secondary": "rgba(15, 23, 42, 0.7)",
      "--text-muted": "rgba(15, 23, 42, 0.4)",
      "--glow-intensity": "0.5",
      "--blur-amount": "24px",
    },
  },
];

const STORAGE_KEY = "yyc3-gallery-version-v1";
const listeners = new Set<() => void>();

function defaultVersion(): GalleryVersion {
  return {
    version: 1,
    theme: "warm-art",
    layout: "split",
    breakpoint: "desktop",
    breakpointOverride: false,
    reducedMotion: false,
  };
}

function restoreVersion(): GalleryVersion {
  if (typeof window === "undefined") return defaultVersion();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultVersion();
    const parsed = JSON.parse(raw) as Partial<GalleryVersion>;
    const base = defaultVersion();
    const theme = THEME_DEFINITIONS.find((t) => t.id === parsed.theme)?.id;
    const layout =
      parsed.layout === "split" || parsed.layout === "unified"
        ? parsed.layout
        : base.layout;
    const breakpoint =
      parsed.breakpoint === "desktop" ||
      parsed.breakpoint === "tablet" ||
      parsed.breakpoint === "mobile"
        ? parsed.breakpoint
        : base.breakpoint;
    return {
      version: 1,
      theme: theme ?? base.theme,
      layout,
      breakpoint,
      breakpointOverride: Boolean(parsed.breakpointOverride),
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return defaultVersion();
  }
}

let state: GalleryVersion = restoreVersion();
let persistTimer: number | null = null;

function schedulePersist() {
  if (typeof window === "undefined") return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      void hostStorageSet(STORAGE_KEY, state);
    } catch {
      /* 存储不可用时保持会话内存状态 */
    }
    persistTimer = null;
  }, 900);
}

function emit(next: GalleryVersion) {
  state = next;
  listeners.forEach((listener) => listener());
  schedulePersist();
}

export function subscribeVersion(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersionSnapshot(): GalleryVersion {
  return state;
}

export function useVersion(): GalleryVersion {
  return useSyncExternalStore(
    subscribeVersion,
    getVersionSnapshot,
    getVersionSnapshot,
  );
}

export function setTheme(theme: GalleryTheme) {
  emit({ ...state, theme });
}

export function setLayout(layout: LayoutVersion) {
  emit({ ...state, layout });
}

export function setBreakpoint(breakpoint: BreakpointVersion) {
  emit({ ...state, breakpoint, breakpointOverride: true });
}

/** 恢复自动断点模式：清除手动覆盖，由 CSS @media 原生响应 */
export function resetBreakpoint() {
  emit({ ...state, breakpoint: "desktop", breakpointOverride: false });
}

export function setReducedMotion(reducedMotion: boolean) {
  emit({ ...state, reducedMotion });
}

export function getThemeDefinition(theme: GalleryTheme): ThemeDefinition {
  return (
    THEME_DEFINITIONS.find((t) => t.id === theme) ?? THEME_DEFINITIONS[0]!
  );
}

export function applyThemeToDOM(theme: GalleryTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const definition = getThemeDefinition(theme);
  Object.entries(definition.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = theme;
}

export function getBreakpointFromWidth(width: number): BreakpointVersion {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export const VERSION_STORAGE_KEY = STORAGE_KEY;
