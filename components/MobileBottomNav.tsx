/**
 * @file 移动端底部导航
 * @description 移动端安全区适配、底部导航栏与触摸手势增强
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-20
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Disc3,
  Settings,
  Smartphone,
} from "lucide-react";
import { useMediaSpace, setSpaceOpen } from "@/lib/media-space/store";
import { useWidgets, setWidgetEnabled } from "@/lib/widget-store";
import { t, useLocale } from "@/lib/i18n";


export type MobileTab = "gallery" | "media" | "widgets" | "design";

const MOBILE_TABS: MobileTab[] = ["gallery", "media", "widgets", "design"];

const TAB_ICONS: Record<MobileTab, React.ComponentType<{ size?: number | string }>> = {
  gallery: LayoutDashboard,
  media: Disc3,
  widgets: Smartphone,
  design: Settings,
};

export default function MobileBottomNav() {
  const space = useMediaSpace();
  const widgets = useWidgets();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<MobileTab>("gallery");
  const [isMobile, setIsMobile] = useState(false);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      setIsMobile(window.innerWidth < 768);
      // 读取 CSS 安全区内嵌
      const bottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-inset-bottom")
          .trim() || "0",
        10,
      );
      setSafeAreaBottom(isNaN(bottom) ? 0 : bottom);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleTabPress = useCallback((tab: MobileTab) => {
    setActiveTab(tab);
    if (tab === "media") {
      if (!space.isOpen) void setSpaceOpen(true);
    } else if (tab === "widgets") {
      // 切换到组件标签时，可在此展开首个组件
    } else if (tab === "design") {
      // 设计标签：主题/布局快捷切换
    }
  }, [space.isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, tab: MobileTab) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTabPress(tab);
      }
    },
    [handleTabPress],
  );

  // 所有 hooks 调用完毕后才允许条件返回，保证 hooks 调用顺序稳定
  if (!isMobile) return null;

  return (
    <nav
      role="navigation"
      aria-label="移动端底部导航"
      className="fixed bottom-0 left-0 right-0 z-[10001] flex items-center justify-center gap-1 px-3 sm:px-4"
      style={{
        paddingBottom: `calc(${safeAreaBottom}px + 8px)`,
      }}
    >
      <div
        className="flex h-10 w-full max-w-md items-center justify-center rounded-full border border-warm/20 bg-[#0a0908]/85 px-2 py-1.5 shadow-2xl backdrop-blur-xl"
        role="tablist"
        aria-label="标签页导航"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              onClick={() => handleTabPress(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              className={`flex h-8 w-8 flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-warm/20 text-warm-primary border border-warm/40"
                  : "text-white/40 hover:text-warm-primary hover:bg-white/5"
              }`}
              aria-label={t(`nav.${tab}`, locale)}
              aria-selected={isActive}
              aria-controls={`mobile-tab-${tab}`}
              id={`mobile-tab-${tab}`}
              title={t(`nav.${tab}`, locale)}
            >
              <Icon size={16} />
              <span className="text-[9px] font-mono leading-none">
                {t(`nav.${tab}`, locale)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 快捷操作提示（仅在非媒体/设计标签时显示） */}
      {activeTab === "gallery" && (
        <div
          className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 rounded-lg border border-warm/20 bg-[#0a0908]/90 px-3 py-2 shadow-2xl backdrop-blur-xl animate-fade-in-up"
          role="region"
          aria-label="快捷操作提示"
        >
          <span className="text-[10px] text-warm-primary/70">轻触切换空间</span>
          <button
            type="button"
            onClick={() => {
              if (!space.isOpen) void setSpaceOpen(true);
              setActiveTab("media");
            }}
            className="h-6 w-6 rounded-full border border-warm/30 bg-black/40 flex items-center justify-center text-[10px] text-warm-primary hover:bg-warm/20"
            aria-label="打开媒体空间"
          >
            <Disc3 size={10} />
          </button>
          <button
            type="button"
            onClick={() => {
              const hasEnabled = widgets.order.some(
                (id) => widgets.items[id]?.enabled,
              );
              if (!hasEnabled) {
                // 启用时钟组件作为示例
                void setWidgetEnabled("clock", true);
              }
              setActiveTab("widgets");
            }}
            className="h-6 w-6 rounded-full border border-warm/30 bg-black/40 flex items-center justify-center text-[10px] text-warm-primary hover:bg-warm/20"
            aria-label="打开组件面板"
          >
            <Smartphone size={10} />
          </button>
        </div>
      )}
    </nav>
  );
}

/**
 * 安全区内嵌注入器：在 HTML 根元素上设置 --safe-area-inset-* CSS 变量，
 * 供移动端底部导航和媒体空间使用。
 */
export function SafeAreaInsets() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const update = () => {
      const style = getComputedStyle(root);
      // 确保变量可用（iOS Safari 需要 env()，此处做 JS 兜底）
      if (!style.getPropertyValue("--safe-area-inset-bottom")) {
        root.style.setProperty(
          "--safe-area-inset-bottom",
          `env(safe-area-inset-bottom, 0px)`,
        );
      }
      root.style.setProperty(
        "--safe-area-inset-top",
        `env(safe-area-inset-top, 0px)`,
      );
      root.style.setProperty(
        "--safe-area-inset-left",
        `env(safe-area-inset-left, 0px)`,
      );
      root.style.setProperty(
        "--safe-area-inset-right",
        `env(safe-area-inset-right, 0px)`,
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return null;
}
