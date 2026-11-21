/**
 * @file 多版本设计状态管理单元测试
 * @description 验证版本切换、持久化、主题定义与断点判断逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import type { GalleryTheme } from "../version-store";
import {
  setTheme,
  setLayout,
  setBreakpoint,
  resetBreakpoint,
  setReducedMotion,
  getVersionSnapshot,
  subscribeVersion,
  getThemeDefinition,
  applyThemeToDOM,
  getBreakpointFromWidth,
  THEME_DEFINITIONS,
} from "../version-store";

describe("version-store", () => {
  beforeEach(() => {
    // 重置 localStorage 与单例状态
    window.localStorage.clear();
    // 强制恢复默认：通过直接操作模块内 state 较困难，
    // 这里仅在每个测试前清空 localStorage，确保 restoreVersion 取默认
  });

  test("默认版本应为 warm-art / split / desktop / 自动断点 / reducedMotion=false", () => {
    const snap = getVersionSnapshot();
    expect(snap.theme).toBe("warm-art");
    expect(snap.layout).toBe("split");
    expect(snap.breakpoint).toBe("desktop");
    expect(snap.breakpointOverride).toBe(false);
    expect(snap.reducedMotion).toBe(false);
  });

  test("setTheme 应更新快照并持久化", () => {
    jest.useFakeTimers();
    setTheme("deep-night");
    const snap = getVersionSnapshot();
    expect(snap.theme).toBe("deep-night");
    jest.runAllTimers();
    const raw = window.localStorage.getItem("yyc3-gallery-version-v1");
    const stored = JSON.parse(raw ?? "{}");
    expect(stored.theme).toBe("deep-night");
    jest.useRealTimers();
  });

  test("setLayout 与 setBreakpoint 应独立生效", () => {
    setLayout("unified");
    setBreakpoint("mobile");
    const snap = getVersionSnapshot();
    expect(snap.layout).toBe("unified");
    expect(snap.breakpoint).toBe("mobile");
    expect(snap.breakpointOverride).toBe(true);
  });

  test("resetBreakpoint 应恢复自动断点模式", () => {
    setBreakpoint("tablet");
    expect(getVersionSnapshot().breakpointOverride).toBe(true);
    resetBreakpoint();
    const snap = getVersionSnapshot();
    expect(snap.breakpoint).toBe("desktop");
    expect(snap.breakpointOverride).toBe(false);
  });

  test("setReducedMotion 应切换布尔值", () => {
    setReducedMotion(true);
    expect(getVersionSnapshot().reducedMotion).toBe(true);
    setReducedMotion(false);
    expect(getVersionSnapshot().reducedMotion).toBe(false);
  });

  test("subscribeVersion 应在状态变更时触发监听器", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeVersion(listener);
    setTheme("aurora");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setTheme("minimal");
    expect(listener).toHaveBeenCalledTimes(1); // 取消订阅后不再触发
  });

  test("getThemeDefinition 应返回对应主题定义", () => {
    const def = getThemeDefinition("aurora");
    expect(def.id).toBe("aurora");
    expect(def.colors["--warm-primary"]).toBe("#34d399");
  });

  test("getThemeDefinition 未知主题应回退到第一个定义", () => {
    const def = getThemeDefinition("unknown-theme" as GalleryTheme);
    expect(def.id).toBe("warm-art");
  });

  test("THEME_DEFINITIONS 应包含 7 个主题", () => {
    expect(THEME_DEFINITIONS).toHaveLength(7);
    const ids = THEME_DEFINITIONS.map((t) => t.id);
    expect(ids).toContain("warm-art");
    expect(ids).toContain("deep-night");
    expect(ids).toContain("aurora");
    expect(ids).toContain("minimal");
    expect(ids).toContain("cyberpunk");
    expect(ids).toContain("ink-wash");
    expect(ids).toContain("polar");
  });

  test("新增主题应提供完整色彩定义", () => {
    const newThemes: GalleryTheme[] = ["cyberpunk", "ink-wash", "polar"];
    newThemes.forEach((id) => {
      const def = getThemeDefinition(id);
      expect(def.colors["--background"]).toBeDefined();
      expect(def.colors["--foreground"]).toBeDefined();
      expect(def.colors["--warm-primary"]).toBeDefined();
      expect(def.colors["--text-primary"]).toBeDefined();
    });
  });

  test("getBreakpointFromWidth 按阈值划分", () => {
    expect(getBreakpointFromWidth(500)).toBe("mobile");
    expect(getBreakpointFromWidth(767)).toBe("mobile");
    expect(getBreakpointFromWidth(768)).toBe("tablet");
    expect(getBreakpointFromWidth(1023)).toBe("tablet");
    expect(getBreakpointFromWidth(1024)).toBe("desktop");
    expect(getBreakpointFromWidth(1920)).toBe("desktop");
  });

  test("applyThemeToDOM 应写入 data 属性并通过独立样式表注入变量", () => {
    applyThemeToDOM("cyberpunk");
    expect(document.documentElement.dataset.theme).toBe("cyberpunk");
    const def = getThemeDefinition("cyberpunk");
    const styleElement = document.getElementById("yyc3-theme-vars");
    expect(styleElement).not.toBeNull();
    expect(styleElement?.textContent).toContain("--warm-primary");
    expect(styleElement?.textContent).toContain(def.colors["--warm-primary"]);
    // 主题不再写内联变量，避免覆盖 Design Studio 的自定义值
    expect(
      document.documentElement.style.getPropertyValue("--warm-primary"),
    ).toBe("");
  });

  test("模块加载应从 localStorage 恢复版本状态", async () => {
    window.localStorage.setItem(
      "yyc3-gallery-version-v1",
      JSON.stringify({
        version: 1,
        theme: "polar",
        layout: "unified",
        breakpoint: "tablet",
        breakpointOverride: true,
        reducedMotion: true,
      }),
    );
    jest.resetModules();
    const restored = await import("../version-store");
    const snap = restored.getVersionSnapshot();
    expect(snap.theme).toBe("polar");
    expect(snap.layout).toBe("unified");
    expect(snap.breakpoint).toBe("tablet");
    expect(snap.breakpointOverride).toBe(true);
    expect(snap.reducedMotion).toBe(true);
  });

  test("非法存储数据应回退默认值", async () => {
    window.localStorage.setItem("yyc3-gallery-version-v1", "not-json");
    jest.resetModules();
    const restored = await import("../version-store");
    expect(restored.getVersionSnapshot().theme).toBe("warm-art");
  });

  test("部分字段缺失时应逐项回退默认", async () => {
    window.localStorage.setItem(
      "yyc3-gallery-version-v1",
      JSON.stringify({ theme: "invalid-theme", layout: "bad", breakpoint: "xl" }),
    );
    jest.resetModules();
    const restored = await import("../version-store");
    const snap = restored.getVersionSnapshot();
    expect(snap.theme).toBe("warm-art");
    expect(snap.layout).toBe("split");
    expect(snap.breakpoint).toBe("desktop");
  });
});
