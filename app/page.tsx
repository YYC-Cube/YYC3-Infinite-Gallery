/**
 * @file 主页组件 - 温润艺术风全功能版
 * @description 集成自定义配置系统的3D画廊主页
 * @author YYC³
 * @version 3.1.0 (智能推荐 + 国际化 + AI 标注)
 * @created 2025-09-15
 * @updated 2026-11-20
 */
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Settings, Sparkles } from "lucide-react";
import InfiniteGallery from "@/components/InfiniteGallery";
import ConfigPanel from "@/components/ConfigPanel";
import MediaSpace from "@/components/media-space/MediaSpace";
import PWAProvider from "@/components/PWAProvider";
import WidgetLayer from "@/components/widgets/WidgetLayer";
import ThemeVersionProvider from "@/components/ThemeVersionProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import XREntry from "@/components/XREntry";
import { syncDocumentLang, t, useLocale } from "@/lib/i18n";
import {
  annotate,
  getAnnotation,
  type ImageAnnotation,
} from "@/lib/annotation-store";
import type { GalleryConfig } from "@/lib/config-store";
import { GALLERY_IMAGES } from "@/lib/media-store";
import {
  getRecommendationSnapshot,
  recordExposure,
  recordInteraction,
  recommendOrder,
} from "@/lib/recommendation-store";
import {
  DEFAULT_CONFIG,
  loadConfig,
  loadConfigFromHost,
  hydrateBackgrounds,
  applyConfigToDOM,
} from "@/lib/config-store";

export default function Home() {
  const [config, setConfig] = useState<GalleryConfig>(DEFAULT_CONFIG);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [focusAnnotation, setFocusAnnotation] =
    useState<ImageAnnotation | null>(null);
  const locale = useLocale();
  const focusRef = useRef<{ src: string; since: number } | null>(null);

  // 服务端与首次水合使用固定顺序，挂载后再按历史偏好排序一次
  const baseImages = useMemo(
    () =>
      GALLERY_IMAGES.map((src, index) => ({
        src,
        alt: `音乐影像作品 ${index + 1}`,
      })),
    [],
  );
  const [orderedImages, setOrderedImages] = useState(baseImages);

  useEffect(() => {
    const snapshot = getRecommendationSnapshot();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载后从本地推荐快照排序一次
    setOrderedImages(
      recommendOrder(baseImages, snapshot.affinity, snapshot.enabled),
    );
  }, [baseImages]);

  useEffect(() => {
    const savedConfig = loadConfig();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载后从 localStorage/宿主恢复配置
    setConfig(savedConfig);
    applyConfigToDOM(savedConfig);

    void hydrateBackgrounds(savedConfig).then((hydrated) => {
      if (
        hydrated.backgroundImage !== savedConfig.backgroundImage ||
        hydrated.playerBackgroundImage !== savedConfig.playerBackgroundImage
      ) {
        setConfig(hydrated);
      }
    });

    void loadConfigFromHost().then(async (remoteConfig) => {
      if (!remoteConfig) return;
      const hydrated = await hydrateBackgrounds(remoteConfig);
      setConfig(hydrated);
      applyConfigToDOM(hydrated);
    });
  }, []);

  const handleConfigChange = useCallback((newConfig: GalleryConfig) => {
    setConfig(newConfig);
  }, []);

  // 焦点变化：结算上一张曝光时长，记录新焦点（推荐数据只采集不触发重排）
  const handleFocusImage = useCallback(
    (imageIndex: number) => {
      const now = Date.now();
      if (focusRef.current) {
        recordExposure(focusRef.current.src, now - focusRef.current.since);
      }
      const src = orderedImages[imageIndex]?.src;
      if (src) {
        focusRef.current = { src, since: now };
        recordInteraction(src);
        const cached = getAnnotation(src);
        if (cached) {
          setFocusAnnotation(cached);
        } else {
          void annotate(src, src).then(setFocusAnnotation);
        }
      }
    },
    [orderedImages],
  );

  useEffect(() => {
    return () => {
      if (focusRef.current) {
        recordExposure(
          focusRef.current.src,
          Date.now() - focusRef.current.since,
        );
      }
    };
  }, []);

  // 移动端底部导航的「设计」标签通过事件打开设置面板
  useEffect(() => {
    const openDesignPanel = () => setIsPanelOpen(true);
    window.addEventListener("yyc3:open-design-panel", openDesignPanel);
    return () =>
      window.removeEventListener("yyc3:open-design-panel", openDesignPanel);
  }, []);

  // 语言切换统一在设置面板内，页面只负责同步 <html lang>
  useEffect(() => {
    syncDocumentLang();
  }, [locale]);

  return (
    <main className="min-h-screen relative">
      <ThemeVersionProvider />
      <PWAProvider />
      <PerformanceMonitor />
      <XREntry />
      <MobileBottomNav />
      {/* 自定义背景层 */}
      {config.backgroundImage && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${config.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: config.backgroundPosition,
            backgroundRepeat: "no-repeat",
            opacity: config.backgroundOpacity,
            filter: `blur(${config.backgroundBlur}px)`,
          }}
        />
      )}

      <InfiniteGallery
        images={orderedImages}
        speed={1.2}
        zSpacing={3}
        visibleCount={12}
        falloff={{ near: 0.8, far: 14 }}
        onFocusImage={handleFocusImage}
        className="h-screen w-full rounded-lg overflow-hidden relative z-10"
      />

      {/* AI 内容标注：当前焦点作品标签 */}
      {focusAnnotation && (
        <div className="fixed left-5 top-6 z-[9997] max-w-[220px] rounded-xl border border-warm/20 bg-[#0a0908]/75 px-3 py-2 shadow-xl backdrop-blur-xl sm:left-6">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles size={11} className="text-warm-primary" />
            <span className="text-[9px] font-mono tracking-widest text-warm-primary/70">
              AI TAGS · {focusAnnotation.source === "local" ? "LOCAL" : "AI"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {focusAnnotation.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-warm/20 bg-warm/10 px-2 py-0.5 text-[9px] text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
			    高级感页脚系统 (完全可配置)
			   ======================================== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          paddingBottom: `${config.footerPaddingY * 4}px`,
        }}
      >
        {/* 背景渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* 光晕效果 - 可开关 */}
        {config.enableGlowEffect && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 
                                   w-96 h-32 bg-gradient-radial 
                                   from-white/10 via-white/5 to-transparent 
                                   rounded-full blur-2xl animate-aura"
            style={{ animationDelay: "0.5s" }}
          />
        )}

        {/* SVG 分隔线 */}
        <div className="relative flex justify-center pt-6">
          <svg
            className="h-px opacity-40 animate-draw"
            viewBox="0 0 200 1"
            preserveAspectRatio="none"
            style={{
              width: `${config.separatorWidth * 4}px`,
              animationDelay: "1s",
            }}
          >
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop
                  offset="50%"
                  stopColor={`rgba(212, 165, 116, ${config.textOpacity})`}
                />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="0"
              x2="200"
              y2="0"
              stroke="url(#lineGradient)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* 主标语区域 - 完全可配置 */}
        <div className="relative px-4 pt-4 sm:pt-6">
          <p
            className="
							font-[family-name:var(--font-cormorant)]
							font-light italic
							text-center
							animate-reveal
							text-shadow-elegant
							gpu-accelerated
						"
            style={{
              fontSize:
                config.fontSize === "xs"
                  ? "0.75rem"
                  : config.fontSize === "sm"
                    ? "0.875rem"
                    : config.fontSize === "base"
                      ? "1rem"
                      : config.fontSize === "lg"
                        ? "1.125rem"
                        : "1.25rem",
              fontWeight:
                config.fontWeight === "light"
                  ? 300
                  : config.fontWeight === "normal"
                    ? 400
                    : 500,
              letterSpacing: `${config.letterSpacing}em`,
              color: `rgba(245, 240, 232, ${config.textOpacity})`,
              lineHeight: config.lineHeight,
              animationDelay: `${config.revealDelay}s`,
            }}
          >
            <span className="inline-block animate-float">
              {config.brandLine1.trim() || t("brand.line1", locale)}
            </span>
            <span
              className="mx-2 sm:mx-3 md:mx-4 font-light"
              style={{
                color: `rgba(245, 240, 232, ${config.textOpacity * 0.37})`,
                opacity: 0.5,
              }}
            >
              |
            </span>
            <span
              className="inline-block animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              {config.brandLine2.trim() || t("brand.line2", locale)}
            </span>
          </p>

          {/* 移动端操作提示 - 可开关 */}
          {config.showMobileHint && (
            <div className="md:hidden mt-6 flex justify-center items-center gap-2 text-white/30">
              <svg
                className="w-4 h-4 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span className="text-[10px] tracking-widest uppercase font-mono">
                {t("hint.scroll", locale)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================
			    配置面板触发按钮 (悬浮)
			   ======================================== */}
      <button
        onClick={() => setIsPanelOpen(true)}
        className="
					fixed bottom-24 right-6 z-[9997]
					h-11 rounded-full px-3.5
					glass-effect
					flex items-center gap-1.5
					text-white/70 hover:text-white
					transition-all duration-300
					hover:scale-105 hover:shadow-lg
					group
					animate-pulse-glow
				"
        aria-label="打开设置"
        title="设置 · 主题与页面配置"
      >
        <Settings
          size={16}
          className="transition-transform duration-500 group-hover:rotate-90"
        />
        <span className="text-[10px] font-mono tracking-widest">设置</span>
      </button>

      {/* 可启用、拖拽、缩放和迷你化的页面组件 */}
      <WidgetLayer />

      {/* 配置面板 */}
      <ConfigPanel
        config={config}
        onConfigChange={handleConfigChange}
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(false)}
      />

      {/* 自主媒体空间：统一界面 / 独立窗口 / 多视频实例 */}
      <MediaSpace config={config} />
    </main>
  );
}
