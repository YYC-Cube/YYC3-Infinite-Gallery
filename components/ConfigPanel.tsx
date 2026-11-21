"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Languages,
  LayoutGrid,
  Minus,
  Palette,
  Puzzle,
  Type,
} from "lucide-react";
import WidgetSettings from "@/components/widgets/WidgetSettings";
import { removeBackgroundAsset, storeBackgroundAsset } from "@/lib/asset-store";
import type { GalleryConfig } from "@/lib/config-store";
import { saveConfig, applyConfigToDOM } from "@/lib/config-store";
import {
  getThemeDefinition,
  resetBreakpoint,
  setBreakpoint,
  setLayout,
  setReducedMotion,
  setTheme,
  THEME_DEFINITIONS,
  useVersion,
  type BreakpointVersion,
  type LayoutVersion,
} from "@/lib/version-store";
import { LOCALES, setLocale, t, useLocale } from "@/lib/i18n";

const AMBIENT_KEYS = [
  "ambientTopColor",
  "ambientLeftColor",
  "ambientRightColor",
  "ambientCenterColor",
] as const;

type SettingsTab = "theme" | "appearance" | "text" | "widgets" | "language";

const SETTINGS_TABS: {
  id: SettingsTab;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: "theme", label: "主题", Icon: Palette },
  { id: "appearance", label: "外观", Icon: ImageIcon },
  { id: "text", label: "文字", Icon: Type },
  { id: "widgets", label: "组件", Icon: Puzzle },
  { id: "language", label: "语言", Icon: Languages },
];

interface ConfigPanelProps {
  config: GalleryConfig;
  onConfigChange: (config: GalleryConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConfigPanel({
  config,
  onConfigChange,
  isOpen,
  onToggle,
}: ConfigPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerFileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onToggleRef = useRef(onToggle);
  const [uploadError, setUploadError] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("theme");
  const version = useVersion();
  const locale = useLocale();
  const themeDefinition = getThemeDefinition(version.theme);
  const overrides = config.visualOverrides;

  // 显示值：未覆盖时展示当前主题色，避免面板与页面实际效果不一致
  const themeGlow = Number(themeDefinition.colors["--glow-intensity"]);
  const displayGlow =
    overrides.glow || !Number.isFinite(themeGlow)
      ? config.glowIntensity
      : themeGlow;
  const displayWarmPrimary = overrides.warmPrimary
    ? config.warmPrimaryColor
    : (themeDefinition.colors["--warm-primary"] ?? config.warmPrimaryColor);
  const displayAmbient = (key: string, fallback: string) =>
    overrides.ambient
      ? fallback
      : (themeDefinition.colors[key] ?? fallback);
  const displayBorder = overrides.border
    ? config.borderChroma
    : (themeDefinition.colors["--border-chroma"] ?? config.borderChroma);

  useEffect(() => {
    applyConfigToDOM(config);
  }, [config]);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  // 对话框语义：Esc 关闭、焦点陷阱、打开时锁定页面滚动并聚焦首个控件
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

    const first = getFocusable()[0];
    (first ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onToggleRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (!firstItem || !lastItem) return;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isOpen]);

  const updateConfig = useCallback(
    (partial: Partial<GalleryConfig>) => {
      const nextOverrides = partial.visualOverrides
        ? partial.visualOverrides
        : { ...config.visualOverrides };

      // 用户一旦修改配色/光效，即视为显式覆盖主题
      if (!partial.visualOverrides) {
        if ("warmPrimaryColor" in partial) nextOverrides.warmPrimary = true;
        if (AMBIENT_KEYS.some((key) => key in partial)) {
          nextOverrides.ambient = true;
        }
        if ("glowIntensity" in partial) nextOverrides.glow = true;
        if ("borderChroma" in partial) nextOverrides.border = true;
      }

      const newConfig: GalleryConfig = {
        ...config,
        ...partial,
        visualOverrides: nextOverrides,
      };
      onConfigChange(newConfig);
      saveConfig(newConfig);
    },
    [config, onConfigChange],
  );

  const followCurrentTheme = useCallback(() => {
    const definition = getThemeDefinition(version.theme);
    const glow = Number(definition.colors["--glow-intensity"]);
    const next: GalleryConfig = {
      ...config,
      warmPrimaryColor:
        definition.colors["--warm-primary"] ?? config.warmPrimaryColor,
      ambientTopColor:
        definition.colors["--ambient-top"] ?? config.ambientTopColor,
      ambientLeftColor:
        definition.colors["--ambient-left"] ?? config.ambientLeftColor,
      ambientRightColor:
        definition.colors["--ambient-right"] ?? config.ambientRightColor,
      ambientCenterColor:
        definition.colors["--ambient-center"] ?? config.ambientCenterColor,
      glowIntensity: Number.isFinite(glow) ? glow : config.glowIntensity,
      borderChroma:
        definition.colors["--border-chroma"] ?? config.borderChroma,
      visualOverrides: {
        warmPrimary: false,
        ambient: false,
        glow: false,
        border: false,
      },
    };
    onConfigChange(next);
    saveConfig(next);
  }, [config, onConfigChange, version.theme]);

  const readImage = useCallback(
    async (
      file: File | undefined,
      key: "backgroundImage" | "playerBackgroundImage",
    ) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setUploadError("请选择 JPG、PNG 或 WebP 图片");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("图片不能超过 5MB");
        return;
      }
      setUploadError("");
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const previousId =
        key === "playerBackgroundImage"
          ? config.playerBackgroundAssetId
          : config.backgroundAssetId;
      const assetId = await storeBackgroundAsset(file);
      if (!assetId) {
        setUploadError("背景图保存失败，请换一张更小的图片后重试");
        return;
      }
      if (key === "playerBackgroundImage") {
        updateConfig({
          playerBackgroundAssetId: assetId,
          playerBackgroundImage: preview,
        });
      } else {
        updateConfig({
          backgroundAssetId: assetId,
          backgroundImage: preview,
        });
      }
      if (previousId && previousId !== assetId) {
        void removeBackgroundAsset(previousId);
      }
    },
    [config.backgroundAssetId, config.playerBackgroundAssetId, updateConfig],
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      readImage(event.target.files?.[0], "backgroundImage");
      event.target.value = "";
    },
    [readImage],
  );

  const handlePlayerImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      readImage(event.target.files?.[0], "playerBackgroundImage");
      event.target.value = "";
    },
    [readImage],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        aria-hidden
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onToggle}
      />

      {/* 配置面板主体 */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-studio-title"
        tabIndex={-1}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md 
                          bg-[#0a0908]/95 config-panel-backdrop z-[9999] 
                          overflow-y-auto border-l border-warm/20
                          shadow-2xl animate-fade-in-up outline-none"
      >
        {/* 头部 */}
        <div
          className="sticky top-0 bg-[#0a0908]/90 backdrop-blur-xl 
                            p-6 border-b border-warm/10 z-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="design-studio-title"
              className="font-[family-name:var(--font-cormorant)] 
                                     text-xl italic text-gradient font-light"
            >
              Design Studio
            </h2>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full glass-effect 
                                       flex items-center justify-center
                                       text-white/60 hover:text-white transition-colors"
              aria-label="收起设置面板"
              title="收起设置"
            >
              <Minus size={14} />
            </button>
          </div>
          <p className="text-xs text-white/40 tracking-wider">
            {themeDefinition.name} · 设置与主题工作台
          </p>

          <div
            role="tablist"
            aria-label="设置分类"
            className="mt-4 flex gap-1 overflow-x-auto"
          >
            {SETTINGS_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] transition-colors ${
                  activeTab === id
                    ? "border-warm/40 bg-warm/20 text-warm-primary"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-8" data-settings-tab={activeTab}>
          {/* ========================================
					    0. 主题系统
					   ======================================== */}
          <section data-section="theme">
            <h3 className="text-sm font-mono tracking-[0.2em] text-warm-primary mb-4 uppercase">
              Theme System
            </h3>

            <div
              className="mb-4 overflow-hidden rounded-2xl border border-warm/20"
              style={{ background: themeDefinition.colors["--background"] }}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <span
                  className="font-[family-name:var(--font-cormorant)] text-sm italic"
                  style={{ color: themeDefinition.colors["--foreground"] }}
                >
                  言启象限 · 语枢未来
                </span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: themeDefinition.colors["--warm-primary"],
                  }}
                />
              </div>
              <div className="mt-3 flex gap-1.5 px-4">
                {["--warm-primary", "--warm-secondary", "--warm-accent"].map(
                  (key) => (
                    <span
                      key={key}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: themeDefinition.colors[key] }}
                    />
                  ),
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 px-4 py-3">
                <span
                  className="text-[9px] font-mono tracking-widest"
                  style={{ color: themeDefinition.colors["--text-muted"] }}
                >
                  {themeDefinition.id.toUpperCase()}
                </span>
                <span
                  className="text-[9px] font-mono"
                  style={{ color: themeDefinition.colors["--warm-primary"] }}
                >
                  LIVE PREVIEW
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {THEME_DEFINITIONS.map((theme) => {
                const active = version.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTheme(theme.id)}
                    aria-label={`切换到 ${theme.name}`}
                    aria-pressed={active}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      active
                        ? "border-warm/50 bg-warm/15"
                        : "border-warm/15 bg-black/20 hover:border-warm/30"
                    }`}
                  >
                    <div className="flex gap-1">
                      <span
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ background: theme.colors["--warm-primary"] }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ background: theme.colors["--warm-accent"] }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ background: theme.colors["--background"] }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-white/75">{theme.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[8px] leading-relaxed text-white/35">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center gap-2">
                <LayoutGrid size={12} className="text-warm-primary/50" />
                <span className="text-[10px] text-white/60">布局模式</span>
              </div>
              <div className="flex gap-1.5">
                {(["split", "unified"] as LayoutVersion[]).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setLayout(layout)}
                    title={
                      layout === "split" ? "独立窗口布局" : "统一界面布局"
                    }
                    className={`flex-1 rounded-lg border py-1.5 text-[10px] font-mono transition-all ${
                      version.layout === layout
                        ? "border-warm/40 bg-warm/20 text-warm-primary"
                        : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
                    }`}
                  >
                    {layout === "split" ? "拆分" : "统一"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Type size={12} className="text-warm-primary/50" />
                <span className="text-[10px] text-white/60">断点版本</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={resetBreakpoint}
                  aria-label="自动断点模式"
                  className={`flex-1 rounded-lg border py-1.5 text-[10px] font-mono transition-all ${
                    !version.breakpointOverride
                      ? "border-warm/40 bg-warm/20 text-warm-primary"
                      : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
                  }`}
                >
                  自动
                </button>
                {(
                  [
                    { id: "desktop", label: "桌面" },
                    { id: "tablet", label: "平板" },
                    { id: "mobile", label: "移动" },
                  ] as { id: BreakpointVersion; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBreakpoint(item.id)}
                    title={`${item.label}版`}
                    className={`flex-1 rounded-lg border py-1.5 text-[10px] font-mono transition-all ${
                      version.breakpointOverride &&
                      version.breakpoint === item.id
                        ? "border-warm/40 bg-warm/20 text-warm-primary"
                        : "border-warm/15 bg-black/30 text-white/40 hover:border-warm/30"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <ToggleControl
                label="减少动效"
                enabled={version.reducedMotion}
                onToggle={setReducedMotion}
              />
            </div>
          </section>

          {/* ========================================
					    1. 背景素材上传
					   ======================================== */}
          <section data-section="appearance">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Background Material
            </h3>

            {/* 上传按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="上传页面背景图"
              className="block w-full border-2 border-dashed border-warm/30 rounded-xl p-8 
                                   text-center cursor-pointer hover:border-warm/50 
                                   transition-all duration-300 group
                                   bg-warm/5 hover:bg-warm/10"
            >
              {config.backgroundImage ? (
                <div className="space-y-3">
                  <img
                    src={config.backgroundImage}
                    alt="自定义背景预览"
                    className="max-h-32 mx-auto rounded-lg object-cover opacity-80"
                  />
                  <p
                    className="text-xs text-white/50 group-hover:text-white/70 
                                                 transition-colors"
                  >
                    点击更换背景图
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 mx-auto rounded-full 
                                                bg-warm/10 flex items-center justify-center
                                                group-hover:bg-warm/20 transition-colors"
                  >
                    <span className="text-2xl">📁</span>
                  </div>
                  <p
                    className="text-sm text-white/60 group-hover:text-white/80 
                                                 transition-colors"
                  >
                    点击上传背景素材
                  </p>
                  <p className="text-xs text-white/30">
                    支持 JPG / PNG / WebP · 最大 5MB
                  </p>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* 背景参数 */}
            {config.backgroundImage && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-warm/20">
                <SliderControl
                  label="透明度"
                  value={config.backgroundOpacity}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onChange={(v) => updateConfig({ backgroundOpacity: v })}
                />
                <SliderControl
                  label="模糊度"
                  value={config.backgroundBlur}
                  min={0}
                  max={20}
                  step={1}
                  unit="px"
                  onChange={(v) => updateConfig({ backgroundBlur: v })}
                />
                <SelectControl
                  label="位置"
                  value={config.backgroundPosition}
                  options={[
                    { value: "center", label: "居中" },
                    { value: "top", label: "顶部" },
                    { value: "bottom", label: "底部" },
                  ]}
                  onChange={(v) => updateConfig({ backgroundPosition: v })}
                />
                <button
                  onClick={() => {
                    const assetId = config.backgroundAssetId;
                    updateConfig({
                      backgroundImage: null,
                      backgroundAssetId: null,
                    });
                    if (assetId) void removeBackgroundAsset(assetId);
                  }}
                  className="text-xs text-red-400/70 hover:text-red-400 
                                               transition-colors mt-2"
                >
                  移除背景图
                </button>
              </div>
            )}
          </section>

          {/* ========================================
					    2. 媒体空间背景
					   ======================================== */}
          <section data-section="appearance">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Media Space Canvas
            </h3>

            <button
              type="button"
              onClick={() => playerFileInputRef.current?.click()}
              aria-label="上传媒体空间背景图"
              className="block w-full border border-warm/20 rounded-xl p-4 cursor-pointer 
                                   hover:border-warm/40 transition-all duration-300
                                   bg-black/20 hover:bg-warm/5"
            >
              {config.playerBackgroundImage ? (
                <div className="space-y-2">
                  <img
                    src={config.playerBackgroundImage}
                    alt="媒体空间背景预览"
                    className="h-24 w-full mx-auto rounded-lg object-cover opacity-80"
                  />
                  <p className="text-xs text-white/50">点击更换媒体空间背景</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warm/10 text-lg">
                    ◫
                  </span>
                  <div>
                    <p className="text-sm text-white/60">上传播放器容器背景</p>
                    <p className="text-[10px] text-white/30">
                      支持独立继承或覆盖页面背景 · 最大 5MB
                    </p>
                  </div>
                </div>
              )}
            </button>
            <input
              ref={playerFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePlayerImageUpload}
              className="hidden"
            />

            {uploadError && (
              <p role="alert" className="text-[10px] text-red-300/80 mt-2">
                {uploadError}
              </p>
            )}

            {config.playerBackgroundImage && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-warm/20">
                <SliderControl
                  label="容器背景透明度"
                  value={config.playerBackgroundOpacity}
                  min={0.05}
                  max={0.85}
                  step={0.05}
                  onChange={(v) => updateConfig({ playerBackgroundOpacity: v })}
                />
                <SliderControl
                  label="容器背景模糊"
                  value={config.playerBackgroundBlur}
                  min={0}
                  max={16}
                  step={1}
                  unit="px"
                  onChange={(v) => updateConfig({ playerBackgroundBlur: v })}
                />
                <button
                  onClick={() => {
                    const assetId = config.playerBackgroundAssetId;
                    updateConfig({
                      playerBackgroundAssetId: null,
                      playerBackgroundImage: null,
                    });
                    if (assetId) void removeBackgroundAsset(assetId);
                  }}
                  className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                >
                  恢复继承页面背景
                </button>
              </div>
            )}
          </section>

          {/* ========================================
					    3. 视觉风格
					   ======================================== */}
          <section data-section="appearance">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Visual Style
            </h3>

            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-warm/15 bg-black/20 px-3 py-2">
              <span className="text-[10px] text-white/45">
                {overrides.warmPrimary ||
                overrides.ambient ||
                overrides.glow ||
                overrides.border
                  ? "当前：自定义视觉参数"
                  : "当前：跟随主题配色"}
              </span>
              <button
                type="button"
                onClick={followCurrentTheme}
                className="rounded-full border border-warm/30 px-2.5 py-1 text-[10px] text-warm-primary transition-colors hover:bg-warm/10"
              >
                跟随当前主题
              </button>
            </div>

            <div className="space-y-4">
              <SliderControl
                label="光效强度"
                value={displayGlow}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => updateConfig({ glowIntensity: v })}
              />

              <SliderControl
                label="光效扩散范围"
                value={config.glowRadius}
                min={20}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => updateConfig({ glowRadius: v })}
              />

              <ColorPickerControl
                label="顶部光晕色"
                value={displayAmbient("--ambient-top", config.ambientTopColor)}
                onChange={(v) => updateConfig({ ambientTopColor: v })}
              />

              <ColorPickerControl
                label="左侧光晕色"
                value={displayAmbient("--ambient-left", config.ambientLeftColor)}
                onChange={(v) => updateConfig({ ambientLeftColor: v })}
              />

              <ColorPickerControl
                label="右侧光晕色"
                value={displayAmbient("--ambient-right", config.ambientRightColor)}
                onChange={(v) => updateConfig({ ambientRightColor: v })}
              />

              <ColorPickerControl
                label="中心光晕色"
                value={displayAmbient(
                  "--ambient-center",
                  config.ambientCenterColor,
                )}
                onChange={(v) => updateConfig({ ambientCenterColor: v })}
              />

              <ColorPickerControl
                label="主色调"
                value={displayWarmPrimary}
                onChange={(v) => updateConfig({ warmPrimaryColor: v })}
              />

              <BorderChromaControl
                value={displayBorder}
                onChange={(v) => updateConfig({ borderChroma: v })}
              />

              <SliderControl
                label="容器磨砂模糊"
                value={config.glassBlur}
                min={0}
                max={40}
                step={2}
                unit="px"
                onChange={(v) => updateConfig({ glassBlur: v })}
              />

              <ToggleControl
                label="启用光效"
                enabled={config.enableGlowEffect}
                onToggle={(v) => updateConfig({ enableGlowEffect: v })}
              />
            </div>
          </section>

          {/* ========================================
					    3. 排版细节
					   ======================================== */}
          <section data-section="text">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Typography
            </h3>

            <div className="mb-4 space-y-3 rounded-xl border border-warm/15 bg-black/20 p-3">
              <p className="text-[10px] font-mono tracking-widest text-white/45">
                BRAND TEXT
              </p>
              <label className="block">
                <span className="mb-1 block text-[10px] text-white/40">
                  主标语
                </span>
                <input
                  type="text"
                  value={config.brandLine1}
                  onChange={(event) =>
                    updateConfig({ brandLine1: event.target.value })
                  }
                  maxLength={50}
                  placeholder={t("brand.line1", locale)}
                  className="w-full rounded-lg border border-warm/20 bg-black/25 px-3 py-2 text-xs text-white/75 outline-none transition-colors placeholder:text-white/20 focus:border-warm/50"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] text-white/40">
                  副标语
                </span>
                <input
                  type="text"
                  value={config.brandLine2}
                  onChange={(event) =>
                    updateConfig({ brandLine2: event.target.value })
                  }
                  maxLength={100}
                  placeholder={t("brand.line2", locale)}
                  className="w-full rounded-lg border border-warm/20 bg-black/25 px-3 py-2 text-xs text-white/75 outline-none transition-colors placeholder:text-white/20 focus:border-warm/50"
                />
              </label>
              <p className="text-[9px] text-white/25">
                留空时跟随当前语言文案，修改后立即应用到页面页脚。
              </p>
            </div>

            <div className="space-y-4">
              <SelectControl
                label="字号"
                value={config.fontSize}
                options={[
                  { value: "xs", label: "超小" },
                  { value: "sm", label: "小" },
                  { value: "base", label: "标准" },
                  { value: "lg", label: "大" },
                  { value: "xl", label: "特大" },
                ]}
                onChange={(v) => updateConfig({ fontSize: v })}
              />

              <SelectControl
                label="字重"
                value={config.fontWeight}
                options={[
                  { value: "light", label: "细体" },
                  { value: "normal", label: "常规" },
                  { value: "medium", label: "中等" },
                ]}
                onChange={(v) => updateConfig({ fontWeight: v })}
              />

              <SliderControl
                label="字距"
                value={config.letterSpacing}
                min={0.1}
                max={1}
                step={0.05}
                unit="em"
                onChange={(v) => updateConfig({ letterSpacing: v })}
              />

              <SliderControl
                label="文字透明度"
                value={config.textOpacity}
                min={0.3}
                max={1}
                step={0.05}
                onChange={(v) => updateConfig({ textOpacity: v })}
              />
            </div>
          </section>

          {/* ========================================
					    4. 动效参数
					   ======================================== */}
          <section data-section="text">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Animation
            </h3>

            <div className="space-y-4">
              <SliderControl
                label="显现时长"
                value={config.revealDuration}
                min={0.3}
                max={3}
                step={0.1}
                unit="s"
                onChange={(v) => updateConfig({ revealDuration: v })}
              />

              <SliderControl
                label="显现延迟"
                value={config.revealDelay}
                min={0}
                max={3}
                step={0.1}
                unit="s"
                onChange={(v) => updateConfig({ revealDelay: v })}
              />

              <SliderControl
                label="浮动周期"
                value={config.floatDuration}
                min={2}
                max={12}
                step={0.5}
                unit="s"
                onChange={(v) => updateConfig({ floatDuration: v })}
              />

              <SliderControl
                label="浮动距离"
                value={Math.abs(config.floatDistance)}
                min={0}
                max={30}
                step={1}
                unit="px"
                onChange={(v) =>
                  updateConfig({
                    floatDistance: -v,
                  })
                }
              />

              <SliderControl
                label="呼吸周期"
                value={config.breatheDuration}
                min={2}
                max={8}
                step={0.5}
                unit="s"
                onChange={(v) => updateConfig({ breatheDuration: v })}
              />
            </div>
          </section>

          {/* ========================================
					    5. 布局结构
					   ======================================== */}
          <section data-section="text">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Layout
            </h3>

            <div className="space-y-4">
              <SliderControl
                label="底部内边距"
                value={config.footerPaddingY}
                min={6}
                max={24}
                step={2}
                unit=""
                onChange={(v) => updateConfig({ footerPaddingY: v })}
              />

              <SliderControl
                label="分隔线宽度"
                value={config.separatorWidth}
                min={32}
                max={96}
                step={8}
                unit=""
                onChange={(v) => updateConfig({ separatorWidth: v })}
              />

              <ToggleControl
                label="显示移动端提示"
                enabled={config.showMobileHint}
                onToggle={(v) => updateConfig({ showMobileHint: v })}
              />
            </div>
          </section>

          {/* ========================================
					    6. 页面小组件
					   ======================================== */}
          <section data-section="widgets">
            <h3
              className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase"
            >
              Page Widgets
            </h3>
            <WidgetSettings />
          </section>

          {/* ========================================
					    7. 语言
					   ======================================== */}
          <section data-section="language">
            <h3 className="text-sm font-mono tracking-[0.2em] text-warm-primary mb-4 uppercase">
              Language
            </h3>
            <p className="mb-3 text-[10px] leading-relaxed text-white/35">
              仅影响界面文案与品牌标语回退内容，不改变作品与本地媒体数据。
            </p>
            <div className="grid grid-cols-3 gap-2">
              {LOCALES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocale(item.id)}
                  aria-label={`切换到 ${item.native}`}
                  aria-pressed={locale === item.id}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-all ${
                    locale === item.id
                      ? "border-warm/40 bg-warm/20 text-warm-primary"
                      : "border-warm/15 bg-black/20 text-white/55 hover:border-warm/30"
                  }`}
                >
                  <span className="block text-xs">{item.label}</span>
                  <span className="mt-0.5 block text-[9px] text-white/30">
                    {item.native}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <p className="text-xs text-center text-white/20 pt-2">
            所有更改自动保存到本地存储
          </p>
        </div>
      </div>
    </>
  );
}

/* 子组件：滑块控制器 */
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-mono text-warm-primary/80 tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full config-slider"
      />
    </div>
  );
}

/* 子组件：颜色选择器 */
function ColorPickerControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("rgba") ? "#d4a574" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs font-mono text-white/30 max-w-[120px] truncate">
          {value.length > 20 ? value.slice(0, 18) + "..." : value}
        </span>
      </div>
    </div>
  );
}

/* 子组件：容器边线色度（hex ↔ "r g b" 互转，统一驱动所有 border-warm/*） */
function BorderChromaControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const toHex = (channels: string) => {
    const parts = channels.trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
      return "#d4a574";
    }
    return `#${parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
  };
  const fromHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/50">容器边线色度</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(fromHex(e.target.value))}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          aria-label="容器边线色度"
        />
        <span className="text-xs font-mono text-white/30">{value}</span>
      </div>
    </div>
  );
}

/* 子组件：下拉选择器 */
function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-warm/20 rounded-lg px-3 py-1.5 
                         text-xs text-white/70 focus:border-warm/40 
                         outline-none cursor-pointer transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a0908]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* 子组件：开关切换器 */
function ToggleControl({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
          enabled ? "bg-warm-primary/60" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full 
                             bg-white shadow-md transition-transform duration-300 ${
                               enabled ? "translate-x-5" : ""
                             }`}
        />
      </button>
    </div>
  );
}
