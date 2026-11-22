/**
 * @file 主题方案导入导出与对比度评估单元测试
 * @description 覆盖导出负载、导入校验（格式/字段/颜色/上限）与 WCAG 对比度纯函数
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */
import { DEFAULT_CONFIG, normalizeConfig, type GalleryConfig } from "../config-store";
import type { ThemePortPayload } from "../theme-port";
import {
  applyThemePreset,
  auditThemeContrast,
  blendOver,
  buildThemePayload,
  contrastRatio,
  downloadThemePayload,
  evaluateContrast,
  listThemePresets,
  MAX_PRESETS,
  parseColorToRgb,
  parsePresetList,
  parseThemeImport,
  PRESET_STORAGE_KEY,
  relativeLuminance,
  removeThemePreset,
  saveThemePreset,
  THEME_PORT_MAX_BYTES,
} from "../theme-port";

function makePayload(overrides: Partial<ThemePortPayload> = {}): string {
  const base: ThemePortPayload = {
    ...buildThemePayload(DEFAULT_CONFIG, "warm-art", "测试方案"),
    ...overrides,
  };
  return JSON.stringify(base);
}

describe("buildThemePayload", () => {
  test("应包含格式标识、主题 ID 与全部分组字段", () => {
    const payload = buildThemePayload(DEFAULT_CONFIG, "warm-art");
    expect(payload.format).toBe("yyc3-theme");
    expect(payload.version).toBe(1);
    expect(payload.theme).toBe("warm-art");
    expect(payload.colors.warmPrimaryColor).toBe("#d4a574");
    expect(payload.colors.borderChroma).toBe("212 165 116");
    expect(payload.typography.fontSize).toBe("base");
    expect(payload.animation.floatDistance).toBe(-10);
    expect(payload.layout.enableGlowEffect).toBe(true);
    expect(payload.exportedAt).toBeTruthy();
  });

  test("自定义名称应优先于默认命名", () => {
    const payload = buildThemePayload(DEFAULT_CONFIG, "aurora", "我的极光");
    expect(payload.name).toBe("我的极光");
  });
});

describe("parseThemeImport", () => {
  test("合法负载应通过并标记全部显式覆盖", () => {
    const raw = makePayload({
      colors: {
        warmPrimaryColor: "#8b9dc3",
        borderChroma: "139 157 195",
        glowIntensity: 0.6,
        glowRadius: 40,
        glassBlur: 12,
        ambientTopColor: "rgba(139, 157, 195, 0.06)",
        ambientLeftColor: "rgba(120, 140, 180, 0.05)",
        ambientRightColor: "rgba(100, 130, 170, 0.04)",
        ambientCenterColor: "rgba(160, 170, 190, 0.03)",
      },
    });
    const result = parseThemeImport(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe("测试方案");
    expect(result.themeId).toBe("warm-art");
    expect(result.config.warmPrimaryColor).toBe("#8b9dc3");
    expect(result.config.glowIntensity).toBe(0.6);
    expect(result.config.visualOverrides).toEqual({
      warmPrimary: true,
      ambient: true,
      glow: true,
      border: true,
    });
    expect(result.skipped).toBe(0);
  });

  test("非 JSON / 错误格式 / 空内容应拒绝", () => {
    expect(parseThemeImport("not json").ok).toBe(false);
    expect(parseThemeImport('{"foo": 1}').ok).toBe(false);
    expect(
      parseThemeImport('{"format":"other-theme","version":1}').ok,
    ).toBe(false);
    expect(parseThemeImport("   ").ok).toBe(false);
  });

  test("超过 64KB 上限应拒绝", () => {
    const huge = makePayload();
    const inflated = JSON.stringify({
      ...JSON.parse(huge),
      name: "x".repeat(THEME_PORT_MAX_BYTES + 1),
    });
    const result = parseThemeImport(inflated);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("64KB");
  });

  test("非法颜色字段应跳过并计入 skipped，其余字段照常应用", () => {
    const raw = JSON.stringify({
      format: "yyc3-theme",
      version: 1,
      name: "混合方案",
      theme: "unknown-theme",
      colors: {
        warmPrimaryColor: "<script>alert(1)</script>",
        ambientTopColor: "rgba(1, 2, 3, 0.5)",
        glowIntensity: 2,
      },
      typography: { fontSize: "lg" },
    });
    const result = parseThemeImport(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.warmPrimaryColor).toBeUndefined();
    expect(result.config.ambientTopColor).toBe("rgba(1, 2, 3, 0.5)");
    expect(result.config.glowIntensity).toBe(2);
    expect(result.config.fontSize).toBe("lg");
    expect(result.skipped).toBe(1);
    expect(result.themeId).toBeNull();
    expect(result.config.visualOverrides!.warmPrimary).toBe(false);
    expect(result.config.visualOverrides!.glow).toBe(true);
  });

  test("非法 borderChroma 应被跳过；仅含非法字段时整体拒绝", () => {
    // 仅非法字段：无可应用内容 → 整体拒绝
    const onlyInvalid = JSON.stringify({
      format: "yyc3-theme",
      version: 1,
      colors: { borderChroma: "999 999 999 999" },
    });
    expect(parseThemeImport(onlyInvalid).ok).toBe(false);

    // 混合合法字段：非法项跳过并计数
    const mixed = JSON.stringify({
      format: "yyc3-theme",
      version: 1,
      colors: { borderChroma: "999 999 999 999", glowIntensity: 1 },
    });
    const result = parseThemeImport(mixed);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.borderChroma).toBeUndefined();
      expect(result.config.glowIntensity).toBe(1);
      expect(result.skipped).toBe(1);
    }
  });

  test("超长字符串字段应被忽略", () => {
    const raw = JSON.stringify({
      format: "yyc3-theme",
      version: 1,
      colors: { warmPrimaryColor: "#d4a574" },
      typography: { fontSize: "x".repeat(30) },
      brand: { line1: "标".repeat(60) },
    });
    const result = parseThemeImport(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.fontSize).toBeUndefined();
      expect(result.config.brandLine1).toBeUndefined();
    }
  });

  test("未含任何可应用字段应拒绝", () => {
    const raw = JSON.stringify({ format: "yyc3-theme", version: 1 });
    const result = parseThemeImport(raw);
    expect(result.ok).toBe(false);
  });
});

describe("downloadThemePayload", () => {
  test("jsdom 下应触发下载并清理节点", () => {
    // jsdom 的 URL 未实现 blob 方法，先注入再断言
    const urlMock = URL as unknown as {
      createObjectURL?: jest.Mock;
      revokeObjectURL?: jest.Mock;
    };
    if (typeof urlMock.createObjectURL !== "function") {
      urlMock.createObjectURL = jest.fn(() => "blob:mock");
    }
    if (typeof urlMock.revokeObjectURL !== "function") {
      urlMock.revokeObjectURL = jest.fn();
    }
    const createSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL");

    const payload = buildThemePayload(DEFAULT_CONFIG, "warm-art");
    const appended: Element[] = [];
    const spy = jest
      .spyOn(document.body, "appendChild")
      .mockImplementation(((node: Element) => {
        appended.push(node);
        return node;
      }) as typeof document.body.appendChild);
    const removeSpy = jest
      .spyOn(Element.prototype, "remove")
      .mockImplementation(() => undefined);

    expect(downloadThemePayload(payload)).toBe(true);
    expect(appended).toHaveLength(1);
    const anchor = appended[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^yyc3-theme-warm-art-\d+\.json$/);
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock");

    spy.mockRestore();
    removeSpy.mockRestore();
    revokeSpy.mockRestore();
    createSpy.mockRestore();
  });
});

describe("主题方案库", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("空库与损坏数据应返回空数组", () => {
    expect(listThemePresets()).toEqual([]);
    expect(parsePresetList(null)).toEqual([]);
    expect(parsePresetList("not json")).toEqual([]);
    expect(parsePresetList('{"a":1}')).toEqual([]);
    expect(
      parsePresetList('[{"id":"x","name":"n","payload":{"format":"other"}}]'),
    ).toEqual([]);
  });

  test("保存后应可列出，同名保存覆盖而非新增", () => {
    const payload = buildThemePayload(DEFAULT_CONFIG, "warm-art");
    const first = saveThemePreset(payload, "夜间工程");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.presets).toHaveLength(1);

    const second = saveThemePreset(
      buildThemePayload(DEFAULT_CONFIG, "deep-night"),
      "夜间工程",
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.presets).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(second.presets[0]?.payload.theme).toBe("deep-night");
  });

  test("超过上限应拒绝且不写入", () => {
    for (let index = 0; index < MAX_PRESETS; index += 1) {
      const result = saveThemePreset(
        buildThemePayload(DEFAULT_CONFIG, "warm-art"),
        `方案-${index}`,
      );
      expect(result.ok).toBe(true);
    }
    const overflow = saveThemePreset(
      buildThemePayload(DEFAULT_CONFIG, "warm-art"),
      "超出方案",
    );
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.error).toContain(String(MAX_PRESETS));
    expect(listThemePresets()).toHaveLength(MAX_PRESETS);
  });

  test("名称为空时应拒绝", () => {
    const payload = { ...buildThemePayload(DEFAULT_CONFIG, "warm-art"), name: "" };
    const result = saveThemePreset(payload, "   ");
    expect(result.ok).toBe(false);
  });

  test("删除后应持久化移除", () => {
    const saved = saveThemePreset(
      buildThemePayload(DEFAULT_CONFIG, "aurora"),
      "极光",
    );
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const rest = removeThemePreset(saved.id);
    expect(rest).toHaveLength(0);
    expect(listThemePresets()).toHaveLength(0);
    expect(window.localStorage.getItem(PRESET_STORAGE_KEY)).toBe("[]");
  });

  test("应用方案应复用导入语义并标记覆盖", () => {
    const payload = buildThemePayload(DEFAULT_CONFIG, "cyberpunk");
    const saved = saveThemePreset(payload, "赛博");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const preset = listThemePresets()[0]!;
    const result = applyThemePreset(preset);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.themeId).toBe("cyberpunk");
    expect(result.config.visualOverrides?.warmPrimary).toBe(true);
    expect(result.config.warmPrimaryColor).toBe(
      DEFAULT_CONFIG.warmPrimaryColor,
    );
  });
});

describe("批量对比度审计", () => {
  test("应逐项计算并对缺失/非法令牌跳过", () => {
    const report = auditThemeContrast({
      "--background": "#000000",
      "--foreground": "#ffffff",
      "--text-primary": "#dddddd",
      "--text-secondary": "rgba(255, 255, 255, 0.02)",
      "--text-muted": "not-a-color",
      "--warm-primary": "#d4a574",
    });
    // --text-muted 非法被跳过，其余 4 项保留
    expect(report.total).toBe(4);
    expect(report.rows.map((row) => row.token)).not.toContain("--text-muted");
    expect(report.rows.find((row) => row.token === "--foreground")?.level).toBe(
      "AAA",
    );
    // 近黑前景在纯黑背景上接近 1:1
    const secondary = report.rows.find(
      (row) => row.token === "--text-secondary",
    );
    expect(secondary?.passesAA).toBe(false);
    expect(report.fail).toBeGreaterThanOrEqual(1);
    expect(report.worst?.token).toBe("--text-secondary");
  });

  test("全部达标时应无 warn/fail", () => {
    const report = auditThemeContrast({
      "--background": "#ffffff",
      "--foreground": "#000000",
      "--text-primary": "#111111",
      "--text-secondary": "#333333",
      "--text-muted": "#555555",
      "--warm-primary": "#222222",
      "--warm-secondary": "#2a2a2a",
      "--warm-accent": "#1a1a1a",
    });
    expect(report.total).toBe(7);
    expect(report.pass).toBe(7);
    expect(report.warn).toBe(0);
    expect(report.fail).toBe(0);
    expect(report.worst).not.toBeNull();
  });

  test("缺少背景时所有项跳过且不抛错", () => {
    const report = auditThemeContrast({ "--foreground": "#ffffff" });
    expect(report.total).toBe(0);
    expect(report.worst).toBeNull();
    expect(report.pass).toBe(0);
  });
});

describe("Logo 配置归一化", () => {
  test("默认配置应包含 Logo 字段且未启用", () => {
    expect(DEFAULT_CONFIG.logoAssetId).toBeNull();
    expect(DEFAULT_CONFIG.logoImage).toBeNull();
    expect(DEFAULT_CONFIG.logoSize).toBe(48);
    expect(DEFAULT_CONFIG.logoOpacity).toBe(1);
    expect(DEFAULT_CONFIG.logoRadius).toBe(0);
  });

  test("旧配置缺少 Logo 字段时应补齐默认值", () => {
    const legacy = { brandLine1: "旧版标语" } as Partial<GalleryConfig>;
    const normalized = normalizeConfig(legacy);
    expect(normalized.brandLine1).toBe("旧版标语");
    expect(normalized.logoAssetId).toBeNull();
    expect(normalized.logoSize).toBe(48);
  });
});

describe("颜色解析与对比度", () => {
  test("parseColorToRgb 应支持 hex 三位/六位与 rgb()/rgba()", () => {
    expect(parseColorToRgb("#d4a574")).toEqual({
      rgb: [212, 165, 116],
      alpha: 1,
    });
    expect(parseColorToRgb("#FSA")).toBeNull();
    expect(parseColorToRgb("#fff")).toEqual({ rgb: [255, 255, 255], alpha: 1 });
    expect(parseColorToRgb("rgb(52, 211, 153)")).toEqual({
      rgb: [52, 211, 153],
      alpha: 1,
    });
    expect(parseColorToRgb("rgba(212, 165, 116, 0.08)")).toEqual({
      rgb: [212, 165, 116],
      alpha: 0.08,
    });
    expect(parseColorToRgb("rgba(300, 0, 0, 1)")).toBeNull();
    expect(parseColorToRgb("rgba(1, 2, 3, 2)")).toBeNull();
    expect(parseColorToRgb("hsl(0, 0%, 0%)")).toBeNull();
  });

  test("blendOver 应按 alpha 混合，不透明时透传", () => {
    const fg = { rgb: [255, 255, 255] as [number, number, number], alpha: 0 };
    expect(blendOver(fg, [0, 0, 0])).toEqual([0, 0, 0]);
    const half = { rgb: [200, 100, 50] as [number, number, number], alpha: 0.5 };
    expect(blendOver(half, [100, 100, 100])).toEqual([150, 100, 75]);
    const opaque = {
      rgb: [10, 20, 30] as [number, number, number],
      alpha: 1,
    };
    expect(blendOver(opaque, [255, 255, 255])).toEqual([10, 20, 30]);
  });

  test("relativeLuminance 黑为 0 白为 1", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });

  test("contrastRatio 黑白为 21，同色为 1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
    expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBeCloseTo(1, 5);
  });

  test("evaluateContrast 应输出正确 WCAG 等级", () => {
    const blackOnWhite = evaluateContrast("#000000", "#ffffff");
    expect(blackOnWhite!.level).toBe("AAA");
    expect(blackOnWhite!.ratio).toBeGreaterThan(20);

    // 温润主题：主色 #d4a574 对 #0a0908 背景
    const warm = evaluateContrast("#d4a574", "#0a0908");
    expect(warm).not.toBeNull();
    expect(warm!.passesAA).toBe(true);
    expect(["AA", "AAA"]).toContain(warm!.level);

    // 半透明前景应先混合再计算
    const ghost = evaluateContrast(
      "rgba(255, 255, 255, 0.03)",
      "#0a0908",
    );
    expect(ghost!.passesAA).toBe(false);
    expect(ghost!.level).toBe("Fail");

    // 3~4.5 区间为 AA-Large
    const mid = evaluateContrast("#777777", "#ffffff");
    expect(mid!.level).toBe("AA-Large");

    expect(evaluateContrast("oops", "#ffffff")).toBeNull();
    expect(evaluateContrast("#ffffff", "nope")).toBeNull();
  });
});

describe("导入配置与 normalizeConfig 兼容", () => {
  test("导入结果可直接交给 normalizeConfig 生成完整配置", () => {
    const result = parseThemeImport(
      makePayload({ theme: "deep-night" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const merged = { ...DEFAULT_CONFIG, ...result.config } as GalleryConfig;
    expect(merged.warmPrimaryColor).toBe(DEFAULT_CONFIG.warmPrimaryColor);
    expect(merged.visualOverrides.warmPrimary).toBe(true);
  });
});
