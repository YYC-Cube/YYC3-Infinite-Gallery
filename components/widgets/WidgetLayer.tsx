/**
 * @file 自主页面组件层
 * @description 时钟、日历、天气和便签组件；支持拖拽、缩放、迷你形状和本地持久化
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  CalendarDays,
  CloudSun,
  Grip,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shapes,
  StickyNote,
} from "lucide-react";
import { hostFetch } from "@/lib/host-bridge";
import type { WidgetItem, WidgetShape } from "@/lib/widget-store";
import {
  WIDGET_CATALOG,
  WIDGET_SHAPES,
  focusWidget,
  setWidgetMinimized,
  setWidgetNotes,
  setWidgetShape,
  updateWidget,
  useWidgets,
} from "@/lib/widget-store";

const WEATHER_CACHE_KEY = "yyc3-weather-hangzhou-v1";

interface WeatherData {
  temperature: number;
  humidity: number;
  wind: number;
  code: number;
  updatedAt: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function weatherLabel(code: number): string {
  if (code === 0) return "晴朗";
  if (code <= 3) return "多云";
  if (code <= 48) return "雾霭";
  if (code <= 57) return "细雨";
  if (code <= 67) return "降雨";
  if (code <= 77) return "落雪";
  if (code <= 82) return "阵雨";
  if (code <= 86) return "阵雪";
  return "雷雨";
}

function useViewport() {
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return viewport;
}

export default function WidgetLayer() {
  const widgets = useWidgets();
  const viewport = useViewport();
  const enabled = widgets.order
    .map((id) => widgets.items[id])
    .filter((item): item is WidgetItem => Boolean(item?.enabled));

  if (enabled.length === 0) return null;

  return (
    <div aria-label="页面小组件层">
      {enabled.map((item) => (
        <WidgetCard key={item.id} widget={item} viewport={viewport} />
      ))}
    </div>
  );
}

function WidgetCard({
  widget,
  viewport,
}: {
  widget: WidgetItem;
  viewport: { width: number; height: number };
}) {
  const dragRef = useRef<{
    sx: number;
    sy: number;
    x: number;
    y: number;
  } | null>(null);
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    w: number;
    h: number;
  } | null>(null);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const compactSize =
    widget.shape === "circle"
      ? { width: 84, height: 84 }
      : widget.shape === "square"
        ? { width: 96, height: 96 }
        : widget.shape === "capsule"
          ? { width: 190, height: 68 }
          : { width: 72, height: 178 };
  const width = widget.minimized
    ? compactSize.width
    : Math.min(widget.w, viewport.width - 16);
  const height = widget.minimized
    ? compactSize.height
    : Math.min(widget.h, viewport.height - 16);
  const x = clamp(widget.x, 8, Math.max(8, viewport.width - width - 8));
  const y = clamp(widget.y, 8, Math.max(8, viewport.height - height - 8));

  useEffect(() => {
    // 仅时间/日历需要周期刷新：时钟每秒，日历每分钟
    if (widget.kind !== "clock" && widget.kind !== "calendar") return;
    const tick = () => setNow(new Date());
    tick();
    const interval = widget.kind === "clock" ? 1000 : 60_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, interval);
    return () => window.clearInterval(timer);
  }, [widget.kind]);

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    focusWidget(widget.id);
    if (
      (event.target as HTMLElement).closest("button, textarea, input, select")
    )
      return;
    dragRef.current = { sx: event.clientX, sy: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    updateWidget(widget.id, {
      x: clamp(
        drag.x + event.clientX - drag.sx,
        8,
        Math.max(8, viewport.width - width - 8),
      ),
      y: clamp(
        drag.y + event.clientY - drag.sy,
        8,
        Math.max(8, viewport.height - height - 8),
      ),
    });
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    focusWidget(widget.id);
    resizeRef.current = {
      sx: event.clientX,
      sy: event.clientY,
      w: width,
      h: height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    updateWidget(widget.id, {
      w: clamp(
        resize.w + event.clientX - resize.sx,
        160,
        viewport.width - x - 8,
      ),
      h: clamp(
        resize.h + event.clientY - resize.sy,
        92,
        viewport.height - y - 8,
      ),
    });
  };

  const onResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    resizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const shapeClass = widget.minimized
    ? widget.shape === "circle"
      ? "rounded-full"
      : widget.shape === "square"
        ? "rounded-2xl"
        : widget.shape === "capsule"
          ? "rounded-full px-5"
          : "rounded-full"
    : "rounded-2xl";

  return (
    <article
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      className={`fixed touch-none overflow-hidden border border-warm/25 bg-[#0b0907]/80 shadow-2xl backdrop-blur-xl ${shapeClass}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: 9000 + widget.z,
      }}
      aria-label={`${WIDGET_CATALOG.find((entry) => entry.kind === widget.kind)?.name ?? widget.kind}组件`}
    >
      {widget.minimized ? (
        <MinimizedWidget
          widget={widget}
          now={now}
          shapeOpen={shapeOpen}
          onToggleShape={() => setShapeOpen((value) => !value)}
          onExpand={() => setWidgetMinimized(widget.id, false)}
          onShape={(shape) => {
            setWidgetShape(widget.id, shape);
            setShapeOpen(false);
          }}
        />
      ) : (
        <ExpandedWidget
          widget={widget}
          now={now}
          onMinimize={() => setWidgetMinimized(widget.id, true)}
        />
      )}

      {!widget.minimized && (
        <div
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          className="absolute bottom-0 right-0 z-20 flex h-6 w-6 cursor-nwse-resize items-end justify-end p-1 text-warm-primary/40"
          title="缩放组件"
        >
          <Minimize2 size={9} className="rotate-90" />
        </div>
      )}
    </article>
  );
}

function WidgetShell({
  icon,
  title,
  action,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-warm/10 px-2.5">
        <span className="text-warm-primary/70">{icon}</span>
        <span className="flex-1 truncate font-mono text-[9px] tracking-[0.18em] text-white/45">
          {title}
        </span>
        <Grip size={10} className="text-white/15" />
        {action}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2.5">{children}</div>
    </div>
  );
}

function ExpandedWidget({
  widget,
  now,
  onMinimize,
}: {
  widget: WidgetItem;
  now: Date | null;
  onMinimize: () => void;
}) {
  const minimize = (
    <button
      type="button"
      onClick={onMinimize}
      className="rounded p-1 text-white/35 transition-colors hover:text-warm-primary"
      aria-label="缩小组件"
      title="缩小"
    >
      <Minimize2 size={11} />
    </button>
  );

  if (widget.kind === "clock") {
    return (
      <WidgetShell
        icon={<span className="text-[11px]">◷</span>}
        title="TIME · 宁静"
        action={minimize}
      >
        <ClockContent now={now} expanded />
      </WidgetShell>
    );
  }

  if (widget.kind === "calendar") {
    return (
      <WidgetShell
        icon={<CalendarDays size={12} />}
        title="CALENDAR"
        action={minimize}
      >
        <CalendarContent now={now} />
      </WidgetShell>
    );
  }

  if (widget.kind === "weather") {
    return (
      <WidgetShell
        icon={<CloudSun size={12} />}
        title="WEATHER · 杭州"
        action={minimize}
      >
        <WeatherContent />
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      icon={<StickyNote size={12} />}
      title="MEMO · 专属"
      action={minimize}
    >
      <textarea
        value={widget.notes}
        onChange={(event) => setWidgetNotes(widget.id, event.target.value)}
        placeholder="写下此刻的空间线索……"
        className="h-full w-full resize-none bg-transparent text-[11px] leading-relaxed text-white/65 outline-none placeholder:text-white/20"
      />
    </WidgetShell>
  );
}

function ClockContent({
  now,
  expanded = false,
}: {
  now: Date | null;
  expanded?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col ${expanded ? "justify-center" : "items-center justify-center"}`}
    >
      <p
        className={`${expanded ? "text-2xl" : "text-base"} font-light tracking-[0.08em] text-white/90 tabular-nums`}
      >
        {now
          ? now.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              second: expanded ? "2-digit" : undefined,
              hour12: false,
            })
          : "--:--"}
      </p>
      <p className="mt-1 text-[9px] font-mono tracking-[0.16em] text-warm-primary/55">
        {now
          ? now.toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })
          : "正在校准"}
      </p>
    </div>
  );
}

function CalendarContent({ now }: { now: Date | null }) {
  const date = now ?? new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - first.getDay() + 1;
    return day > 0 && day <= days ? day : null;
  });
  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 text-[10px] text-white/55">
        {date.getFullYear()} · {date.getMonth() + 1}月
      </p>
      <div className="grid grid-cols-7 gap-y-0.5 text-center font-mono text-[8px]">
        {week.map((item) => (
          <span key={item} className="text-white/25">
            {item}
          </span>
        ))}
        {cells.map((day, index) => (
          <span
            key={`${index}-${day ?? "empty"}`}
            className={
              day === date.getDate()
                ? "flex h-4 items-center justify-center rounded-full bg-warm-primary/25 text-warm-primary"
                : "text-white/40"
            }
          >
            {day ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeatherContent() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "fresh" | "cached" | "offline"
  >("loading");
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus((value) => (value === "cached" ? "cached" : "loading"));
    try {
      const response = await hostFetch(
        "https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai",
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("weather request failed");
      const payload = (await response.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
          wind_speed_10m?: number;
        };
      };
      const current = payload.current;
      if (!current || typeof current.temperature_2m !== "number") {
        throw new Error("weather payload invalid");
      }
      const next: WeatherData = {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m ?? 0,
        wind: current.wind_speed_10m ?? 0,
        code: current.weather_code ?? 0,
        updatedAt: Date.now(),
      };
      setWeather(next);
      setStatus("fresh");
      try {
        window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(next));
      } catch {
        /* 缓存写入失败不影响在线天气展示 */
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as WeatherData;
        if (Number.isFinite(parsed.temperature)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性读取离线天气缓存
          setWeather(parsed);
          setStatus("cached");
        }
      }
    } catch {
      /* 缓存无效时直接请求 */
    }
    void refresh();
    const retryTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 1800);
    const timer = window.setInterval(
      () => {
        if (document.visibilityState === "visible") void refresh();
      },
      15 * 60 * 1000,
    );
    return () => {
      window.clearTimeout(retryTimer);
      window.clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [refresh]);

  if (!weather) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <CloudSun size={20} className="text-warm-primary/45" />
        <p className="text-[10px] text-white/45">
          {status === "loading" ? "正在获取天气" : "天气暂不可用"}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-[8px] font-mono text-warm-primary/55 hover:text-warm-primary"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-light text-white/90 tabular-nums">
            {Math.round(weather.temperature)}°
          </p>
          <p className="text-[10px] text-warm-primary/60">
            {weatherLabel(weather.code)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded p-1 text-white/25 transition-colors hover:text-warm-primary"
          aria-label="刷新天气"
        >
          <RefreshCw size={10} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[8px] text-white/30">
        <span>湿度 {weather.humidity}%</span>
        <span>风速 {Math.round(weather.wind)} km/h</span>
      </div>
      <p className="mt-1 truncate text-[8px] text-white/20">
        {status === "offline"
          ? "离线 · 最近缓存"
          : status === "cached"
            ? "缓存数据 · 待刷新"
            : "Open-Meteo · 15min"}
      </p>
    </div>
  );
}

function MinimizedWidget({
  widget,
  now,
  shapeOpen,
  onToggleShape,
  onExpand,
  onShape,
}: {
  widget: WidgetItem;
  now: Date | null;
  shapeOpen: boolean;
  onToggleShape: () => void;
  onExpand: () => void;
  onShape: (shape: WidgetShape) => void;
}) {
  return (
    <div
      onDoubleClick={onExpand}
      className={`relative flex h-full w-full select-none ${
        widget.shape === "pill"
          ? "flex-col items-center justify-center gap-2 px-1"
          : widget.shape === "capsule"
            ? "items-center gap-2.5 px-3"
            : "flex-col items-center justify-center"
      }`}
      title="双击展开"
    >
      <button
        type="button"
        onClick={onExpand}
        className={`flex items-center justify-center text-warm-primary ${
          widget.shape === "pill" ? "h-9 w-9 rounded-full bg-warm/10" : ""
        }`}
        aria-label="展开组件"
      >
        {widget.kind === "clock" ? (
          <span className="text-[15px] font-light tabular-nums text-white/85">
            {now?.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }) ?? "--:--"}
          </span>
        ) : widget.kind === "weather" ? (
          <div className="text-center">
            <CloudSun size={19} />
            <p className="mt-0.5 text-[8px] text-white/45">杭州</p>
          </div>
        ) : widget.kind === "calendar" ? (
          <CalendarDays size={19} />
        ) : (
          <StickyNote size={19} />
        )}
      </button>
      {widget.shape === "capsule" && (
        <p className="min-w-0 flex-1 truncate text-[9px] text-white/40">
          {WIDGET_CATALOG.find((entry) => entry.kind === widget.kind)?.name}
        </p>
      )}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleShape();
        }}
        className={`absolute rounded-full border border-warm/20 bg-black/70 p-1 text-warm-primary/70 ${
          widget.shape === "pill" ? "bottom-1.5" : "right-1.5 top-1.5"
        }`}
        title="选择形状"
        aria-label="选择组件形状"
      >
        <Shapes size={10} />
      </button>
      {shapeOpen && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute left-1/2 top-[calc(100%+6px)] z-30 w-32 -translate-x-1/2 rounded-xl border border-warm/20 bg-[#0b0907]/95 p-1.5 shadow-2xl"
        >
          {WIDGET_SHAPES.filter((shape) =>
            (
              WIDGET_CATALOG.find((entry) => entry.kind === widget.kind)
                ?.shapes ?? []
            ).includes(shape.value),
          ).map((shape) => (
            <button
              type="button"
              key={shape.value}
              onClick={() => onShape(shape.value)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-[9px] ${
                widget.shape === shape.value
                  ? "bg-warm/15 text-warm-primary"
                  : "text-white/45 hover:bg-white/5"
              }`}
            >
              {shape.label}
              {widget.shape === shape.value && <Maximize2 size={8} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
