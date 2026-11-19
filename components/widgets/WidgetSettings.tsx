/**
 * @file 页面组件设置
 * @description 在配置面板中启用、禁用预设小组件并展示数据来源与刷新机制
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */
"use client";

import { CalendarDays, CloudSun, StickyNote } from "lucide-react";
import {
  WIDGET_CATALOG,
  setWidgetEnabled,
  useWidgets,
} from "@/lib/widget-store";
import type { WidgetKind } from "@/lib/widget-store";

function WidgetIcon({ kind }: { kind: WidgetKind }) {
  if (kind === "calendar") return <CalendarDays size={15} />;
  if (kind === "weather") return <CloudSun size={15} />;
  if (kind === "notes") return <StickyNote size={15} />;
  return <span className="text-sm tabular-nums">◷</span>;
}

export default function WidgetSettings() {
  const widgets = useWidgets();

  return (
    <div className="space-y-2.5">
      {WIDGET_CATALOG.map((definition) => {
        const item = widgets.items[`widget-${definition.kind}`];
        const enabled = Boolean(item?.enabled);
        return (
          <div
            key={definition.kind}
            className={`rounded-xl border p-3 transition-colors ${
              enabled
                ? "border-warm/25 bg-warm/5"
                : "border-warm/10 bg-black/15"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  enabled
                    ? "bg-warm/15 text-warm-primary"
                    : "bg-white/5 text-white/30"
                }`}
              >
                <WidgetIcon kind={definition.kind} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/65">{definition.name}</p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-white/25">
                  {definition.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWidgetEnabled(definition.kind, !enabled)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  enabled ? "bg-warm-primary/60" : "bg-white/10"
                }`}
                aria-label={`${enabled ? "禁用" : "启用"}${definition.name}组件`}
                aria-pressed={enabled}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>
            {enabled && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-warm/10 pt-2 font-mono text-[8px] text-white/25">
                <span>来源：{definition.source}</span>
                <span>刷新：{definition.refresh}</span>
              </div>
            )}
          </div>
        );
      })}
      <p className="pt-1 text-[9px] leading-relaxed text-white/20">
        启用后拖拽组件顶部移动，右下角缩放；双击或点击展开。缩小后可切换圆形、方形或胶囊形态，布局按当前设备保存。
      </p>
    </div>
  );
}
