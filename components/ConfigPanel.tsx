"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Copy,
  Download,
  Image as ImageIcon,
  Languages,
  LayoutGrid,
  Minus,
  Palette,
  Puzzle,
  Type,
  Upload,
} from "lucide-react";
import WidgetSettings from "@/components/widgets/WidgetSettings";
import {
  removeBackgroundAsset,
  storeBackgroundAsset,
  storeFontAsset,
  storeLogoAsset,
} from "@/lib/asset-store";
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
  type GalleryTheme,
  type LayoutVersion,
} from "@/lib/version-store";
import {
  applyThemePreset,
  auditThemeContrast,
  buildThemePayload,
  downloadThemePayload,
  evaluateContrast,
  listThemePresets,
  MAX_PRESETS,
  parseThemeImport,
  removeThemePreset,
  saveThemePreset,
  suggestAccessibleColor,
  type ContrastAuditReport,
  type ThemePreset,
} from "@/lib/theme-port";
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
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const themeImportInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onToggleRef = useRef(onToggle);
  const [uploadError, setUploadError] = useState("");
  const [portMessage, setPortMessage] = useState("");
  const [portTone, setPortTone] = useState<"ok" | "error">("ok");
  const [presets, setPresets] = useState<ThemePreset[]>(() =>
    listThemePresets(),
  );
  const [presetName, setPresetName] = useState("");
  const [audit, setAudit] = useState<ContrastAuditReport | null>(null);
  const [oklchInput, setOklchInput] = useState("");
  const [compareThemeId, setCompareThemeId] =
    useState<GalleryTheme>("warm-art");
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
  const compareDefinition =
    THEME_DEFINITIONS.find((item) => item.id === compareThemeId) ??
    themeDefinition;
  const comparePanels = [
    {
      title: "当前生效",
      name: themeDefinition.name,
      background: themeDefinition.colors["--background"] ?? "",
      primary: displayWarmPrimary,
      accent: themeDefinition.colors["--warm-accent"] ?? "",
    },
    {
      title: "对比主题",
      name: compareDefinition.name,
      background: compareDefinition.colors["--background"] ?? "",
      primary: compareDefinition.colors["--warm-primary"] ?? "",
      accent: compareDefinition.colors["--warm-accent"] ?? "",
    },
  ];

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

  const showPortMessage = useCallback((message: string, tone: "ok" | "error") => {
    setPortMessage(message);
    setPortTone(tone);
  }, []);

  const handleLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) {
        setUploadError("Logo 支持 PNG、SVG、JPG 或 WebP");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Logo 不能超过 2MB");
        return;
      }
      setUploadError("");
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      }).catch(() => "");
      if (!preview) {
        setUploadError("Logo 读取失败，请重试");
        return;
      }

      const previousId = config.logoAssetId;
      const assetId = await storeLogoAsset(file);
      if (!assetId) {
        setUploadError("Logo 保存失败，请换一张更小的图片");
        return;
      }
      updateConfig({ logoAssetId: assetId, logoImage: preview });
      if (previousId && previousId !== assetId) {
        void removeBackgroundAsset(previousId);
      }
    },
    [config.logoAssetId, updateConfig],
  );

  const runContrastAudit = () => {
    setAudit(
      auditThemeContrast({
        ...themeDefinition.colors,
        // 审计实际生效的主色（含用户覆盖）
        "--warm-primary": displayWarmPrimary,
      }),
    );
  };

  const handleFontUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
        setUploadError("字体支持 woff2 / woff / ttf / otf");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("字体文件不能超过 5MB");
        return;
      }
      setUploadError("");
      const previousId = config.fontAssetId;
      const assetId = await storeFontAsset(file);
      if (!assetId) {
        setUploadError("字体保存失败，请重试");
        return;
      }
      if (config.fontUrl) URL.revokeObjectURL(config.fontUrl);
      updateConfig({
        fontAssetId: assetId,
        fontName: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "YYC3 Custom",
        fontUrl: URL.createObjectURL(file),
      });
      if (previousId && previousId !== assetId) {
        void removeBackgroundAsset(previousId);
      }
    },
    [config.fontAssetId, config.fontUrl, updateConfig],
  );

  const handleApplyOklch = () => {
    const value = oklchInput.trim();
    if (!value) return;
    const background = themeDefinition.colors["--background"] ?? "";
    const verdict = background ? evaluateContrast(value, background) : null;
    if (!verdict) {
      showPortMessage("OKLch 格式无效，示例：oklch(0.62 0.26 29)", "error");
      return;
    }
    updateConfig({ warmPrimaryColor: value });
    showPortMessage(
      `已应用 OKLch 主色（对比背景 ${verdict.ratio.toFixed(2)}:1）`,
      "ok",
    );
  };

  const handleFixContrast = () => {
    const background = themeDefinition.colors["--background"] ?? "";
    const fixed = suggestAccessibleColor(displayWarmPrimary, background);
    if (!fixed) {
      showPortMessage("无法解析当前主色，请先改为 hex 或 rgb 格式", "error");
      return;
    }
    updateConfig({ warmPrimaryColor: fixed });
    setAudit(
      auditThemeContrast({
        ...themeDefinition.colors,
        "--warm-primary": fixed,
      }),
    );
    showPortMessage(`主色已调整为 ${fixed}（达到正文 AA 4.5:1）`, "ok");
  };

  const handleExportTheme = useCallback(() => {
    const payload = buildThemePayload(config, version.theme);
    if (downloadThemePayload(payload)) {
      showPortMessage("主题方案已导出为 JSON 文件", "ok");
    } else {
      showPortMessage("当前环境不支持文件下载", "error");
    }
  }, [config, showPortMessage, version.theme]);

  const handleCopyTheme = useCallback(() => {
    const json = JSON.stringify(buildThemePayload(config, version.theme), null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).then(
        () => showPortMessage("主题方案已复制到剪贴板", "ok"),
        () => showPortMessage("复制失败，请改用导出文件", "error"),
      );
    } else {
      showPortMessage("当前环境不支持剪贴板，请改用导出文件", "error");
    }
  }, [config, showPortMessage, version.theme]);

  const applyImported = useCallback(
    (result: ReturnType<typeof parseThemeImport>, sourceLabel: string) => {
      if (!result.ok) {
        showPortMessage(`导入失败：${result.error}`, "error");
        return;
      }
      if (result.themeId) setTheme(result.themeId);
      updateConfig(result.config);
      showPortMessage(
        `${sourceLabel}「${result.name}」${
          result.skipped > 0 ? `（${result.skipped} 个非法颜色字段已跳过）` : ""
        }`,
        "ok",
      );
    },
    [showPortMessage, updateConfig],
  );

  const handleImportTheme = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (file.size > 64 * 1024) {
        showPortMessage("文件超过 64KB 限制，请检查是否选错文件", "error");
        return;
      }
      void file.text().then((text) => {
        applyImported(parseThemeImport(text), "已应用");
      });
    },
    [applyImported, showPortMessage],
  );

  const handleSavePreset = useCallback(() => {
    const result = saveThemePreset(
      buildThemePayload(config, version.theme),
      presetName,
    );
    if (!result.ok) {
      showPortMessage(result.error, "error");
      return;
    }
    setPresets(result.presets);
    setPresetName("");
    showPortMessage("当前主题已保存为方案快照", "ok");
  }, [config, presetName, showPortMessage, version.theme]);

  const handleApplyPreset = useCallback(
    (preset: ThemePreset) => {
      applyImported(applyThemePreset(preset), "已恢复方案");
    },
    [applyImported],
  );

  const handleRemovePreset = useCallback(
    (preset: ThemePreset) => {
      setPresets(removeThemePreset(preset.id));
      showPortMessage(`已删除方案「${preset.name}」`, "ok");
    },
    [showPortMessage],
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

            <div className="mt-4 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Palette size={12} className="text-warm-primary/50" />
                <span className="text-[10px] text-white/60">主题方案导入导出</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={handleExportTheme}
                  className="flex items-center justify-center gap-1 rounded-lg border border-warm/20 bg-black/25 px-2 py-1.5 text-[10px] text-white/55 transition-colors hover:border-warm/40 hover:text-warm-primary"
                  title="将当前主题与视觉配置导出为 JSON 文件"
                >
                  <Download size={11} />
                  导出
                </button>
                <button
                  type="button"
                  onClick={handleCopyTheme}
                  className="flex items-center justify-center gap-1 rounded-lg border border-warm/20 bg-black/25 px-2 py-1.5 text-[10px] text-white/55 transition-colors hover:border-warm/40 hover:text-warm-primary"
                  title="复制主题方案 JSON 到剪贴板"
                >
                  <Copy size={11} />
                  复制
                </button>
                <button
                  type="button"
                  onClick={() => themeImportInputRef.current?.click()}
                  className="flex items-center justify-center gap-1 rounded-lg border border-warm/20 bg-black/25 px-2 py-1.5 text-[10px] text-white/55 transition-colors hover:border-warm/40 hover:text-warm-primary"
                  title="从 JSON 文件导入主题方案（64KB 以内）"
                >
                  <Upload size={11} />
                  导入
                </button>
              </div>
              <input
                ref={themeImportInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportTheme}
                className="hidden"
                aria-hidden
              />
              {portMessage && (
                <p
                  role="status"
                  className={`mt-2 text-[10px] ${
                    portTone === "ok" ? "text-emerald-300/80" : "text-red-300/80"
                  }`}
                >
                  {portMessage}
                </p>
              )}
              <p className="mt-1.5 text-[9px] leading-relaxed text-white/25">
                导出包含配色、光效、排版与动效参数；导入值将作为显式覆盖应用，不影响背景图片。
              </p>
            </div>

            {/* 主题方案库：本地快照与一键回滚 */}
            <div className="mt-2 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-white/60">主题方案库</span>
                <span className="text-[9px] font-mono text-white/25">
                  {presets.length}/{MAX_PRESETS}
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  maxLength={60}
                  placeholder="方案名称（留空用主题名）"
                  aria-label="主题方案名称"
                  className="min-w-0 flex-1 rounded-lg border border-warm/20 bg-black/25 px-2.5 py-1.5 text-[10px] text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-warm/50"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="shrink-0 rounded-lg border border-warm/25 bg-warm/10 px-2.5 py-1.5 text-[10px] text-warm-primary transition-colors hover:bg-warm/20"
                  title="将当前主题保存为方案快照"
                >
                  保存
                </button>
              </div>
              {presets.length === 0 ? (
                <p className="mt-2 text-[9px] text-white/25">
                  暂无快照。保存后可一键回滚到任意方案。
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {presets.map((preset) => (
                    <li
                      key={preset.id}
                      className="flex items-center gap-1 rounded-lg border border-warm/10 bg-black/20 px-2 py-1"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] text-white/60">
                        {preset.name}
                      </span>
                      <span className="shrink-0 text-[8px] font-mono text-white/20">
                        {preset.savedAt.slice(5, 16).replace("T", " ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        aria-label={`应用方案 ${preset.name}`}
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] text-warm-primary transition-colors hover:bg-warm/15"
                      >
                        应用
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePreset(preset)}
                        aria-label={`删除方案 ${preset.name}`}
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] text-white/30 transition-colors hover:text-red-300"
                      >
                        删除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 批量对比度审计 */}
            <div className="mt-2 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-white/60">对比度批量审计</span>
                <button
                  type="button"
                  onClick={runContrastAudit}
                  className="rounded-full border border-warm/30 px-2.5 py-0.5 text-[9px] text-warm-primary transition-colors hover:bg-warm/10"
                >
                  运行审计
                </button>
              </div>
              {!audit ? (
                <p className="text-[9px] text-white/25">
                  按 WCAG 2.x 检查主题主要文字与配色对背景的对比度。
                </p>
              ) : (
                <>
                  <p className="mb-2 text-[9px] font-mono">
                    <span className="text-emerald-300/80">达标 {audit.pass}</span>
                    <span className="text-white/25"> · </span>
                    <span className="text-amber-300/80">仅大字 {audit.warn}</span>
                    <span className="text-white/25"> · </span>
                    <span className="text-red-300/80">未达标 {audit.fail}</span>
                    <span className="text-white/25">
                      {" "}
                      / 共 {audit.total} 项
                    </span>
                  </p>
                  <ul className="space-y-0.5">
                    {audit.rows.map((row) => {
                      const tone = row.passesAA
                        ? "text-emerald-300/80"
                        : row.level === "AA-Large"
                          ? "text-amber-300/80"
                          : "text-red-300/80";
                      return (
                        <li
                          key={row.token}
                          className="flex items-center gap-2 text-[9px]"
                        >
                          <span className="w-14 shrink-0 text-white/45">
                            {row.label}
                          </span>
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm border border-white/15"
                            style={{ background: row.foreground }}
                            aria-hidden
                          />
                          <span className="flex-1 font-mono text-white/25">
                            {row.token}
                          </span>
                          <span className={`font-mono tabular-nums ${tone}`}>
                            {row.ratio.toFixed(2)}:1 · {row.level}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {audit.fail > 0 && (
                    <p className="mt-2 text-[9px] text-white/30">
                      建议提高未达标项亮度或加深背景，正文目标 ≥4.5:1。
                    </p>
                  )}
                  {audit.rows.some(
                    (row) => row.token === "--warm-primary" && !row.passesAA,
                  ) && (
                    <button
                      type="button"
                      onClick={handleFixContrast}
                      className="mt-2 w-full rounded-lg border border-warm/30 bg-warm/10 py-1.5 text-[10px] text-warm-primary transition-colors hover:bg-warm/20"
                    >
                      一键调整主色达标（AA 4.5:1）
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 主题分屏对比 */}
            <div className="mt-2 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/60">主题分屏对比</span>
                <select
                  value={compareThemeId}
                  onChange={(event) =>
                    setCompareThemeId(event.target.value as GalleryTheme)
                  }
                  aria-label="选择对比主题"
                  className="rounded-lg border border-warm/20 bg-black/30 px-2 py-1 text-[9px] text-white/60 outline-none focus:border-warm/45"
                >
                  {THEME_DEFINITIONS.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#0a0908]">
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {comparePanels.map((panel) => {
                  const verdict = evaluateContrast(
                    panel.primary,
                    panel.background,
                  );
                  return (
                    <div
                      key={panel.title}
                      className="overflow-hidden rounded-lg border border-warm/15"
                      style={{ background: panel.background }}
                    >
                      <div className="space-y-1 p-2">
                        <p className="text-[9px] text-white/35">{panel.title}</p>
                        <p
                          className="truncate text-[10px]"
                          style={{ color: panel.primary }}
                        >
                          {panel.name}
                        </p>
                        <div className="flex gap-1">
                          <span
                            className="h-2 flex-1 rounded-full"
                            style={{ background: panel.primary }}
                          />
                          <span
                            className="h-2 flex-1 rounded-full"
                            style={{ background: panel.accent }}
                          />
                        </div>
                        <p className="font-mono text-[8px] text-white/40">
                          主色对比 {verdict ? `${verdict.ratio.toFixed(2)}:1` : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
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

              <div className="space-y-1">
                <ColorPickerControl
                  label="主色调"
                  value={displayWarmPrimary}
                  onChange={(v) => updateConfig({ warmPrimaryColor: v })}
                />
                <ContrastHint
                  foreground={displayWarmPrimary}
                  background={themeDefinition.colors["--background"]}
                />
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={oklchInput}
                    onChange={(event) => setOklchInput(event.target.value)}
                    placeholder="高级：oklch(0.62 0.26 29)"
                    aria-label="OKLch 主色输入"
                    className="min-w-0 flex-1 rounded-lg border border-warm/20 bg-black/25 px-2 py-1 text-[9px] font-mono text-white/65 outline-none transition-colors placeholder:text-white/20 focus:border-warm/50"
                  />
                  <button
                    type="button"
                    onClick={handleApplyOklch}
                    className="shrink-0 rounded-lg border border-warm/25 px-2 py-1 text-[9px] text-warm-primary transition-colors hover:bg-warm/10"
                  >
                    应用
                  </button>
                </div>
              </div>

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

            {/* 品牌字体上传 */}
            <div className="mb-4 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-white/60">品牌字体</span>
                <span className="text-[9px] text-white/25">
                  woff2 / woff / ttf / otf · ≤5MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => fontFileInputRef.current?.click()}
                aria-label="上传品牌字体"
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-warm/25 px-3 py-2.5 text-left transition-colors hover:border-warm/45 hover:bg-warm/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm/10 font-[family-name:var(--font-brand,var(--font-cormorant))] text-sm text-warm-primary/80">
                  Aa
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-white/60">
                    {config.fontName || "点击上传品牌字体"}
                  </span>
                  <span className="block text-[9px] text-white/25">
                    应用于页脚标语；仅本机保存
                  </span>
                </span>
              </button>
              <input
                ref={fontFileInputRef}
                type="file"
                accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                onChange={handleFontUpload}
                className="hidden"
              />
              {config.fontName && (
                <button
                  onClick={() => {
                    const assetId = config.fontAssetId;
                    if (config.fontUrl) URL.revokeObjectURL(config.fontUrl);
                    updateConfig({
                      fontAssetId: null,
                      fontName: "",
                      fontUrl: null,
                    });
                    if (assetId) void removeBackgroundAsset(assetId);
                  }}
                  className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                >
                  移除品牌字体
                </button>
              )}
            </div>

            {/* 品牌 Logo 上传 */}
            <div className="mb-4 rounded-xl border border-warm/15 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-white/60">品牌 Logo</span>
                <span className="text-[9px] text-white/25">
                  PNG / SVG / JPG · ≤2MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                aria-label="上传品牌 Logo"
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-warm/25 px-3 py-2.5 text-left transition-colors hover:border-warm/45 hover:bg-warm/5"
              >
                {config.logoImage ? (
                  <img
                    src={config.logoImage}
                    alt="Logo 预览"
                    className="h-10 w-auto max-w-24 shrink-0 rounded object-contain"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warm/10 text-warm-primary/70">
                    <ImageIcon size={14} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[11px] text-white/60">
                    {config.logoImage ? "点击更换 Logo" : "点击上传 Logo"}
                  </span>
                  <span className="block text-[9px] text-white/25">
                    显示在页脚标语上方，支持透明背景
                  </span>
                </span>
              </button>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {config.logoImage && (
                <div className="mt-3 space-y-3 pl-3 border-l-2 border-warm/20">
                  <SliderControl
                    label="Logo 高度"
                    value={config.logoSize}
                    min={24}
                    max={120}
                    step={4}
                    unit="px"
                    onChange={(v) => updateConfig({ logoSize: v })}
                  />
                  <SliderControl
                    label="Logo 不透明度"
                    value={config.logoOpacity}
                    min={0.2}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateConfig({ logoOpacity: v })}
                  />
                  <SliderControl
                    label="Logo 圆角"
                    value={config.logoRadius}
                    min={0}
                    max={32}
                    step={2}
                    unit="px"
                    onChange={(v) => updateConfig({ logoRadius: v })}
                  />
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-white/40">
                      点击跳转链接（可选）
                    </span>
                    <input
                      type="text"
                      value={config.logoLink}
                      onChange={(event) =>
                        updateConfig({ logoLink: event.target.value })
                      }
                      maxLength={200}
                      placeholder="https://yyc3.top 或 /about"
                      className="w-full rounded-lg border border-warm/20 bg-black/25 px-2.5 py-1.5 text-[10px] text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-warm/50"
                    />
                    <span className="mt-1 block text-[9px] text-white/25">
                      仅支持 http(s) 与站内路径；留空则 Logo 不可点击。
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      const assetId = config.logoAssetId;
                      updateConfig({ logoAssetId: null, logoImage: null });
                      if (assetId) void removeBackgroundAsset(assetId);
                    }}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    移除 Logo
                  </button>
                </div>
              )}
            </div>

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
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#d4a574"}
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

/* 子组件：WCAG 对比度提示（主色调相对主题背景） */
const CONTRAST_META: Record<
  string,
  { label: string; className: string; note: string }
> = {
  AAA: {
    label: "AAA",
    className: "text-emerald-300/80",
    note: "正文与大字均达标",
  },
  AA: {
    label: "AA",
    className: "text-emerald-300/70",
    note: "正文达标",
  },
  "AA-Large": {
    label: "AA·大字",
    className: "text-amber-300/80",
    note: "仅大号文本达标",
  },
  Fail: {
    label: "未达标",
    className: "text-red-300/80",
    note: "建议调整颜色",
  },
};

function ContrastHint({
  foreground,
  background,
}: {
  foreground: string;
  background: string | undefined;
}) {
  const verdict = background ? evaluateContrast(foreground, background) : null;
  if (!verdict) return null;
  const meta = CONTRAST_META[verdict.level] ?? CONTRAST_META.Fail!;
  return (
    <p className="pl-0.5 text-[9px] font-mono tabular-nums">
      <span className="text-white/30">对比主题背景 </span>
      <span className={meta.className}>
        {verdict.ratio.toFixed(2)}:1 · {meta.label}
      </span>
      <span className="ml-1 text-white/25">{meta.note}</span>
    </p>
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
