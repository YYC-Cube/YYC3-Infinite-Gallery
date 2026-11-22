/**
 * @file 主题方案导入导出与对比度评估
 * @description Design Studio 主题 JSON 导出/导入校验 + WCAG 对比度纯函数计算
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */
import { THEME_DEFINITIONS, type GalleryTheme } from "@/lib/version-store";
import type { GalleryConfig } from "@/lib/config-store";

/** 导出负载上限：主题 JSON 属轻量配置，64KB 远超实际需要，防御性截断 */
export const THEME_PORT_MAX_BYTES = 64 * 1024;

export interface ThemePortPayload {
  format: "yyc3-theme";
  version: 1;
  name: string;
  exportedAt: string;
  /** 导出时基于的主题 ID；导入时若合法则同步切换 */
  theme: string;
  colors: {
    warmPrimaryColor: string;
    borderChroma: string;
    glowIntensity: number;
    glowRadius: number;
    glassBlur: number;
    ambientTopColor: string;
    ambientLeftColor: string;
    ambientRightColor: string;
    ambientCenterColor: string;
  };
  brand: { line1: string; line2: string };
  typography: {
    fontSize: string;
    fontWeight: string;
    letterSpacing: number;
    textOpacity: number;
  };
  animation: {
    revealDuration: number;
    revealDelay: number;
    floatDuration: number;
    floatDistance: number;
    breatheDuration: number;
  };
  layout: {
    footerPaddingY: number;
    separatorWidth: number;
    enableGlowEffect: boolean;
  };
}

/** 从完整配置提炼可导出的主题方案（不含背景二进制与 assetId） */
export function buildThemePayload(
  config: GalleryConfig,
  theme: GalleryTheme,
  name?: string,
): ThemePortPayload {
  return {
    format: "yyc3-theme",
    version: 1,
    name: name?.trim() || `YYC³ 主题方案 · ${theme}`,
    exportedAt: new Date().toISOString(),
    theme,
    colors: {
      warmPrimaryColor: config.warmPrimaryColor,
      borderChroma: config.borderChroma,
      glowIntensity: config.glowIntensity,
      glowRadius: config.glowRadius,
      glassBlur: config.glassBlur,
      ambientTopColor: config.ambientTopColor,
      ambientLeftColor: config.ambientLeftColor,
      ambientRightColor: config.ambientRightColor,
      ambientCenterColor: config.ambientCenterColor,
    },
    brand: { line1: config.brandLine1, line2: config.brandLine2 },
    typography: {
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      letterSpacing: config.letterSpacing,
      textOpacity: config.textOpacity,
    },
    animation: {
      revealDuration: config.revealDuration,
      revealDelay: config.revealDelay,
      floatDuration: config.floatDuration,
      floatDistance: config.floatDistance,
      breatheDuration: config.breatheDuration,
    },
    layout: {
      footerPaddingY: config.footerPaddingY,
      separatorWidth: config.separatorWidth,
      enableGlowEffect: config.enableGlowEffect,
    },
  };
}

export type ThemeImportResult =
  | {
      ok: true;
      name: string;
      themeId: GalleryTheme | null;
      /** 导入值一律视为显式覆盖主题 */
      config: Partial<GalleryConfig>;
      /** 因格式非法被跳过的字段数（不影响其余字段应用） */
      skipped: number;
    }
  | { ok: false; error: string };

const NUMBER_FIELDS = {
  colors: ["glowIntensity", "glowRadius", "glassBlur"],
  typography: ["letterSpacing", "textOpacity"],
  animation: [
    "revealDuration",
    "revealDelay",
    "floatDuration",
    "floatDistance",
    "breatheDuration",
  ],
  layout: ["footerPaddingY", "separatorWidth"],
} as const;

/** 需要 hex/rgba 颜色格式校验的字段 */
const COLOR_FIELDS = [
  "warmPrimaryColor",
  "ambientTopColor",
  "ambientLeftColor",
  "ambientRightColor",
  "ambientCenterColor",
] as const;
/** 容器边线色度为 "r g b" 三通道字符串，单独校验 */
const BORDER_CHROMA_PATTERN = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;

function isValidColorField(field: string, value: string): boolean {
  if (field === "borderChroma") return BORDER_CHROMA_PATTERN.test(value.trim());
  if ((COLOR_FIELDS as readonly string[]).includes(field)) {
    return parseColorToRgb(value) !== null;
  }
  return true;
}

/** 解析导入 JSON：白名单字段校验，导入值全部标记为显式覆盖 */
export function parseThemeImport(raw: string): ThemeImportResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "内容为空" };
  if (text.length > THEME_PORT_MAX_BYTES) {
    return { ok: false, error: "文件超过 64KB 限制，请检查是否选错文件" };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "不是合法的 JSON 文件" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "JSON 结构不符合主题方案格式" };
  }

  const root = data as Record<string, unknown>;
  if (root.format !== "yyc3-theme" || root.version !== 1) {
    return { ok: false, error: "格式标识不匹配（需要 yyc3-theme v1）" };
  }

  const config: Partial<GalleryConfig> = {};
  let rejectedColors = 0;
  for (const group of ["colors", "typography", "animation", "layout"] as const) {
    const section = root[group];
    if (!section || typeof section !== "object" || Array.isArray(section)) {
      continue;
    }
    const typed = section as Record<string, unknown>;
    for (const field of NUMBER_FIELDS[group]) {
      const value = typed[field];
      if (typeof value === "number" && Number.isFinite(value)) {
        (config as Record<string, unknown>)[field] = value;
      }
    }
    if (group === "colors") {
      for (const field of COLOR_FIELDS) {
        const value = typed[field];
        if (
          typeof value === "string" &&
          value.length <= 120 &&
          isValidColorField(field, value)
        ) {
          (config as Record<string, unknown>)[field] = value;
        } else if (value !== undefined) {
          rejectedColors += 1;
        }
      }
      const border = typed.borderChroma;
      if (
        typeof border === "string" &&
        border.length <= 20 &&
        isValidColorField("borderChroma", border)
      ) {
        config.borderChroma = border;
      } else if (border !== undefined) {
        rejectedColors += 1;
      }
    } else if (group === "typography") {
      for (const field of ["fontSize", "fontWeight"] as const) {
        const value = typed[field];
        if (typeof value === "string" && value.length <= 20) {
          (config as Record<string, unknown>)[field] = value;
        }
      }
    }
  }

  const brand = root.brand;
  if (brand && typeof brand === "object" && !Array.isArray(brand)) {
    const typed = brand as Record<string, unknown>;
    if (typeof typed.line1 === "string" && typed.line1.length <= 50) {
      config.brandLine1 = typed.line1;
    }
    if (typeof typed.line2 === "string" && typed.line2.length <= 100) {
      config.brandLine2 = typed.line2;
    }
  }
  const layoutFlags = root.layout;
  if (
    layoutFlags &&
    typeof layoutFlags === "object" &&
    !Array.isArray(layoutFlags) &&
    typeof (layoutFlags as Record<string, unknown>).enableGlowEffect ===
      "boolean"
  ) {
    config.enableGlowEffect = (
      layoutFlags as Record<string, unknown>
    ).enableGlowEffect as boolean;
  }

  if (Object.keys(config).length === 0) {
    return { ok: false, error: "未包含任何可应用的主题字段" };
  }

  let themeId: GalleryTheme | null = null;
  if (typeof root.theme === "string") {
    themeId = THEME_DEFINITIONS.some((item) => item.id === root.theme)
      ? (root.theme as GalleryTheme)
      : null;
  }

  const name =
    typeof root.name === "string" && root.name.trim()
      ? root.name.trim().slice(0, 60)
      : "导入主题方案";

  return {
    ok: true,
    name,
    themeId,
    skipped: rejectedColors,
    config: {
      ...config,
      // 导入的配色/光效/边线均视为用户显式修改，优先级高于当前主题
      visualOverrides: {
        warmPrimary: "warmPrimaryColor" in config,
        ambient: "ambientTopColor" in config,
        glow: "glowIntensity" in config,
        border: "borderChroma" in config,
      },
    },
  };
}

/** 触发浏览器下载主题 JSON 文件；返回 false 表示环境不支持 */
export function downloadThemePayload(payload: ThemePortPayload): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return false;
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `yyc3-theme-${payload.theme}-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

/* ========================================
   主题方案库（本地快照与回滚）
   ======================================== */

export const PRESET_STORAGE_KEY = "yyc3-theme-presets-v1";
export const MAX_PRESETS = 10;

export interface ThemePreset {
  id: string;
  name: string;
  savedAt: string;
  payload: ThemePortPayload;
}

function isPayloadShape(value: unknown): value is ThemePortPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.format === "yyc3-theme" && item.version === 1;
}

/** 解析方案库原始字符串，逐条校验并丢弃损坏条目 */
export function parsePresetList(raw: string | null): ThemePreset[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry): entry is ThemePreset => {
        if (!entry || typeof entry !== "object") return false;
        const item = entry as Partial<ThemePreset>;
        return (
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          isPayloadShape(item.payload)
        );
      })
      .slice(0, MAX_PRESETS);
  } catch {
    return [];
  }
}

function writePresets(presets: ThemePreset[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    /* 存储不可用时仅保留内存态 */
  }
}

export function listThemePresets(): ThemePreset[] {
  if (typeof window === "undefined") return [];
  return parsePresetList(window.localStorage.getItem(PRESET_STORAGE_KEY));
}

export type PresetSaveResult =
  | { ok: true; presets: ThemePreset[]; id: string }
  | { ok: false; error: string };

/** 保存当前主题为命名快照；同名覆盖、超出上限拒绝 */
export function saveThemePreset(
  payload: ThemePortPayload,
  name?: string,
): PresetSaveResult {
  const label = name?.trim() || payload.name;
  if (!label) return { ok: false, error: "请填写方案名称" };
  const presets = listThemePresets();
  const existing = presets.find((item) => item.name === label);
  if (!existing && presets.length >= MAX_PRESETS) {
    return { ok: false, error: `最多保存 ${MAX_PRESETS} 个方案，请先删除旧方案` };
  }
  const preset: ThemePreset = {
    id: existing?.id ?? `preset-${Date.now().toString(36)}`,
    name: label.slice(0, 60),
    savedAt: new Date().toISOString(),
    payload: { ...payload, name: label.slice(0, 60) },
  };
  const next = existing
    ? presets.map((item) => (item.id === existing.id ? preset : item))
    : [preset, ...presets];
  writePresets(next);
  return { ok: true, presets: next, id: preset.id };
}

export function removeThemePreset(id: string): ThemePreset[] {
  const next = listThemePresets().filter((item) => item.id !== id);
  writePresets(next);
  return next;
}

/** 应用方案快照：复用导入校验与覆盖语义 */
export function applyThemePreset(preset: ThemePreset): ThemeImportResult {
  return parseThemeImport(JSON.stringify(preset.payload));
}

/* ========================================
   WCAG 对比度评估（纯函数）
   ======================================== */

export type Rgb = [number, number, number];

export interface ParsedColor {
  rgb: Rgb;
  /** 不透明度为 1；rgba() 半透明色 < 1 */
  alpha: number;
}

/** OKLch → sRGB（含色域裁剪），用于审计与对比度计算 */
function oklchToRgb(L: number, C: number, H: number, alpha: number): ParsedColor {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const toSrgb = (value: number) => {
    const v = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return {
    rgb: [toSrgb(linear[0] ?? 0), toSrgb(linear[1] ?? 0), toSrgb(linear[2] ?? 0)],
    alpha,
  };
}

/** 解析 hex（#rgb/#rrggbb）、rgb()/rgba() 与 oklch() 颜色；不支持时返回 null */
export function parseColorToRgb(input: string): ParsedColor | null {
  const value = input.trim();

  const oklch = value.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i,
  );
  if (oklch) {
    const rawL = Number(oklch[1]);
    const L = oklch[2] === "%" || rawL > 1 ? rawL / 100 : rawL;
    const C = Number(oklch[3]);
    const H = Number(oklch[4]);
    let alpha = 1;
    if (oklch[5] !== undefined) {
      const rawA = Number(oklch[5]);
      alpha = oklch[6] === "%" ? rawA / 100 : rawA;
    }
    if (
      !Number.isFinite(L) ||
      !Number.isFinite(C) ||
      !Number.isFinite(H) ||
      !Number.isFinite(alpha) ||
      L < 0 ||
      L > 1 ||
      C < 0 ||
      alpha < 0 ||
      alpha > 1
    ) {
      return null;
    }
    return oklchToRgb(L, C, H, alpha);
  }

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  const body = hex?.[1];
  if (body) {
    if (body.length === 3) {
      return {
        rgb: [
          parseInt(body.charAt(0) + body.charAt(0), 16),
          parseInt(body.charAt(1) + body.charAt(1), 16),
          parseInt(body.charAt(2) + body.charAt(2), 16),
        ],
        alpha: 1,
      };
    }
    return {
      rgb: [
        parseInt(body.slice(0, 2), 16),
        parseInt(body.slice(2, 4), 16),
        parseInt(body.slice(4, 6), 16),
      ],
      alpha: 1,
    };
  }

  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (rgb) {
    const channels: Rgb = [
      Number(rgb[1] ?? NaN),
      Number(rgb[2] ?? NaN),
      Number(rgb[3] ?? NaN),
    ];
    if (channels.some((n) => !Number.isFinite(n) || n > 255)) return null;
    const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
    return { rgb: channels, alpha };
  }
  return null;
}

/** 将半透明前景按 alpha 混合到底色，返回不透明 RGB */
export function blendOver(fg: ParsedColor, bg: Rgb): Rgb {
  const { rgb, alpha } = fg;
  if (alpha >= 1) return rgb;
  return [
    Math.round(rgb[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(rgb[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(rgb[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

/** WCAG 2.x 相对亮度 */
export function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (raw: number) => {
    const v = raw / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

/** WCAG 对比度：(L1 + 0.05) / (L2 + 0.05)，恒 ≥ 1 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] =
    la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA-Large" | "Fail";
export interface ContrastVerdict {
  ratio: number;
  level: WcagLevel;
  /** 是否达到正文 AA（4.5:1） */
  passesAA: boolean;
}

/** 评估前景/背景对比度等级（按正文文本口径；大文本阈值 3:1 记为 AA-Large） */
export function evaluateContrast(
  foreground: string,
  background: string,
): ContrastVerdict | null {
  const bg = parseColorToRgb(background);
  if (!bg) return null;
  const fg = parseColorToRgb(foreground);
  if (!fg) return null;
  const ratio = contrastRatio(blendOver(fg, bg.rgb), bg.rgb);
  const level: WcagLevel =
    ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-Large" : "Fail";
  return { ratio, level, passesAA: ratio >= 4.5 };
}

/* ========================================
   无障碍修复建议
   ======================================== */

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * 为前景色给出可达标（默认正文 AA 4.5:1）的替代色：
 * 深色背景下向白色提亮，浅色背景下向黑色加深，保持色相近似。
 * 无法解析时返回 null。
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  target = 4.5,
): string | null {
  const bg = parseColorToRgb(background);
  const fg = parseColorToRgb(foreground);
  if (!bg || !fg) return null;
  const fgRgb = blendOver(fg, bg.rgb);
  const lighten = relativeLuminance(bg.rgb) < 0.5;
  const extreme: Rgb = lighten ? [255, 255, 255] : [0, 0, 0];

  for (let step = 1; step <= 50; step += 1) {
    const t = step / 50;
    const candidate: Rgb = [
      fgRgb[0] + (extreme[0] - fgRgb[0]) * t,
      fgRgb[1] + (extreme[1] - fgRgb[1]) * t,
      fgRgb[2] + (extreme[2] - fgRgb[2]) * t,
    ];
    if (contrastRatio(candidate, bg.rgb) >= target) {
      return rgbToHex(candidate);
    }
  }
  return rgbToHex(extreme);
}

/* ========================================
   批量对比度审计
   ======================================== */
export interface ContrastAuditRow {
  /** 主题令牌键名（如 --warm-primary） */
  token: string;
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  level: WcagLevel;
  passesAA: boolean;
}

export interface ContrastAuditReport {
  rows: ContrastAuditRow[];
  total: number;
  /** 达到正文 AA（≥4.5:1） */
  pass: number;
  /** 仅大文本达标（3:1–4.5:1） */
  warn: number;
  /** 未达标（<3:1） */
  fail: number;
  /** 对比度最低的一项 */
  worst: ContrastAuditRow | null;
}

/** 审计目标：主题内的前景令牌与其对照背景 */
const AUDIT_TARGETS: { token: string; label: string }[] = [
  { token: "--foreground", label: "正文" },
  { token: "--text-primary", label: "主要文字" },
  { token: "--text-secondary", label: "次要文字" },
  { token: "--text-muted", label: "弱化文字" },
  { token: "--warm-primary", label: "主色调" },
  { token: "--warm-secondary", label: "次色调" },
  { token: "--warm-accent", label: "强调色" },
];

/**
 * 批量审计主题配色：以 --background 为统一背景，逐项计算 WCAG 等级。
 * 缺失或非法的令牌自动跳过，不阻断其余项。
 */
export function auditThemeContrast(
  colors: Record<string, string>,
): ContrastAuditReport {
  const background = colors["--background"] ?? "";
  const rows: ContrastAuditRow[] = [];

  for (const target of AUDIT_TARGETS) {
    const foreground = colors[target.token];
    if (!foreground) continue;
    const verdict = evaluateContrast(foreground, background);
    if (!verdict) continue;
    rows.push({
      token: target.token,
      label: target.label,
      foreground,
      background,
      ratio: verdict.ratio,
      level: verdict.level,
      passesAA: verdict.passesAA,
    });
  }

  const worst = rows.reduce<ContrastAuditRow | null>(
    (acc, row) => (!acc || row.ratio < acc.ratio ? row : acc),
    null,
  );

  return {
    rows,
    total: rows.length,
    pass: rows.filter((row) => row.passesAA).length,
    warn: rows.filter((row) => row.level === "AA-Large").length,
    fail: rows.filter((row) => row.level === "Fail").length,
    worst,
  };
}
