/**
 * @file 配置状态管理
 * @description 温润艺术风自定义配置系统 - 支持持久化存储
 * @author YYC³
 * @version 3.0.0
 */

import { loadBackgroundAsset } from "@/lib/asset-store";
import { hostStorageGet, hostStorageSet } from "@/lib/host-bridge";

export interface GalleryConfig {
  /* 背景设置 */
  backgroundImage: string | null;
  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundPosition: string;

  /* 媒体空间专有背景 */
  playerBackgroundAssetId: string | null;
  playerBackgroundImage: string | null;
  playerBackgroundOpacity: number;
  playerBackgroundBlur: number;

  /* 视觉风格 */
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
  backgroundOpacity: 1,
  backgroundBlur: 0,
  backgroundPosition: "center",

  playerBackgroundAssetId: null,
  playerBackgroundImage: null,
  playerBackgroundOpacity: 0.5,
  playerBackgroundBlur: 0,

  glowIntensity: 1,
  glowRadius: 60,
  ambientTopColor: "rgba(212, 165, 116, 0.08)",
  ambientLeftColor: "rgba(255, 200, 150, 0.06)",
  ambientRightColor: "rgba(255, 180, 130, 0.05)",
  ambientCenterColor: "rgba(232, 201, 160, 0.03)",
  warmPrimaryColor: "#d4a574",
  borderChroma: "212 165 116",
  glassBlur: 20,

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

export function loadConfig(): GalleryConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
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
      ...config,
      playerBackgroundImage: null,
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
  return { ...DEFAULT_CONFIG, ...remote };
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
    playerBackgroundImage: URL.createObjectURL(blob),
  };
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

  root.style.setProperty("--glow-intensity", String(config.glowIntensity));
  root.style.setProperty("--glow-radius", `${config.glowRadius}%`);
  // 同时写入两套变量名：--ambient-* 供 body::before 光效使用，
  // --ambient-*-color 为历史兼容别名，修正此前光晕色配置不生效的缺陷。
  root.style.setProperty("--ambient-top", config.ambientTopColor);
  root.style.setProperty("--ambient-left", config.ambientLeftColor);
  root.style.setProperty("--ambient-right", config.ambientRightColor);
  root.style.setProperty("--ambient-center", config.ambientCenterColor);
  root.style.setProperty("--ambient-top-color", config.ambientTopColor);
  root.style.setProperty("--ambient-left-color", config.ambientLeftColor);
  root.style.setProperty("--ambient-right-color", config.ambientRightColor);
  root.style.setProperty("--ambient-center-color", config.ambientCenterColor);
  root.style.setProperty("--warm-primary", config.warmPrimaryColor);
  root.style.setProperty("--border-chroma", config.borderChroma);
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
