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

export type GalleryTheme =
  | "warm-art"
  | "deep-night"
  | "aurora"
  | "minimal"
  | "cyberpunk"
  | "ink-wash"
  | "polar";
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
      "--border-chroma": "212 165 116",
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
      "--border-chroma": "139 157 195",
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
      "--border-chroma": "52 211 153",
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
      "--border-chroma": "100 116 139",
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
  {
    id: "cyberpunk",
    name: "赛博朋克",
    description: "霓虹紫青对比，未来科技感",
    colors: {
      "--background": "#080611",
      "--foreground": "#f0e9ff",
      "--warm-primary": "#d946ef",
      "--warm-secondary": "#a855f7",
      "--warm-accent": "#22d3ee",
      "--border-chroma": "217 70 239",
      "--ambient-top": "rgba(217, 70, 239, 0.10)",
      "--ambient-left": "rgba(168, 85, 247, 0.08)",
      "--ambient-right": "rgba(34, 211, 238, 0.07)",
      "--ambient-center": "rgba(192, 132, 252, 0.04)",
      "--text-primary": "rgba(240, 233, 255, 0.92)",
      "--text-secondary": "rgba(240, 233, 255, 0.72)",
      "--text-muted": "rgba(240, 233, 255, 0.42)",
      "--glow-intensity": "1.4",
      "--blur-amount": "44px",
    },
  },
  {
    id: "ink-wash",
    name: "水墨丹青",
    description: "宣纸墨色，东方极简意境",
    colors: {
      "--background": "#ece8df",
      "--foreground": "#1c1a17",
      "--warm-primary": "#4a453d",
      "--warm-secondary": "#6b6459",
      "--warm-accent": "#8c8476",
      "--border-chroma": "74 69 61",
      "--ambient-top": "rgba(74, 69, 61, 0.05)",
      "--ambient-left": "rgba(107, 100, 89, 0.04)",
      "--ambient-right": "rgba(140, 132, 118, 0.03)",
      "--ambient-center": "rgba(60, 56, 50, 0.02)",
      "--text-primary": "rgba(28, 26, 23, 0.9)",
      "--text-secondary": "rgba(28, 26, 23, 0.7)",
      "--text-muted": "rgba(28, 26, 23, 0.4)",
      "--glow-intensity": "0.4",
      "--blur-amount": "20px",
    },
  },
  {
    id: "polar",
    name: "极地冰川",
    description: "冰蓝冷白，通透清冽质感",
    colors: {
      "--background": "#e8f4f8",
      "--foreground": "#0f2b3d",
      "--warm-primary": "#0ea5c4",
      "--warm-secondary": "#0891b2",
      "--warm-accent": "#67e8f9",
      "--border-chroma": "14 165 196",
      "--ambient-top": "rgba(14, 165, 196, 0.06)",
      "--ambient-left": "rgba(8, 145, 178, 0.05)",
      "--ambient-right": "rgba(103, 232, 249, 0.04)",
      "--ambient-center": "rgba(34, 211, 238, 0.02)",
      "--text-primary": "rgba(15, 43, 61, 0.9)",
      "--text-secondary": "rgba(15, 43, 61, 0.7)",
      "--text-muted": "rgba(15, 43, 61, 0.4)",
      "--glow-intensity": "0.6",
      "--blur-amount": "28px",
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

/** 服务端与首次水合固定返回默认版本，客户端状态在挂载后接管 */
const SERVER_VERSION = defaultVersion();

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
    () => SERVER_VERSION,
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

const THEME_STYLE_ID = "yyc3-theme-vars";

/**
 * 主题变量写入独立样式表而非内联样式：
 * Design Studio 的内联变量优先级更高，移除内联后主题样式自然重新生效。
 */
export function applyThemeToDOM(theme: GalleryTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const definition = getThemeDefinition(theme);

  let styleElement = document.getElementById(
    THEME_STYLE_ID,
  ) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = THEME_STYLE_ID;
    document.head.appendChild(styleElement);
  }
  const declarations = Object.entries(definition.colors)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  styleElement.textContent = `:root {\n${declarations}\n}`;

  root.dataset.theme = theme;
}

export function getBreakpointFromWidth(width: number): BreakpointVersion {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export const VERSION_STORAGE_KEY = STORAGE_KEY;
