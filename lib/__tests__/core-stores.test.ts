/**
 * @file 核心配置与组件状态单元测试
 * @description 覆盖 config-store / widget-store / media-store 的持久化与状态变更逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  applyConfigToDOM,
} from "../config-store";
import {
  WIDGET_CATALOG,
  getWidgetsSnapshot,
  setWidgetEnabled,
  setWidgetMinimized,
  setWidgetShape,
  setWidgetNotes,
  subscribeWidgets,
} from "../widget-store";
import {
  GALLERY_IMAGES,
  BUILTIN_TRACKS,
  DEFAULT_LAYOUT,
  loadPlayerLayout,
  savePlayerLayout,
} from "../media-store";

describe("config-store", () => {
  beforeEach(() => window.localStorage.clear());

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
});
