/**
 * @file 轻量国际化
 * @description 中/英/日三语文案字典与语言状态，持久化到 localStorage
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import { useSyncExternalStore } from "react";

export type Locale = "zh" | "en" | "ja";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "zh", label: "中文", native: "简体中文" },
  { id: "en", label: "English", native: "English" },
  { id: "ja", label: "日本語", native: "日本語" },
];

/** 关键 UI 文案字典 */
export const DICTIONARY: Record<Locale, Record<string, string>> = {
  zh: {
    "brand.line1": "言启象限",
    "brand.line2": "语枢未来",
    "hint.scroll": "滚动探索",
    "nav.gallery": "画廊",
    "nav.media": "媒体",
    "nav.widgets": "组件",
    "nav.design": "设计",
    "version.theme": "主题版本",
    "version.layout": "布局模式",
    "version.breakpoint": "断点版本",
    "version.motion": "减少动效",
    "version.auto": "自动",
    "version.split": "拆分",
    "version.unified": "统一",
    "version.desktop": "桌面",
    "version.tablet": "平板",
    "version.mobile": "移动",
  },
  en: {
    "brand.line1": "Words Initiate",
    "brand.line2": "Quadrants",
    "hint.scroll": "Scroll to Explore",
    "nav.gallery": "Gallery",
    "nav.media": "Media",
    "nav.widgets": "Widgets",
    "nav.design": "Design",
    "version.theme": "Theme",
    "version.layout": "Layout",
    "version.breakpoint": "Breakpoint",
    "version.motion": "Reduce Motion",
    "version.auto": "Auto",
    "version.split": "Split",
    "version.unified": "Unified",
    "version.desktop": "Desktop",
    "version.tablet": "Tablet",
    "version.mobile": "Mobile",
  },
  ja: {
    "brand.line1": "言葉が象限を開く",
    "brand.line2": "語りが未来を築く",
    "hint.scroll": "スクロールして探索",
    "nav.gallery": "ギャラリー",
    "nav.media": "メディア",
    "nav.widgets": "ウィジェット",
    "nav.design": "デザイン",
    "version.theme": "テーマ",
    "version.layout": "レイアウト",
    "version.breakpoint": "ブレークポイント",
    "version.motion": "モーション削減",
    "version.auto": "自動",
    "version.split": "分割",
    "version.unified": "統合",
    "version.desktop": "デスクトップ",
    "version.tablet": "タブレット",
    "version.mobile": "モバイル",
  },
};

const STORAGE_KEY = "yyc3-locale-v1";
const listeners = new Set<() => void>();

function detectLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "zh" || saved === "en" || saved === "ja") return saved;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("en")) return "en";
  return "zh";
}

let currentLocale: Locale = detectLocale();

/** 将当前语言同步到 documentElement.lang（修正 SSR 静态 lang 与检测语言不一致） */
export function syncDocumentLang() {
  if (typeof document === "undefined") return;
  document.documentElement.lang =
    currentLocale === "zh"
      ? "zh-CN"
      : currentLocale === "ja"
        ? "ja"
        : "en";
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocale(): Locale {
  return currentLocale;
}

/** 服务端与首次水合固定使用 zh，避免已保存语言造成 hydration 不一致 */
function getServerLocale(): Locale {
  return "zh";
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getServerLocale);
}

export function setLocale(locale: Locale) {
  if (currentLocale === locale) {
    // 同语言也确保 DOM lang 同步（SSR 静态值可能与检测语言不一致）
    syncDocumentLang();
    return;
  }
  currentLocale = locale;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* 忽略 */
    }
  }
  syncDocumentLang();
  listeners.forEach((listener) => listener());
}

/** 取当前语言文案，支持插值 {name} */
export function t(
  key: string,
  locale: Locale = currentLocale,
  params?: Record<string, string>,
): string {
  let text = DICTIONARY[locale][key] ?? DICTIONARY.zh[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, "g"), value);
    }
  }
  return text;
}

export const LOCALE_STORAGE_KEY = STORAGE_KEY;
