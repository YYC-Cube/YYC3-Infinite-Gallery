/**
 * @file 页面组件状态
 * @description 预设小组件的启用、布局、迷你形状与本地持久化
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */

import { useSyncExternalStore } from "react";
import { hostStorageSet } from "@/lib/host-bridge";

export type WidgetKind = "clock" | "calendar" | "weather" | "notes";
export type WidgetShape = "circle" | "square" | "capsule" | "pill";

export interface WidgetItem {
  id: string;
  kind: WidgetKind;
  enabled: boolean;
  minimized: boolean;
  shape: WidgetShape;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  notes: string;
}

export interface WidgetState {
  version: 1;
  items: Record<string, WidgetItem>;
  order: string[];
}

export interface WidgetDefinition {
  kind: WidgetKind;
  name: string;
  description: string;
  source: string;
  refresh: string;
  defaultShape: WidgetShape;
  shapes: WidgetShape[];
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  {
    kind: "clock",
    name: "时间",
    description: "本地时钟与日期，不依赖网络。",
    source: "设备时间",
    refresh: "可见时每秒刷新",
    defaultShape: "circle",
    shapes: ["circle", "square", "capsule"],
  },
  {
    kind: "calendar",
    name: "日历",
    description: "今日日期与本周节奏。",
    source: "设备日期",
    refresh: "每分钟与跨日刷新",
    defaultShape: "square",
    shapes: ["square", "capsule"],
  },
  {
    kind: "weather",
    name: "天气",
    description: "默认杭州天气，离线显示最近缓存。",
    source: "Open-Meteo，经缓存降级",
    refresh: "可见且在线时每 15 分钟",
    defaultShape: "square",
    shapes: ["square", "capsule", "pill"],
  },
  {
    kind: "notes",
    name: "随手记",
    description: "独立空间内的轻量便签。",
    source: "本地存储",
    refresh: "编辑时保存",
    defaultShape: "capsule",
    shapes: ["square", "capsule", "pill"],
  },
];

export const WIDGET_SHAPES: { value: WidgetShape; label: string }[] = [
  { value: "circle", label: "圆形" },
  { value: "square", label: "圆角方形" },
  { value: "capsule", label: "横向胶囊" },
  { value: "pill", label: "竖向胶囊" },
];

const STORAGE_KEY = "yyc3-widget-space-v1";
const listeners = new Set<() => void>();

const DEFAULT_FRAMES: Record<
  WidgetKind,
  Pick<WidgetItem, "x" | "y" | "w" | "h">
> = {
  clock: { x: 24, y: 102, w: 210, h: 158 },
  calendar: { x: 24, y: 278, w: 246, h: 205 },
  weather: { x: 24, y: 500, w: 260, h: 180 },
  notes: { x: 286, y: 102, w: 270, h: 220 },
};

function createWidget(kind: WidgetKind, index: number): WidgetItem {
  const frame = DEFAULT_FRAMES[kind];
  const definition = WIDGET_CATALOG.find((item) => item.kind === kind);
  return {
    id: `widget-${kind}`,
    kind,
    enabled: false,
    minimized: false,
    shape: definition?.defaultShape ?? "square",
    ...frame,
    z: 20 + index,
    notes: "",
  };
}

function defaultState(): WidgetState {
  const items = Object.fromEntries(
    WIDGET_CATALOG.map((definition, index) => {
      const widget = createWidget(definition.kind, index);
      return [widget.id, widget];
    }),
  );
  return {
    version: 1,
    items,
    order: Object.keys(items),
  };
}

function restore(): WidgetState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<WidgetState>;
    const base = defaultState();
    if (!parsed.items || typeof parsed.items !== "object") return base;
    const items: Record<string, WidgetItem> = { ...base.items };
    for (const definition of WIDGET_CATALOG) {
      const saved = parsed.items[`widget-${definition.kind}`];
      const fallback = items[`widget-${definition.kind}`];
      if (!saved || !fallback || saved.kind !== definition.kind) continue;
      items[fallback.id] = {
        ...fallback,
        enabled: Boolean(saved.enabled),
        minimized: Boolean(saved.minimized),
        shape: definition.shapes.includes(saved.shape)
          ? saved.shape
          : fallback.shape,
        x: Number.isFinite(saved.x) ? saved.x : fallback.x,
        y: Number.isFinite(saved.y) ? saved.y : fallback.y,
        w: Number.isFinite(saved.w) ? Math.max(160, saved.w) : fallback.w,
        h: Number.isFinite(saved.h) ? Math.max(92, saved.h) : fallback.h,
        z: Number.isFinite(saved.z) ? saved.z : fallback.z,
        notes:
          typeof saved.notes === "string" ? saved.notes.slice(0, 2000) : "",
      };
    }
    return { version: 1, items, order: Object.keys(items) };
  } catch {
    return defaultState();
  }
}

let state = restore();
let persistTimer: number | null = null;

/** 服务端与首次水合固定返回默认组件状态 */
const SERVER_WIDGETS = defaultState();

function persist() {
  if (typeof window === "undefined") return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      void hostStorageSet(STORAGE_KEY, state);
    } catch {
      /* 本地存储不可用时仅保留当前会话 */
    }
    persistTimer = null;
  }, 350);
}

function emit(next: WidgetState) {
  state = next;
  listeners.forEach((listener) => listener());
  persist();
}

export function subscribeWidgets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWidgetsSnapshot(): WidgetState {
  return state;
}

export function useWidgets(): WidgetState {
  return useSyncExternalStore(
    subscribeWidgets,
    getWidgetsSnapshot,
    () => SERVER_WIDGETS,
  );
}

export function setWidgetEnabled(kind: WidgetKind, enabled: boolean) {
  const item = state.items[`widget-${kind}`];
  if (!item) return;
  const maxZ = Math.max(
    ...Object.values(state.items).map((widget) => widget.z),
  );
  emit({
    ...state,
    items: {
      ...state.items,
      [item.id]: {
        ...item,
        enabled,
        ...(enabled ? { z: maxZ + 1 } : {}),
      },
    },
  });
}

export function updateWidget(id: string, patch: Partial<WidgetItem>) {
  const item = state.items[id];
  if (!item) return;
  emit({
    ...state,
    items: { ...state.items, [id]: { ...item, ...patch } },
  });
}

export function setWidgetMinimized(
  id: string,
  minimized: boolean,
  shape?: WidgetShape,
) {
  const item = state.items[id];
  if (!item) return;
  const allowedShapes = WIDGET_CATALOG.find((entry) => entry.kind === item.kind)
    ?.shapes ?? ["square"];
  updateWidget(id, {
    minimized,
    shape: shape && allowedShapes.includes(shape) ? shape : item.shape,
  });
}

export function setWidgetShape(id: string, shape: WidgetShape) {
  const item = state.items[id];
  if (!item) return;
  const allowedShapes = WIDGET_CATALOG.find((entry) => entry.kind === item.kind)
    ?.shapes ?? ["square"];
  if (!allowedShapes.includes(shape)) return;
  updateWidget(id, { shape });
}

export function focusWidget(id: string) {
  const item = state.items[id];
  if (!item) return;
  const maxZ = Math.max(
    ...Object.values(state.items).map((widget) => widget.z),
  );
  updateWidget(id, { z: maxZ + 1 });
}

export function setWidgetNotes(id: string, notes: string) {
  updateWidget(id, { notes: notes.slice(0, 2000) });
}
