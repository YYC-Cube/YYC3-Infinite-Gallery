/**
 * @file 移动端底部导航
 * @description 移动端安全区适配、底部导航栏与触摸手势增强
 * @author YYC³
 * @version 1.2.0
 * @created 2026-11-20
 * @updated 2026-11-26
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Disc3,
  Settings,
  Smartphone,
} from "lucide-react";
import { setSpaceOpen, useMediaSpace } from "@/lib/media-space/store";
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

interface MobileBottomNavProps {
  /** 设计面板等全屏浮层打开时隐藏导航，避免遮挡浮层底部内容 */
  hidden?: boolean;
}

export default function MobileBottomNav({ hidden = false }: MobileBottomNavProps) {
  const widgets = useWidgets();
  const space = useMediaSpace();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<MobileTab>("gallery");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleTabPress = useCallback(
    (tab: MobileTab) => {
      setActiveTab(tab);
      if (tab === "gallery") {
        // 回到画廊：收起媒体空间，露出 3D 画布
        setSpaceOpen(false);
      } else if (tab === "media") {
        setSpaceOpen(true);
      } else if (tab === "widgets") {
        // 组件标签：首次进入时启用时钟作为可见示例
        const hasEnabled = Object.values(widgets.items).some(
          (item) => item.enabled,
        );
        if (!hasEnabled) setWidgetEnabled("clock", true);
      } else if (tab === "design") {
        // 设计标签：打开 Design Studio 配置面板
        window.dispatchEvent(new CustomEvent("yyc3:open-design-panel"));
      }
    },
    [widgets.items],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, tab: MobileTab) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTabPress(tab);
      }
    },
    [handleTabPress],
  );

  // 高亮以媒体空间实际开关为准，避免出现「标签在画廊、画面是播放器」的错位
  const selectedTab: MobileTab = space.isOpen
    ? "media"
    : activeTab === "widgets"
      ? "widgets"
      : "gallery";

  // 所有 hooks 调用完毕后才允许条件返回，保证 hooks 调用顺序稳定
  if (!isMobile || hidden) return null;

  return (
    <nav
      role="navigation"
      aria-label="移动端底部导航"
      className="fixed bottom-0 left-0 right-0 z-[10001] flex items-center justify-center gap-1 px-3 sm:px-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <div
        className="flex h-12 w-full max-w-md items-center justify-center rounded-full border border-warm/20 bg-[#0a0908]/85 px-2 shadow-2xl backdrop-blur-xl"
        role="tablist"
        aria-label="标签页导航"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = selectedTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              onClick={() => handleTabPress(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-warm/20 text-warm-primary border border-warm/40"
                  : "text-white/40 hover:text-warm-primary hover:bg-white/5"
              }`}
              aria-label={t(`nav.${tab}`, locale)}
              aria-selected={isActive}
              id={`mobile-tab-${tab}`}
              title={t(`nav.${tab}`, locale)}
            >
              <Icon size={16} />
              <span className="text-[12px] font-mono leading-none">
                {t(`nav.${tab}`, locale)}
              </span>
            </button>
          );
        })}
      </div>
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
