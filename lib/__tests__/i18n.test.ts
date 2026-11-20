/**
 * @file 轻量国际化单元测试
 * @description 验证语言切换、字典查询与插值逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  t,
  setLocale,
  getLocale,
  subscribeLocale,
  useLocale,
  LOCALES,
  DICTIONARY,
} from "../i18n";

describe("i18n", () => {
  test("应包含中/英/日三种语言", () => {
    expect(LOCALES).toHaveLength(3);
    const ids = LOCALES.map((l) => l.id);
    expect(ids).toEqual(["zh", "en", "ja"]);
  });

  test("三语字典应包含关键键", () => {
    (["zh", "en", "ja"] as const).forEach((locale) => {
      expect(DICTIONARY[locale]["nav.gallery"]).toBeDefined();
      expect(DICTIONARY[locale]["brand.line1"]).toBeDefined();
      expect(DICTIONARY[locale]["version.theme"]).toBeDefined();
    });
  });

  test("t 应按语言返回对应文案", () => {
    expect(t("nav.gallery", "zh")).toBe("画廊");
    expect(t("nav.gallery", "en")).toBe("Gallery");
    expect(t("nav.gallery", "ja")).toBe("ギャラリー");
  });

  test("t 未知 key 应回退到 key 本身", () => {
    expect(t("nonexistent.key", "en")).toBe("nonexistent.key");
  });

  test("setLocale 应更新当前语言并持久化", () => {
    setLocale("ja");
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(window.localStorage.getItem("yyc3-locale-v1")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    setLocale("zh");
  });

  test("setLocale 同语言时不应通知监听器", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLocale(listener);
    setLocale(getLocale()); // 相同语言
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  test("subscribeLocale 应在切换时通知并可取消", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLocale(listener);
    setLocale("ja");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setLocale("en");
    expect(listener).toHaveBeenCalledTimes(1);
    setLocale("zh");
  });

  test("useLocale 应为可用 hook", () => {
    expect(typeof useLocale).toBe("function");
  });

  test("t 应支持参数插值", () => {
    DICTIONARY.zh["test.interpolation"] = "共 {count} 项 · {name}";
    expect(t("test.interpolation", "zh", { count: "5", name: "作品" })).toBe(
      "共 5 项 · 作品",
    );
    delete DICTIONARY.zh["test.interpolation"];
  });

  test("模块加载应根据 navigator.language 自动检测语言", async () => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "language", {
      value: "ja-JP",
      configurable: true,
    });
    jest.resetModules();
    const mod = await import("../i18n");
    expect(mod.getLocale()).toBe("ja");
  });

  test("未知系统语言应回退中文", async () => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });
    jest.resetModules();
    const mod = await import("../i18n");
    expect(mod.getLocale()).toBe("zh");
  });
});
