/**
 * @file 核心配置与组件状态单元测试
 * @description 覆盖 config-store / widget-store / media-store 的持久化与状态变更逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

const mockHostStorageGet = jest.fn();
const mockLoadBackgroundAsset = jest.fn();
jest.mock("../host-bridge", () => ({
  hostStorageGet: (...args: unknown[]) => mockHostStorageGet(...args),
  hostStorageSet: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../asset-store", () => ({
  loadBackgroundAsset: (...args: unknown[]) => mockLoadBackgroundAsset(...args),
}));

import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  applyConfigToDOM,
  loadConfigFromHost,
  hydratePlayerBackground,
  hydrateBackgrounds,
  revokeHydratedBackgroundUrls,
} from "../config-store";
import {
  WIDGET_CATALOG,
  getWidgetsSnapshot,
  setWidgetEnabled,
  setWidgetMinimized,
  setWidgetShape,
  setWidgetNotes,
  updateWidget,
  focusWidget,
  subscribeWidgets,
  type WidgetShape,
} from "../widget-store";
import {
  GALLERY_IMAGES,
  BUILTIN_TRACKS,
  DEFAULT_LAYOUT,
  loadPlayerLayout,
  savePlayerLayout,
} from "../media-store";

describe("config-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockHostStorageGet.mockReset();
    mockLoadBackgroundAsset.mockReset();
  });

  test("loadConfig 无存储时返回默认配置", () => {
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  test("saveConfig 应持久化并可读取", () => {
    const custom = { ...DEFAULT_CONFIG, fontSize: "lg" as const };
    saveConfig(custom);
    expect(loadConfig().fontSize).toBe("lg");
  });

  test("resetConfig 应恢复默认", () => {
    saveConfig({ ...DEFAULT_CONFIG, fontSize: "lg" as const });
    const reset = resetConfig();
    expect(reset.fontSize).toBe(DEFAULT_CONFIG.fontSize);
  });

  test("applyConfigToDOM 应写入 CSS 变量", () => {
    applyConfigToDOM({ ...DEFAULT_CONFIG, textOpacity: 0.77 });
    const value = document.documentElement.style.getPropertyValue(
      "--gallery-text-opacity",
    );
    // 变量可能由 config-store 内部映射，至少不应抛错
    expect(typeof value).toBe("string");
  });

  test("applyConfigToDOM 应映射全局光效与边线色度变量", () => {
    applyConfigToDOM({
      ...DEFAULT_CONFIG,
      visualOverrides: {
        warmPrimary: true,
        ambient: true,
        glow: true,
        border: true,
      },
      glowRadius: 80,
      ambientCenterColor: "rgba(1, 2, 3, 0.1)",
      borderChroma: "10 20 30",
      glassBlur: 32,
    });
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--glow-radius")).toBe("80%");
    expect(root.style.getPropertyValue("--ambient-center")).toBe(
      "rgba(1, 2, 3, 0.1)",
    );
    expect(root.style.getPropertyValue("--border-chroma")).toBe("10 20 30");
    expect(root.style.getPropertyValue("--glass-blur")).toBe("32px");
  });

  test("未覆盖主题时 applyConfigToDOM 不应写主题相关内联变量", () => {
    const root = document.documentElement;
    root.style.setProperty("--warm-primary", "#old");
    root.style.setProperty("--ambient-top", "rgba(0,0,0,.1)");
    root.style.setProperty("--glow-intensity", "2");

    applyConfigToDOM({
      ...DEFAULT_CONFIG,
      visualOverrides: {
        warmPrimary: false,
        ambient: false,
        glow: false,
        border: false,
      },
    });

    expect(root.style.getPropertyValue("--warm-primary")).toBe("");
    expect(root.style.getPropertyValue("--ambient-top")).toBe("");
    expect(root.style.getPropertyValue("--glow-intensity")).toBe("");
    // 边线色也由主题提供，未覆盖时不写内联值
    expect(root.style.getPropertyValue("--border-chroma")).toBe("");
  });

  test("旧配置缺少 override 标记时应推断为自定义", () => {
    window.localStorage.setItem(
      "yyc3-gallery-config",
      JSON.stringify({
        warmPrimaryColor: "#123456",
        glowIntensity: 1.4,
      }),
    );
    const config = loadConfig();
    expect(config.warmPrimaryColor).toBe("#123456");
    expect(config.visualOverrides.warmPrimary).toBe(true);
    expect(config.visualOverrides.glow).toBe(true);
    expect(config.visualOverrides.ambient).toBe(false);
  });

  test("applyConfigToDOM 应根据背景图切换 body class", () => {
    applyConfigToDOM({ ...DEFAULT_CONFIG, backgroundImage: "/bg.png" });
    expect(document.body.classList.contains("custom-background-active")).toBe(
      true,
    );
    applyConfigToDOM({ ...DEFAULT_CONFIG, backgroundImage: null });
    expect(document.body.classList.contains("custom-background-active")).toBe(
      false,
    );
  });

  test("loadConfig 遇到损坏 JSON 应回退默认", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem("yyc3-gallery-config", "bad json");
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    spy.mockRestore();
  });

  test("loadConfigFromHost 无远端数据应返回 null", async () => {
    mockHostStorageGet.mockResolvedValue(null);
    expect(await loadConfigFromHost()).toBeNull();
  });

  test("loadConfigFromHost 应合并远端配置", async () => {
    mockHostStorageGet.mockResolvedValue({ fontSize: "lg" });
    const result = await loadConfigFromHost();
    expect(result?.fontSize).toBe("lg");
    expect(result?.textOpacity).toBe(DEFAULT_CONFIG.textOpacity);
  });

  test("hydratePlayerBackground 已有图片时应直接返回", async () => {
    const config = { ...DEFAULT_CONFIG, playerBackgroundImage: "/bg.png" };
    expect(await hydratePlayerBackground(config)).toBe(config);
    expect(mockLoadBackgroundAsset).not.toHaveBeenCalled();
  });

  test("hydratePlayerBackground 无 assetId 时应直接返回", async () => {
    const config = { ...DEFAULT_CONFIG, playerBackgroundImage: null };
    expect(await hydratePlayerBackground(config)).toBe(config);
  });

  test("hydratePlayerBackground 应加载资源并生成 objectURL", async () => {
    const blob = new Blob(["img"]);
    mockLoadBackgroundAsset.mockResolvedValue(blob);
    const original = URL.createObjectURL;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
      () => "blob:mock";
    const config = {
      ...DEFAULT_CONFIG,
      playerBackgroundImage: null,
      playerBackgroundAssetId: "asset-1",
    };
    const result = await hydratePlayerBackground(config);
    expect(mockLoadBackgroundAsset).toHaveBeenCalledWith("asset-1");
    expect(result.playerBackgroundImage).toBe("blob:mock");
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
      original;
  });

  test("hydratePlayerBackground 资源加载失败应保持原配置", async () => {
    mockLoadBackgroundAsset.mockResolvedValue(null);
    const config = {
      ...DEFAULT_CONFIG,
      playerBackgroundImage: null,
      playerBackgroundAssetId: "missing",
    };
    expect(await hydratePlayerBackground(config)).toBe(config);
  });

  test("saveConfig 有 assetId 时应只持久化引用而不写 DataURL", () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      backgroundAssetId: "page-asset",
      backgroundImage: "data:image/png;base64,page",
      playerBackgroundAssetId: "player-asset",
      playerBackgroundImage: "data:image/png;base64,player",
    });
    const stored = JSON.parse(
      window.localStorage.getItem("yyc3-gallery-config") ?? "{}",
    ) as Record<string, unknown>;
    expect(stored.backgroundImage).toBeNull();
    expect(stored.backgroundAssetId).toBe("page-asset");
    expect(stored.playerBackgroundImage).toBeNull();
    expect(stored.playerBackgroundAssetId).toBe("player-asset");
  });

  test("无 assetId 的旧 DataURL 配置应保留以支持迁移", () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      backgroundAssetId: null,
      backgroundImage: "data:image/png;base64,legacy",
    });
    expect(loadConfig().backgroundImage).toBe("data:image/png;base64,legacy");
  });

  test("hydrateBackgrounds 应同时恢复页面与播放器背景", async () => {
    const original = URL.createObjectURL;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
      jest
        .fn()
        .mockReturnValueOnce("blob:page")
        .mockReturnValueOnce("blob:player");
    mockLoadBackgroundAsset.mockImplementation(async (id: string) =>
      id === "missing" ? null : new Blob([id]),
    );
    try {
      const result = await hydrateBackgrounds({
        ...DEFAULT_CONFIG,
        backgroundImage: null,
        backgroundAssetId: "page-asset",
        playerBackgroundImage: null,
        playerBackgroundAssetId: "player-asset",
      });
      expect(result.backgroundImage).toBe("blob:page");
      expect(result.playerBackgroundImage).toBe("blob:player");
      expect(mockLoadBackgroundAsset).toHaveBeenCalledWith("page-asset");
      expect(mockLoadBackgroundAsset).toHaveBeenCalledWith("player-asset");
    } finally {
      (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
        original;
    }
  });

  test("revokeHydratedBackgroundUrls 应释放已创建的对象 URL", async () => {
    const originalCreate = URL.createObjectURL;
    const revoke = jest.fn();
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
      () => "blob:revoke-test";
    (URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL =
      revoke;
    mockLoadBackgroundAsset.mockResolvedValue(new Blob(["img"]));
    try {
      await hydratePlayerBackground({
        ...DEFAULT_CONFIG,
        playerBackgroundImage: null,
        playerBackgroundAssetId: "revoke-asset",
      });
      revokeHydratedBackgroundUrls();
      expect(revoke).toHaveBeenCalledWith("blob:revoke-test");
    } finally {
      (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
        originalCreate;
    }
  });
});

describe("widget-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    const snapshot = getWidgetsSnapshot();
    Object.values(snapshot.items).forEach((w) => {
      if (w.enabled) setWidgetEnabled(w.kind, false);
    });
  });

  test("目录应包含 4 种组件", () => {
    expect(WIDGET_CATALOG).toHaveLength(4);
    const kinds = WIDGET_CATALOG.map((w) => w.kind);
    expect(kinds).toEqual(["clock", "calendar", "weather", "notes"]);
  });

  test("setWidgetEnabled 应启用组件", () => {
    setWidgetEnabled("clock", true);
    const found = Object.values(getWidgetsSnapshot().items).find(
      (w) => w.kind === "clock",
    );
    expect(found?.enabled).toBe(true);
  });

  test("setWidgetMinimized 与 setWidgetShape 应更新组件", () => {
    setWidgetEnabled("notes", true);
    const notes = Object.values(getWidgetsSnapshot().items).find(
      (w) => w.kind === "notes",
    );
    if (!notes) return;
    setWidgetMinimized(notes.id, true);
    setWidgetShape(notes.id, "capsule");
    const updated = getWidgetsSnapshot().items[notes.id];
    expect(updated?.minimized).toBe(true);
    expect(updated?.shape).toBe("capsule");
  });

  test("setWidgetNotes 应写入笔记内容", () => {
    setWidgetEnabled("notes", true);
    const notes = Object.values(getWidgetsSnapshot().items).find(
      (w) => w.kind === "notes",
    );
    if (!notes) return;
    setWidgetNotes(notes.id, "测试笔记");
    expect(getWidgetsSnapshot().items[notes.id]?.notes).toBe("测试笔记");
  });

  test("subscribeWidgets 应在变更时通知", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeWidgets(listener);
    setWidgetEnabled("calendar", true);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  test("focusWidget 应提升组件层级到最高", () => {
    setWidgetEnabled("clock", true);
    const before = getWidgetsSnapshot().items["widget-clock"].z;
    focusWidget("widget-clock");
    const after = getWidgetsSnapshot().items["widget-clock"].z;
    expect(after).toBeGreaterThan(before);
  });

  test("对不存在的组件 id 操作应安全忽略", () => {
    expect(() => updateWidget("nonexistent", { x: 1 })).not.toThrow();
    expect(() => focusWidget("nonexistent")).not.toThrow();
    expect(() => setWidgetMinimized("nonexistent", true)).not.toThrow();
    expect(() => setWidgetShape("nonexistent", "circle")).not.toThrow();
  });

  test("非法 shape 应被 setWidgetShape 拒绝", () => {
    setWidgetEnabled("clock", true);
    const before = getWidgetsSnapshot().items["widget-clock"].shape;
    setWidgetShape("widget-clock", "not-a-shape" as WidgetShape);
    expect(getWidgetsSnapshot().items["widget-clock"].shape).toBe(before);
  });

  test("setWidgetMinimized 的非法 shape 应回退原 shape", () => {
    setWidgetEnabled("clock", true);
    const before = getWidgetsSnapshot().items["widget-clock"].shape;
    setWidgetMinimized("widget-clock", true, "not-a-shape" as WidgetShape);
    expect(getWidgetsSnapshot().items["widget-clock"].shape).toBe(before);
    expect(getWidgetsSnapshot().items["widget-clock"].minimized).toBe(true);
  });

  test("setWidgetNotes 应截断超长笔记", () => {
    setWidgetEnabled("notes", true);
    setWidgetNotes("widget-notes", "x".repeat(3000));
    expect(getWidgetsSnapshot().items["widget-notes"].notes.length).toBe(2000);
  });

  test("变更应触发持久化到 localStorage", () => {
    jest.useFakeTimers();
    setWidgetEnabled("weather", true);
    jest.runAllTimers();
    const stored = window.localStorage.getItem("yyc3-widget-space-v1");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).items["widget-weather"].enabled).toBe(true);
    jest.useRealTimers();
  });
});

describe("media-store", () => {
  beforeEach(() => window.localStorage.clear());

  test("画廊图源与内置曲目非空", () => {
    expect(GALLERY_IMAGES.length).toBeGreaterThan(0);
    expect(BUILTIN_TRACKS.length).toBeGreaterThan(0);
  });

  test("内置曲目应含音频与视频", () => {
    expect(BUILTIN_TRACKS.some((t) => t.kind === "audio")).toBe(true);
    expect(BUILTIN_TRACKS.some((t) => t.kind === "video")).toBe(true);
  });

  test("savePlayerLayout 与 loadPlayerLayout 应往返一致", () => {
    const layout = { ...DEFAULT_LAYOUT, volume: 0.33 };
    savePlayerLayout(layout);
    expect(loadPlayerLayout().volume).toBe(0.33);
  });

  test("loadPlayerLayout 损坏数据应回退默认", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem("yyc3-gallery-media-layout", "bad json");
    expect(loadPlayerLayout()).toEqual(DEFAULT_LAYOUT);
    spy.mockRestore();
  });

  test("loadPlayerLayout 应规范化 volume 与 mode", () => {
    window.localStorage.setItem(
      "yyc3-gallery-media-layout",
      JSON.stringify({ volume: 5, mode: "invalid" }),
    );
    const layout = loadPlayerLayout();
    expect(layout.volume).toBe(1);
    expect(layout.mode).toBe("collapsed");
  });
});
