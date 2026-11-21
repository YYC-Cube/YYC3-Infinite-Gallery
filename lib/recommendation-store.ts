/**
 * @file 个性化推荐引擎
 * @description 采集画廊作品曝光/互动行为，本地计算偏好权重并生成推荐排序
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "yyc3-recommendation-v1";

export interface ImageAffinity {
  /** 累计曝光时长（ms） */
  exposureMs: number;
  /** 互动次数（点击/悬停） */
  interactions: number;
  /** 最近一次曝光时间戳 */
  lastSeenAt: number;
}

export interface RecommendationState {
  version: 1;
  enabled: boolean;
  affinity: Record<string, ImageAffinity>;
  updatedAt: number;
}

const listeners = new Set<() => void>();

function defaultState(): RecommendationState {
  return { version: 1, enabled: true, affinity: {}, updatedAt: Date.now() };
}

function restore(): RecommendationState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<RecommendationState>;
    const affinity: Record<string, ImageAffinity> = {};
    if (parsed.affinity && typeof parsed.affinity === "object") {
      for (const [key, value] of Object.entries(parsed.affinity)) {
        if (!value || typeof value !== "object") continue;
        affinity[key] = {
          exposureMs: Number.isFinite(value.exposureMs)
            ? Math.max(0, value.exposureMs)
            : 0,
          interactions: Number.isFinite(value.interactions)
            ? Math.max(0, value.interactions)
            : 0,
          lastSeenAt: Number.isFinite(value.lastSeenAt)
            ? value.lastSeenAt
            : 0,
        };
      }
    }
    return {
      version: 1,
      enabled: parsed.enabled !== false,
      affinity,
      updatedAt:
        typeof parsed.updatedAt === "number" &&
        Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : Date.now(),
    };
  } catch {
    return defaultState();
  }
}

let state: RecommendationState = restore();
let persistTimer: number | null = null;

function persist() {
  if (typeof window === "undefined") return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 存储不可用忽略 */
    }
    persistTimer = null;
  }, 1000);
}

function emit(next: RecommendationState) {
  state = next;
  listeners.forEach((listener) => listener());
  persist();
}

export function subscribeRecommendation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecommendationSnapshot(): RecommendationState {
  return state;
}

export function useRecommendation(): RecommendationState {
  return useSyncExternalStore(
    subscribeRecommendation,
    getRecommendationSnapshot,
    getRecommendationSnapshot,
  );
}

export function setRecommendationEnabled(enabled: boolean) {
  emit({ ...state, enabled, updatedAt: Date.now() });
}

/** 记录作品曝光时长 */
export function recordExposure(imageId: string, deltaMs: number) {
  if (!state.enabled || deltaMs <= 0) return;
  const current = state.affinity[imageId] ?? {
    exposureMs: 0,
    interactions: 0,
    lastSeenAt: 0,
  };
  emit({
    ...state,
    affinity: {
      ...state.affinity,
      [imageId]: {
        exposureMs: current.exposureMs + deltaMs,
        interactions: current.interactions,
        lastSeenAt: Date.now(),
      },
    },
    updatedAt: Date.now(),
  });
}

/** 记录作品互动（点击/悬停） */
export function recordInteraction(imageId: string) {
  if (!state.enabled) return;
  const current = state.affinity[imageId] ?? {
    exposureMs: 0,
    interactions: 0,
    lastSeenAt: 0,
  };
  emit({
    ...state,
    affinity: {
      ...state.affinity,
      [imageId]: {
        exposureMs: current.exposureMs,
        interactions: current.interactions + 1,
        lastSeenAt: Date.now(),
      },
    },
    updatedAt: Date.now(),
  });
}

/** 计算单个作品的偏好得分（对数衰减，避免单一作品过度主导） */
export function affinityScore(affinity: ImageAffinity | undefined): number {
  if (!affinity) return 0;
  const exposure = Math.log10(1 + affinity.exposureMs / 1000) * 2;
  const interaction = Math.log10(1 + affinity.interactions) * 3;
  return exposure + interaction;
}

/**
 * 基于偏好对图片序列重新排序：按得分降序，未浏览作品得分为 0 排在后面；
 * 得分相同时保持原顺序，避免完全打乱当前视觉节奏。
 */
export function recommendOrder<T extends { src: string }>(
  images: T[],
  affinity: Record<string, ImageAffinity>,
  enabled = true,
): T[] {
  if (!enabled || images.length === 0) return images;
  const scored = images.map((image, index) => ({
    image,
    index,
    score: affinityScore(affinity[image.src]),
  }));
  // 稳定排序：得分降序；得分相同时保持原顺序
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((item) => item.image);
}

export function clearRecommendationData() {
  emit(defaultState());
}

export const RECOMMENDATION_STORAGE_KEY = STORAGE_KEY;
