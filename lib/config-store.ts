/**
 * @file 配置状态管理
 * @description 温润艺术风自定义配置系统 - 支持持久化存储
 * @author YYC³
 * @version 3.0.0
 */

import { loadBackgroundAsset } from "@/lib/asset-store";
import { hostStorageGet, hostStorageSet } from "@/lib/host-bridge";

/**
 * 主题与自定义配色的优先级：
 * - 主题提供基础变量（写入 <style id="yyc3-theme-vars">）
 * - Design Studio 仅在对应 override 为 true 时写入内联变量，覆盖主题
 * - override 为 false 时移除内联变量，让主题重新生效
 */
export interface VisualOverrides {
  warmPrimary: boolean;
  ambient: boolean;
  glow: boolean;
  border: boolean;
}

export interface GalleryConfig {
  /* 背景设置 */
  backgroundImage: string | null;
  /** 页面背景在 IndexedDB 中的资源 ID（避免 DataURL 占用 localStorage 配额） */
  backgroundAssetId: string | null;
  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundPosition: string;

  /* 媒体空间专有背景 */
  playerBackgroundAssetId: string | null;
  playerBackgroundImage: string | null;
  playerBackgroundOpacity: number;
  playerBackgroundBlur: number;

  /* 视觉风格 */
  /** 哪些视觉字段由用户显式覆盖主题；false 时跟随当前主题 */
  visualOverrides: VisualOverrides;
  glowIntensity: number;
  glowRadius: number;
  ambientTopColor: string;
  ambientLeftColor: string;
  ambientRightColor: string;
  ambientCenterColor: string;
  warmPrimaryColor: string;
  /** 容器边线色度（RGB 三通道，0-255，空格分隔），统一驱动所有 border-warm/* */
  borderChroma: string;
  /** 全局玻璃模糊强度（px） */
  glassBlur: number;

  /* 品牌文字（留空时回退 i18n 文案） */
  brandLine1: string;
  brandLine2: string;

  /* 排版设置 */
  fontSize: string;
  fontWeight: string;
  letterSpacing: number;
  textOpacity: number;
  lineHeight: number;

  /* 动效参数 */
  revealDuration: number;
  revealDelay: number;
  floatDuration: number;
  floatDistance: number;
  breatheDuration: number;
  auraDuration: number;
  drawDuration: number;

  /* 布局结构 */
  footerPaddingY: number;
  separatorWidth: number;
  showMobileHint: boolean;
  enableGlowEffect: boolean;
}

export const DEFAULT_CONFIG: GalleryConfig = {
  backgroundImage: null,
  backgroundAssetId: null,
  backgroundOpacity: 1,
  backgroundBlur: 0,
  backgroundPosition: "center",

  playerBackgroundAssetId: null,
  playerBackgroundImage: null,
  playerBackgroundOpacity: 0.5,
  playerBackgroundBlur: 0,

  visualOverrides: {
    warmPrimary: false,
    ambient: false,
    glow: false,
    border: false,
  },
  glowIntensity: 1,
  glowRadius: 60,
  ambientTopColor: "rgba(212, 165, 116, 0.08)",
  ambientLeftColor: "rgba(255, 200, 150, 0.06)",
  ambientRightColor: "rgba(255, 180, 130, 0.05)",
  ambientCenterColor: "rgba(232, 201, 160, 0.03)",
  warmPrimaryColor: "#d4a574",
  borderChroma: "212 165 116",
  glassBlur: 20,

  brandLine1: "",
  brandLine2: "",

  fontSize: "base",
  fontWeight: "light",
  letterSpacing: 0.4,
  textOpacity: 0.8,
  lineHeight: 1.6,

  revealDuration: 1.2,
  revealDelay: 1.5,
  floatDuration: 6,
  floatDistance: -10,
  breatheDuration: 4,
  auraDuration: 3,
  drawDuration: 2,

  footerPaddingY: 12,
  separatorWidth: 64,
  showMobileHint: true,
  enableGlowEffect: true,
};

const CONFIG_STORAGE_KEY = "yyc3-gallery-config";

/** 旧配置没有 override 标记时，按是否偏离默认值推断 */
function inferVisualOverrides(config: GalleryConfig): VisualOverrides {
  return {
    warmPrimary: config.warmPrimaryColor !== DEFAULT_CONFIG.warmPrimaryColor,
    ambient:
      config.ambientTopColor !== DEFAULT_CONFIG.ambientTopColor ||
      config.ambientLeftColor !== DEFAULT_CONFIG.ambientLeftColor ||
      config.ambientRightColor !== DEFAULT_CONFIG.ambientRightColor ||
      config.ambientCenterColor !== DEFAULT_CONFIG.ambientCenterColor,
    glow: config.glowIntensity !== DEFAULT_CONFIG.glowIntensity,
    border: config.borderChroma !== DEFAULT_CONFIG.borderChroma,
  };
}

/** 合并默认值并补齐 override 标记，兼容历史配置与宿主远端配置 */
export function normalizeConfig(input: Partial<GalleryConfig>): GalleryConfig {
  const merged = { ...DEFAULT_CONFIG, ...input } as GalleryConfig;
  const raw = input.visualOverrides;
  const overrides: VisualOverrides = raw
    ? {
        warmPrimary: Boolean(raw.warmPrimary),
        ambient: Boolean(raw.ambient),
        glow: Boolean(raw.glow),
        border: Boolean(raw.border),
      }
    : inferVisualOverrides(merged);
  return { ...merged, visualOverrides: overrides };
}

export function loadConfig(): GalleryConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GalleryConfig>;
      return normalizeConfig(parsed);
    }
  } catch (error) {
    console.error("Failed to load config:", error);
  }

  return DEFAULT_CONFIG;
}

export function saveConfig(config: GalleryConfig): void {
  if (typeof window === "undefined") return;

  try {
    const persisted: GalleryConfig = {
      ...normalizeConfig(config),
      // 有 assetId 时只持久化引用；无 assetId 的旧配置保留 DataURL 以兼容迁移
      backgroundImage: config.backgroundAssetId ? null : config.backgroundImage,
      playerBackgroundImage: config.playerBackgroundAssetId
        ? null
        : config.playerBackgroundImage,
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(persisted));
    void hostStorageSet(CONFIG_STORAGE_KEY, persisted);
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

export async function loadConfigFromHost(): Promise<GalleryConfig | null> {
  const remote =
    await hostStorageGet<Partial<GalleryConfig>>(CONFIG_STORAGE_KEY);
  if (!remote) return null;
  return normalizeConfig(remote);
}

const hydratedObjectUrls = new Set<string>();

function createHydratedUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  hydratedObjectUrls.add(url);
  return url;
}

/** 释放本模块创建的全部背景预览 objectURL */
export function revokeHydratedBackgroundUrls(): void {
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
    hydratedObjectUrls.clear();
    return;
  }
  hydratedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  hydratedObjectUrls.clear();
}

export async function hydratePlayerBackground(
  config: GalleryConfig,
): Promise<GalleryConfig> {
  if (config.playerBackgroundImage || !config.playerBackgroundAssetId)
    return config;
  const blob = await loadBackgroundAsset(config.playerBackgroundAssetId);
  if (!blob) return config;
  return {
    ...config,
    playerBackgroundImage: createHydratedUrl(blob),
  };
}

/** 同时恢复页面背景与媒体空间背景（两者均以 IndexedDB 为真实来源） */
export async function hydrateBackgrounds(
  config: GalleryConfig,
): Promise<GalleryConfig> {
  let next = config;
  if (!next.backgroundImage && next.backgroundAssetId) {
    const blob = await loadBackgroundAsset(next.backgroundAssetId);
    if (blob) {
      next = { ...next, backgroundImage: createHydratedUrl(blob) };
    }
  }
  return hydratePlayerBackground(next);
}

export function resetConfig(): GalleryConfig {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
  return DEFAULT_CONFIG;
}

export function applyConfigToDOM(config: GalleryConfig): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const overrides = config.visualOverrides ?? DEFAULT_CONFIG.visualOverrides;

  // 仅在用户显式覆盖时写内联变量；否则移除内联值，让主题样式表生效
  if (overrides.glow) {
    root.style.setProperty("--glow-intensity", String(config.glowIntensity));
  } else {
    root.style.removeProperty("--glow-intensity");
  }
  root.style.setProperty("--glow-radius", `${config.glowRadius}%`);

  // 同时维护 --ambient-* 与历史别名 --ambient-*-color
  const ambientValues: Record<string, string> = {
    "--ambient-top": config.ambientTopColor,
    "--ambient-left": config.ambientLeftColor,
    "--ambient-right": config.ambientRightColor,
    "--ambient-center": config.ambientCenterColor,
    "--ambient-top-color": config.ambientTopColor,
    "--ambient-left-color": config.ambientLeftColor,
    "--ambient-right-color": config.ambientRightColor,
    "--ambient-center-color": config.ambientCenterColor,
  };
  for (const [name, value] of Object.entries(ambientValues)) {
    if (overrides.ambient) {
      root.style.setProperty(name, value);
    } else {
      root.style.removeProperty(name);
    }
  }

  if (overrides.warmPrimary) {
    root.style.setProperty("--warm-primary", config.warmPrimaryColor);
  } else {
    root.style.removeProperty("--warm-primary");
  }

  if (overrides.border) {
    root.style.setProperty("--border-chroma", config.borderChroma);
  } else {
    root.style.removeProperty("--border-chroma");
  }
  root.style.setProperty("--glass-blur", `${config.glassBlur}px`);

  root.style.setProperty("--reveal-duration", `${config.revealDuration}s`);
  root.style.setProperty("--reveal-delay", `${config.revealDelay}s`);
  root.style.setProperty("--float-duration", `${config.floatDuration}s`);
  root.style.setProperty("--float-distance", `${config.floatDistance}px`);
  root.style.setProperty("--breathe-duration", `${config.breatheDuration}s`);
  root.style.setProperty("--aura-duration", `${config.auraDuration}s`);
  root.style.setProperty("--draw-duration", `${config.drawDuration}s`);

  if (config.backgroundImage) {
    document.body.classList.add("custom-background-active");
  } else {
    document.body.classList.remove("custom-background-active");
  }
}
