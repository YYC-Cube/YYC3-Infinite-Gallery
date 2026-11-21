/**
 * @file 媒体收藏状态
 * @description 基于 trackId 的收藏集合，持久化到 localStorage，供长按收藏手势使用
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "yyc3-favorites-v1";
const listeners = new Set<() => void>();

function restore(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

let favorites: string[] = restore();
let persistTimer: number | null = null;

/** 服务端与首次水合固定返回空收藏，避免图标状态不一致 */
const SERVER_FAVORITES: string[] = [];

function persist() {
  if (typeof window === "undefined") return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* 存储不可用时保持内存状态 */
    }
    persistTimer = null;
  }, 300);
}

function emit(next: string[]) {
  favorites = next;
  listeners.forEach((listener) => listener());
  persist();
}

export function subscribeFavorites(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFavoritesSnapshot(): string[] {
  return favorites;
}

export function useFavorites(): string[] {
  return useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => SERVER_FAVORITES,
  );
}

export function isFavorite(trackId: string): boolean {
  return favorites.includes(trackId);
}

/** 切换收藏，返回切换后是否为收藏状态 */
export function toggleFavorite(trackId: string): boolean {
  const willFavorite = !favorites.includes(trackId);
  emit(
    willFavorite
      ? [...favorites, trackId]
      : favorites.filter((id) => id !== trackId),
  );
  return willFavorite;
}

export const FAVORITES_STORAGE_KEY = STORAGE_KEY;
