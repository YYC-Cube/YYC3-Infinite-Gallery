/**
 * @file 独立媒体会话窗口
 * @description 音频与每个视频实例拥有独立控制、队列和空间背景；布局只改变窗口归属
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-19
 * @updated 2026-11-20
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Expand,
  GripVertical,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Upload,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { GalleryConfig } from "@/lib/config-store";
import { toggleFavorite, useFavorites } from "@/lib/favorites-store";
import { useMediaGestures } from "@/hooks/use-media-gestures";
import type { MediaSessionState, WindowFrame } from "@/lib/media-space/store";
import {
  cycleRepeat,
  focusSession,
  getSessionTrack,
  handleSessionEnded,
  removeSession,
  selectTrack,
  setSessionDuration,
  setSessionFrame,
  setSessionMuted,
  setSessionPlaying,
  setSessionSkin,
  setSessionTime,
  setSessionVolume,
  stepTrack,
  toggleSessionPlaying,
  toggleShuffle,
} from "@/lib/media-space/store";
import VideoEngine from "./VideoEngine";
import type { VideoEngineHandle } from "./VideoEngine";

interface SessionWindowProps {
  session: MediaSessionState;
  mode: "unified" | "split";
  config: GalleryConfig;
  canRemove: boolean;
  onUpload: (sessionId: string, files: FileList) => void;
}

const MIN_W = 280;
const MIN_H = 220;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function SessionWindow({
  session,
  mode,
  config,
  canRemove,
  onUpload,
}: SessionWindowProps) {
  const track = getSessionTrack(session);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<VideoEngineHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; frame: WindowFrame } | null>(
    null,
  );
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    frame: WindowFrame;
  } | null>(null);
  const restoredTimeRef = useRef(false);
  const pinchVolumeRef = useRef(session.volume);
  const [showQueue, setShowQueue] = useState(false);
  const [gestureTip, setGestureTip] = useState("");
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const favorites = useFavorites();

  const showGestureTip = useCallback((message: string) => {
    setGestureTip(message);
    window.setTimeout(() => setGestureTip(""), 1400);
  }, []);

  const gesture = useMediaGestures({
    onSwipeNext: () => {
      stepTrack(session.id, 1, true);
      showGestureTip("下一首");
    },
    onSwipePrev: () => {
      stepTrack(session.id, -1, true);
      showGestureTip("上一首");
    },
    onPinchStart: () => {
      pinchVolumeRef.current = session.volume;
    },
    onPinch: (scale) => {
      const next = Math.min(1, Math.max(0, pinchVolumeRef.current * scale));
      setSessionVolume(session.id, next);
    },
    onLongPress: () => {
      const item = getSessionTrack(session);
      if (!item) return;
      const added = toggleFavorite(item.id);
      showGestureTip(added ? "已收藏" : "已取消收藏");
    },
  });

  const currentTrackIsFavorite = track ? favorites.includes(track.id) : false;

  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    restoredTimeRef.current = false;
  }, [track?.src]);

  const maxWidth = Math.max(MIN_W, viewport.width - 16);
  const maxHeight = Math.max(MIN_H, viewport.height - 16);
  const displayFrame: WindowFrame = useMemo(
    () => ({
      x: clamp(
        session.frame.x,
        8,
        Math.max(8, viewport.width - Math.min(session.frame.w, maxWidth) - 8),
      ),
      y: clamp(
        session.frame.y,
        8,
        Math.max(8, viewport.height - Math.min(session.frame.h, maxHeight) - 8),
      ),
      w: clamp(session.frame.w, MIN_W, Math.min(880, maxWidth)),
      h: clamp(session.frame.h, MIN_H, Math.min(900, maxHeight)),
      z: session.frame.z,
    }),
    [maxHeight, maxWidth, session.frame, viewport.height, viewport.width],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || session.kind !== "audio") return;
    audio.volume = session.volume;
    audio.muted = session.muted;
    if (session.isPlaying) {
      void audio.play().catch(() => setSessionPlaying(session.id, false));
    } else {
      audio.pause();
    }
  }, [
    session.id,
    session.isPlaying,
    session.kind,
    session.muted,
    session.volume,
    track?.src,
  ]);

  const applyFrame = useCallback(
    (patch: Partial<WindowFrame>) => {
      const next = { ...displayFrame, ...patch };
      setSessionFrame(session.id, {
        x: clamp(
          next.x,
          8,
          Math.max(8, viewport.width - Math.min(next.w, maxWidth) - 8),
        ),
        y: clamp(
          next.y,
          8,
          Math.max(8, viewport.height - Math.min(next.h, maxHeight) - 8),
        ),
        w: clamp(next.w, MIN_W, Math.min(880, maxWidth)),
        h: clamp(next.h, MIN_H, Math.min(900, maxHeight)),
      });
    },
    [
      displayFrame,
      maxHeight,
      maxWidth,
      session.id,
      viewport.height,
      viewport.width,
    ],
  );

  const onHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    focusSession(session.id);
    if (
      mode !== "split" ||
      (event.target as HTMLElement).closest("button,select,input")
    ) {
      return;
    }
    dragRef.current = {
      sx: event.clientX,
      sy: event.clientY,
      frame: displayFrame,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    applyFrame({
      x: drag.frame.x + event.clientX - drag.sx,
      y: drag.frame.y + event.clientY - drag.sy,
    });
  };

  const endHeaderDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== "split") return;
    event.stopPropagation();
    resizeRef.current = {
      sx: event.clientX,
      sy: event.clientY,
      frame: displayFrame,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    applyFrame({
      w: resize.frame.w + event.clientX - resize.sx,
      h: resize.frame.h + event.clientY - resize.sy,
    });
  };

  const endResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    resizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.target.value);
    if (session.kind === "audio") {
      if (audioRef.current) audioRef.current.currentTime = time;
    } else {
      videoRef.current?.seek(time);
    }
    setSessionTime(session.id, time);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onUpload(session.id, event.target.files);
    }
    event.target.value = "";
  };

  const cycleSkin = () => {
    if (session.kind === "audio") {
      setSessionSkin(
        session.id,
        session.skin === "vinyl" ? "minimal" : "vinyl",
      );
      return;
    }
    const sequence = ["cinema", "standard", "minimal"] as const;
    const index = sequence.indexOf(session.skin as (typeof sequence)[number]);
    setSessionSkin(
      session.id,
      sequence[(index + 1) % sequence.length] ?? "cinema",
    );
  };

  const activeTrack = track;
  const isVideo = session.kind === "video";
  const frameStyle =
    mode === "split"
      ? {
          position: "fixed" as const,
          left: displayFrame.x,
          top: displayFrame.y,
          width: displayFrame.w,
          height: displayFrame.h,
          zIndex: displayFrame.z,
        }
      : undefined;

  return (
    <section
      style={frameStyle}
      data-session-kind={session.kind}
      data-skin={session.skin}
      data-orientation={isVideo ? session.orientation : undefined}
      className={`media-session group/session flex min-h-0 min-w-0 flex-col overflow-hidden border border-warm/20 bg-[#090807]/90 shadow-2xl backdrop-blur-xl ${
        mode === "unified" ? "relative h-full w-full rounded-xl" : "rounded-2xl"
      }`}
      onPointerDown={() => focusSession(session.id)}
      aria-label={`${session.label}，${activeTrack?.title ?? "暂无媒体"}`}
    >
      {/* 实例专有背景，未设置时继承页面背景 */}
      {(config.playerBackgroundImage || config.backgroundImage) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${config.playerBackgroundImage || config.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: config.playerBackgroundOpacity,
            filter: `blur(${config.playerBackgroundBlur}px)`,
            transform:
              config.playerBackgroundBlur > 0 ? "scale(1.04)" : undefined,
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/70" />

      <header
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endHeaderDrag}
        onPointerCancel={endHeaderDrag}
        className={`relative z-10 flex h-10 shrink-0 items-center gap-2 border-b border-warm/15 px-2.5 ${
          mode === "split"
            ? "cursor-grab touch-none active:cursor-grabbing"
            : ""
        }`}
      >
        {mode === "split" && (
          <GripVertical size={13} className="shrink-0 text-warm-primary/50" />
        )}
        {isVideo ? (
          <Video size={13} className="shrink-0 text-warm-primary" />
        ) : (
          <Disc3
            size={14}
            className={`shrink-0 text-warm-primary ${session.isPlaying ? "animate-spin" : ""}`}
            style={{ animationDuration: "6s" }}
          />
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-[0.18em] text-white/60">
          {session.label}
        </span>
        {isVideo && (
          <span className="rounded-full border border-warm/20 px-1.5 py-0.5 text-[8px] text-white/35">
            {session.orientation === "portrait" ? "竖屏" : "横屏"}
          </span>
        )}
        <span className="hidden text-[8px] text-white/25 sm:inline">
          {isVideo ? "ArtPlayer" : "Hi-Fi"}
        </span>
        <button
          type="button"
          onClick={cycleSkin}
          className="rounded-md p-1 text-white/40 transition-colors hover:text-warm-primary"
          title="切换播放器形态"
          aria-label="切换播放器形态"
        >
          <Expand size={12} />
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={() => removeSession(session.id)}
            className="rounded-md p-1 text-white/35 transition-colors hover:text-red-300"
            aria-label="关闭此视频实例"
            title="关闭实例"
          >
            <X size={13} />
          </button>
        )}
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
        {isVideo ? (
          <div
            {...gesture.handlers}
            className={`media-gesture-surface relative min-h-[80px] flex-1 touch-none overflow-hidden rounded-xl border border-warm/10 bg-black/60 ${
              session.orientation === "portrait"
                ? "mx-auto w-full max-w-[min(100%,48vh)]"
                : "w-full"
            } ${session.skin === "minimal" ? "shadow-none" : "shadow-[0_12px_40px_rgba(0,0,0,.35)]"}`}
          >
            {activeTrack && (
              <VideoEngine
                ref={videoRef}
                sessionId={session.id}
                track={activeTrack}
                isPlaying={session.isPlaying}
                volume={session.volume}
                muted={session.muted}
                initialTime={session.currentTime}
              />
            )}
            {(gesture.isLongPressing || gesture.pinchScale !== 1) && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                <span className="rounded-full border border-warm/30 bg-black/60 px-3 py-1.5 text-[10px] font-mono text-warm-primary">
                  {gesture.isLongPressing
                    ? "松开收藏"
                    : `音量 ${Math.round(session.volume * 100)}%`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            {...gesture.handlers}
            className="media-gesture-surface relative flex min-h-[104px] flex-1 touch-none items-center justify-center overflow-hidden rounded-xl border border-warm/10 bg-black/20"
          >
            <audio
              ref={audioRef}
              src={activeTrack?.src}
              preload="metadata"
              onLoadedMetadata={(event) => {
                setSessionDuration(session.id, event.currentTarget.duration);
                if (!restoredTimeRef.current && session.currentTime > 0) {
                  event.currentTarget.currentTime = Math.min(
                    session.currentTime,
                    event.currentTarget.duration || session.currentTime,
                  );
                  restoredTimeRef.current = true;
                }
              }}
              onTimeUpdate={(event) =>
                setSessionTime(session.id, event.currentTarget.currentTime)
              }
              onPlay={() => setSessionPlaying(session.id, true)}
              onPause={() => setSessionPlaying(session.id, false)}
              onEnded={() => handleSessionEnded(session.id)}
            />
            {activeTrack?.cover && (
              <img
                src={activeTrack.cover}
                alt=""
                draggable={false}
                className={`h-full w-full object-cover opacity-35 ${
                  session.skin === "vinyl"
                    ? "scale-110 blur-[1px] saturate-75"
                    : "saturate-50"
                }`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="relative flex flex-col items-center px-4 text-center">
              <div
                className={`mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-warm/30 bg-black/55 shadow-xl ${
                  session.skin === "vinyl" && session.isPlaying
                    ? "animate-spin"
                    : ""
                }`}
                style={{ animationDuration: "12s" }}
              >
                {activeTrack?.cover ? (
                  <img
                    src={activeTrack.cover}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <Music2 size={22} className="text-warm-primary/70" />
                )}
              </div>
              <p className="max-w-[260px] truncate text-sm text-white/90">
                {activeTrack?.title ?? "暂无音乐"}
              </p>
              <p className="mt-0.5 max-w-[260px] truncate text-[9px] font-mono tracking-wider text-white/35">
                {activeTrack?.artist} · {activeTrack?.album}
              </p>
            </div>

            {currentTrackIsFavorite && (
              <Heart
                size={14}
                className="absolute right-2 top-2 z-10 fill-warm-primary text-warm-primary"
                aria-label="已收藏"
              />
            )}
            {(gesture.isLongPressing || gesture.pinchScale !== 1) && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                <span className="rounded-full border border-warm/30 bg-black/60 px-3 py-1.5 text-[10px] font-mono text-warm-primary">
                  {gesture.isLongPressing
                    ? "松开收藏"
                    : `音量 ${Math.round(session.volume * 100)}%`}
                </span>
              </div>
            )}
          </div>
        )}

        {gestureTip && (
          <div className="pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2 rounded-full border border-warm/25 bg-[#0a0908]/85 px-3 py-1 text-[10px] font-mono text-warm-primary shadow-xl backdrop-blur-xl">
            {gestureTip}
          </div>
        )}

        <div className="shrink-0 space-y-1.5">
          <input
            type="range"
            min={0}
            max={session.duration || 0}
            step={0.1}
            value={Math.min(session.currentTime, session.duration || 0)}
            onChange={handleSeek}
            className="media-slider w-full"
            aria-label={`${session.label}播放进度`}
          />
          <div className="flex items-center justify-between font-mono text-[9px] text-white/30">
            <span>{formatTime(session.currentTime)}</span>
            <span>{formatTime(session.duration)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => toggleShuffle(session.id)}
            className={
              session.shuffle
                ? "text-warm-primary"
                : "text-white/35 hover:text-white"
            }
            aria-label="随机播放"
            title="随机播放"
          >
            <Shuffle size={12} />
          </button>
          <button
            type="button"
            onClick={() => stepTrack(session.id, -1, true)}
            className="text-white/55 transition-colors hover:text-white"
            aria-label="上一个"
          >
            <SkipBack size={15} />
          </button>
          <button
            type="button"
            onClick={() => toggleSessionPlaying(session.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-warm/40 bg-warm-primary/20 text-warm-primary transition-colors hover:bg-warm-primary/30"
            aria-label={session.isPlaying ? "暂停" : "播放"}
          >
            {session.isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            onClick={() => stepTrack(session.id, 1, true)}
            className="text-white/55 transition-colors hover:text-white"
            aria-label="下一个"
          >
            <SkipForward size={15} />
          </button>
          <button
            type="button"
            onClick={() => cycleRepeat(session.id)}
            className={
              session.repeat !== "off"
                ? "text-warm-primary"
                : "text-white/35 hover:text-white"
            }
            aria-label="循环模式"
            title={
              session.repeat === "one"
                ? "单曲循环"
                : session.repeat === "all"
                  ? "列表循环"
                  : "不循环"
            }
          >
            <Repeat size={12} />
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSessionMuted(session.id, !session.muted)}
              className="text-white/45 transition-colors hover:text-white"
              aria-label={session.muted ? "取消静音" : "静音"}
            >
              {session.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={session.volume}
              onChange={(event) =>
                setSessionVolume(session.id, Number(event.target.value))
              }
              className="media-slider w-16"
              aria-label={`${session.label}音量`}
            />
            <button
              type="button"
              onClick={() => setShowQueue((value) => !value)}
              className="text-white/40 transition-colors hover:text-warm-primary"
              aria-label="显示播放队列"
              title="播放队列"
            >
              {showQueue ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {isVideo && (
              <>
                <button
                  type="button"
                  onClick={() => void videoRef.current?.pictureInPicture()}
                  className="text-white/40 transition-colors hover:text-white"
                  aria-label="画中画"
                  title="画中画"
                >
                  <PictureInPicture2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void videoRef.current?.enterFullscreen()}
                  className="text-white/40 transition-colors hover:text-white"
                  aria-label="全屏"
                  title="全屏"
                >
                  <Maximize2 size={13} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-white/40 transition-colors hover:text-warm-primary"
              aria-label="添加本地媒体"
              title="添加本地媒体"
            >
              <Upload size={13} />
            </button>
          </div>
        </div>

        {showQueue && (
          <div className="absolute bottom-[92px] left-2 right-2 z-30 max-h-36 overflow-y-auto rounded-lg border border-warm/15 bg-[#0b0907]/95 p-1 shadow-2xl backdrop-blur-xl touch-pan-y">
            {session.queue.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => selectTrack(session.id, item.id, true)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  item.id === session.currentTrackId
                    ? "bg-warm/15 text-warm-primary"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <span className="shrink-0">
                  {item.kind === "video" ? (
                    <Video size={10} />
                  ) : (
                    <Music2 size={10} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px]">
                  {item.title}
                </span>
                {item.isLocal && (
                  <span className="text-[8px] text-white/25">本地</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "split" && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          className="absolute bottom-0 right-0 z-20 flex h-7 w-7 cursor-nwse-resize touch-none items-end justify-end p-1 text-warm-primary/45"
          title="拖拽调整窗口"
          aria-hidden
        >
          <Minimize2 size={10} className="rotate-90" />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={isVideo ? "video/*" : "audio/*"}
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded-full border border-warm/20 bg-black/50 px-2.5 py-1 text-[9px] text-white/45 opacity-0 backdrop-blur-md transition-opacity hover:text-warm-primary group-hover/session:opacity-100"
      >
        <Upload size={10} /> 本地
      </button>
      <span className="pointer-events-none absolute bottom-3 right-10 z-10 hidden items-center gap-1 text-[8px] font-mono text-white/20 sm:flex">
        <ListMusic size={9} /> {session.queue.length}
      </span>
    </section>
  );
}
