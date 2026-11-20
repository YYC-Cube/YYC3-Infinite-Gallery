/**
 * @file 收藏状态单元测试
 * @description 验证收藏切换、查询与持久化逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import {
  isFavorite,
  toggleFavorite,
  getFavoritesSnapshot,
  subscribeFavorites,
  useFavorites,
  FAVORITES_STORAGE_KEY,
} from "../favorites-store";

describe("favorites-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
    // 清空当前收藏（toggle 到空）
    getFavoritesSnapshot().slice().forEach((id) => toggleFavorite(id));
  });

  afterEach(() => jest.useRealTimers());

  test("初始应为空", () => {
    expect(getFavoritesSnapshot()).toEqual([]);
  });

  test("toggleFavorite 应添加并返回 true", () => {
    const result = toggleFavorite("track-1");
    expect(result).toBe(true);
    expect(isFavorite("track-1")).toBe(true);
  });

  test("再次 toggleFavorite 应移除并返回 false", () => {
    toggleFavorite("track-1");
    const result = toggleFavorite("track-1");
    expect(result).toBe(false);
    expect(isFavorite("track-1")).toBe(false);
  });

  test("应持久化到 localStorage", () => {
    toggleFavorite("track-2");
    jest.runAllTimers();
    const stored = JSON.parse(
      window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]",
    );
    expect(stored).toContain("track-2");
  });

  test("subscribeFavorites 应在变更时通知", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeFavorites(listener);
    toggleFavorite("track-3");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    toggleFavorite("track-4");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("useFavorites 应为可用 hook", () => {
    expect(typeof useFavorites).toBe("function");
  });
});
