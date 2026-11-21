/**
 * @file 自主媒体空间
 * @description 统一界面与独立浮窗共用同一组媒体实例，切换布局不重建播放状态
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-19
 * @updated 2026-11-20
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Columns3,
  Disc3,
  LayoutPanelTop,
  Maximize2,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  Sparkles,
  Undo2,
  Video,
} from "lucide-react";
import type { GalleryConfig } from "@/lib/config-store";
import type { MediaTrack } from "@/lib/media-store";
import type { MediaSessionState } from "@/lib/media-space/store";
import { loadMediaFiles, storeMediaFile } from "@/lib/media-db";
import { syncMediaManifest } from "@/lib/media-sync";
import { setLayout } from "@/lib/version-store";
import {
  addVideoSession,
  appendTracks,
  ensureLocalTrack,
  getSessionTrack,
  MEDIA_SPACE_LIMITS,
  PRIMARY_SESSION_IDS,
  restoreAllWindows,
  setSessionWindow,
  setSpaceMode,
  setSpaceOpen,
  toggleSessionPlaying,
  useMediaSpace,
} from "@/lib/media-space/store";
import SessionWindow from "./SessionWindow";

interface MediaSpaceProps {
  config: GalleryConfig;
}

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const MAX_LOCAL_TRACKS = 50;

function backgroundStyle(config: GalleryConfig) {
  const image = config.playerBackgroundImage || config.backgroundImage;
  if (!image) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(8,7,6,${0.2 + config.playerBackgroundOpacity * 0.4}), rgba(8,7,6,0.86)), url(${image})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter:
      config.playerBackgroundBlur > 0
        ? `blur(${config.playerBackgroundBlur * 0.5}px)`
        : undefined,
  };
}

export default function MediaSpace({ config }: MediaSpaceProps) {
  const space = useMediaSpace();
  const localUrlsRef = useRef<string[]>([]);
  const hydratedRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);
  const [compact, setCompact] = useState(false);
  const [notice, setNotice] = useState("");
  const effectiveMode = compact ? "unified" : space.mode;

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const sessions = useMemo(
    () =>
      space.order
        .map((id) => space.sessions[id])
        .filter((session): session is MediaSessionState => Boolean(session)),
    [space.order, space.sessions],
  );
  const audioSession = sessions.find((session) => session.kind === "audio");
  const videoSessions = sessions.filter((session) => session.kind === "video");
  const videoCount = videoSessions.length;
  const currentAudio = audioSession ? getSessionTrack(audioSession) : undefined;
  const playingCount = sessions.filter((session) => session.isPlaying).length;
  /** 处于最小化状态的容器：统一收纳到底部任务坞 */
  const minimizedSessions = useMemo(
    () => sessions.filter((session) => session.windowState === "minimized"),
    [sessions],
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    void loadMediaFiles().then((stored) => {
      for (const item of stored) {
        const isVideo = item.file.type.startsWith("video/");
        const src = URL.createObjectURL(item.file);
        localUrlsRef.current.push(src);
        const track: MediaTrack = {
          id: item.id,
          title: item.file.name.replace(/\.[^.]+$/, ""),
          artist: "本地上传",
          album: isVideo ? "我的影像" : "我的收藏",
          cover: "/artist-4x3/Music-1990.jpg",
          src,
          kind: isVideo ? "video" : "audio",
          isLocal: true,
        };
        const target = isVideo
          ? PRIMARY_SESSION_IDS.video
          : PRIMARY_SESSION_IDS.audio;
        ensureLocalTrack(target, track);
      }
    });

    // 仅在媒体空间卸载时释放本地上传的 blob URL，避免切歌依赖变化提前回收
    return () => {
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localUrlsRef.current = [];
    };
  }, []);

  const handleUpload = useCallback(
    async (sessionId: string, files: FileList) => {
      const target = space.sessions[sessionId];
      if (!target) return;

      const all = Array.from(files);
      const usable = all.filter((file) => {
        const typeMatches =
          target.kind === "video"
            ? file.type.startsWith("video/")
            : file.type.startsWith("audio/");
        return typeMatches && file.size <= MAX_UPLOAD_BYTES;
      });

      if (usable.length === 0) {
        showNotice(
          `仅支持${target.kind === "video" ? "视频" : "音频"}，且单个文件不超过 200MB`,
        );
        return;
      }

      const localCount = target.queue.filter((track) => track.isLocal).length;
      const remaining = Math.max(0, MAX_LOCAL_TRACKS - localCount);
      if (remaining === 0) {
        showNotice(`本地媒体最多 ${MAX_LOCAL_TRACKS} 个`);
        return;
      }

      const batch = usable.slice(0, remaining);
      if (all.length > batch.length) {
        showNotice(
          `已忽略 ${all.length - batch.length} 个不支持、超限或超出数量的文件`,
        );
      }

      const added: MediaTrack[] = [];
      let failed = 0;
      for (const file of batch) {
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const src = URL.createObjectURL(file);
        const stored = await storeMediaFile(id, file);
        if (!stored) {
          URL.revokeObjectURL(src);
          failed += 1;
          continue;
        }
        localUrlsRef.current.push(src);
        added.push({
          id,
          title: file.name.replace(/\.[^.]+$/, ""),
          artist: "本地上传",
          album: target.kind === "video" ? "我的影像" : "我的收藏",
          cover: getSessionTrack(target)?.cover ?? "",
          src,
          kind: target.kind,
          isLocal: true,
        });
      }

      if (failed > 0) {
        showNotice("部分文件保存失败，可能是浏览器存储空间不足");
      }
      if (added.length === 0) return;

      appendTracks(sessionId, added, true);
      if (failed === 0) {
        showNotice(
          `已添加 ${added.length} 个本地${target.kind === "video" ? "视频" : "音频"}`,
        );
      }
      // 元数据清单同步：离线时自动进入宿主 outbox，联网后补传
      void syncMediaManifest();
    },
    [showNotice, space.sessions],
  );

  const handleAddVideo = () => {
    addVideoSession();
  };

  if (!space.isOpen) {
    return (
      <button
        type="button"
        onClick={() => setSpaceOpen(true)}
        className="fixed bottom-24 left-5 z-[9000] flex h-14 w-14 touch-none items-center justify-center rounded-full border border-warm/30 bg-[#0b0907]/80 text-warm-primary shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 animate-pulse-glow sm:left-6"
        title={`打开自主媒体空间${playingCount > 0 ? ` · ${playingCount} 个实例播放中` : ""}`}
        aria-label="打开自主媒体空间"
      >
        {currentAudio?.cover ? (
          <img
            src={currentAudio.cover}
            alt=""
            className="absolute inset-0 h-full w-full rounded-full object-cover opacity-35"
          />
        ) : null}
        <span className="relative">
          <Disc3
            size={21}
            className={playingCount > 0 ? "animate-spin" : ""}
            style={{ animationDuration: "6s" }}
          />
        </span>
        {playingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warm-primary px-1 text-[9px] font-bold text-black">
            {playingCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="media-space-root"
      data-mode={effectiveMode}
      aria-label="自主媒体空间"
    >
      <div
        className="media-space-backdrop"
        aria-hidden
        style={backgroundStyle(config)}
      />

      {notice && (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-16 z-[9100] -translate-x-1/2 rounded-full border border-warm/25 bg-[#0a0908]/90 px-3 py-1.5 text-[10px] text-white/70 shadow-xl backdrop-blur-xl"
        >
          {notice}
        </div>
      )}

      <div className="media-space-chrome">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-warm/25 bg-warm/10 text-warm-primary">
            <Sparkles size={14} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-cormorant)] text-sm italic text-white/80">
              Autonomous Media Space
            </p>
            <p className="hidden text-[8px] font-mono tracking-[0.18em] text-white/30 sm:block">
              {playingCount > 0 ? `${playingCount} PLAYING · ` : ""}
              {audioSession ? "AUDIO" : ""}{" "}
              {videoCount > 0 ? `· ${videoCount} VIDEO` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!compact && (
            <button
              type="button"
              onClick={() => {
                const nextMode =
                  space.mode === "unified" ? "split" : "unified";
                setSpaceMode(nextMode);
                // 同步设计系统版本，避免两套布局状态分叉
                setLayout(nextMode);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-warm/20 bg-black/25 px-2.5 py-1.5 text-[10px] text-white/55 transition-colors hover:border-warm/40 hover:text-warm-primary"
              title={
                space.mode === "unified" ? "拆分为独立窗口" : "合并为统一界面"
              }
            >
              {space.mode === "unified" ? (
                <Columns3 size={12} />
              ) : (
                <LayoutPanelTop size={12} />
              )}
              <span className="hidden sm:inline">
                {space.mode === "unified" ? "拆分" : "合并"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAddVideo}
            disabled={videoCount >= MEDIA_SPACE_LIMITS.video}
            className="flex items-center gap-1.5 rounded-lg border border-warm/20 bg-black/25 px-2.5 py-1.5 text-[10px] text-white/55 transition-colors hover:border-warm/40 hover:text-warm-primary disabled:cursor-not-allowed disabled:opacity-30"
            title={
              videoCount >= MEDIA_SPACE_LIMITS.video
                ? "已达到视频实例上限"
                : "新建视频实例"
            }
          >
            <Plus size={12} />
            <span className="hidden sm:inline">视频</span>
          </button>
          <button
            type="button"
            onClick={() => setSpaceOpen(false)}
            className="rounded-lg border border-warm/20 bg-black/25 p-1.5 text-white/40 transition-colors hover:border-warm/40 hover:text-white"
            aria-label="收起媒体空间"
            title="收起"
          >
            <Minus size={13} />
          </button>
        </div>
      </div>

      {audioSession && (
        <SessionWindow
          session={audioSession}
          mode={effectiveMode}
          config={config}
          canRemove={false}
          onUpload={handleUpload}
        />
      )}

      <div
        className="media-video-lane"
        data-count={videoCount}
        data-mode={effectiveMode}
      >
        {videoSessions.map((session) => (
          <SessionWindow
            key={session.id}
            session={session}
            mode={effectiveMode}
            config={config}
            canRemove={videoCount > 1}
            onUpload={handleUpload}
          />
        ))}
        {videoCount === 0 && (
          <button
            type="button"
            onClick={handleAddVideo}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-warm/20 text-white/30 transition-colors hover:border-warm/40 hover:text-warm-primary"
          >
            <Video size={24} />
            <span className="text-xs">打开一个独立影像空间</span>
          </button>
        )}
      </div>

      {/* 统一最小化任务坞：所有容器（音频/视频实例）共用同一收纳区 */}
      {minimizedSessions.length > 0 && (
        <div
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-[9650] flex max-w-[calc(100vw-24px)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-warm/25 bg-[#0b0907]/92 p-1.5 shadow-2xl backdrop-blur-xl"
          role="toolbar"
          aria-label="最小化容器任务坞"
        >
          {minimizedSessions.map((mini) => {
            const miniTrack = getSessionTrack(mini);
            const miniIcon =
              mini.kind === "audio" ? (
                <Disc3
                  size={13}
                  className={`shrink-0 text-warm-primary ${mini.isPlaying ? "animate-spin" : ""}`}
                  style={{ animationDuration: "6s" }}
                />
              ) : (
                <Video size={13} className="shrink-0 text-warm-primary" />
              );
            return (
              <div
                key={mini.id}
                data-session-kind={mini.kind}
                data-window-mode="minimized"
                aria-label={`${mini.label}，${miniTrack?.title ?? "暂无媒体"}（已最小化）`}
                className="flex items-center gap-1 rounded-xl border border-warm/15 bg-black/35 py-0.5 pl-2 pr-0.5"
              >
                {miniIcon}
                <span className="max-w-28 truncate text-[10px] text-white/60">
                  {mini.label}
                  {miniTrack?.title ? ` · ${miniTrack.title}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSessionPlaying(mini.id)}
                  className="rounded-md p-1 text-warm-primary transition-colors hover:text-white"
                  aria-label={`${mini.label}${mini.isPlaying ? " 暂停" : " 播放"}`}
                  title={mini.isPlaying ? "暂停" : "播放"}
                >
                  {mini.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setSessionWindow(mini.id, "normal")}
                  className="rounded-md p-1 text-white/45 transition-colors hover:text-warm-primary"
                  aria-label={`还原窗口 ${mini.label}`}
                  title="还原窗口"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
            );
          })}
          {minimizedSessions.length > 1 && (
            <button
              type="button"
              onClick={restoreAllWindows}
              className="flex items-center gap-1 rounded-xl border border-warm/20 bg-black/25 px-2 py-1 text-[9px] text-white/50 transition-colors hover:border-warm/40 hover:text-warm-primary"
              title="还原全部最小化容器"
            >
              <Undo2 size={11} />
              全部还原
            </button>
          )}
        </div>
      )}

      {effectiveMode === "split" && (
        <div className="pointer-events-none fixed bottom-[calc(132px+env(safe-area-inset-bottom))] left-1/2 z-[9001] -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-warm/20 bg-[#0a0908]/80 px-3 py-1.5 text-[9px] text-white/35 shadow-xl backdrop-blur-xl">
            <Music2 size={10} />
            <span>拖动标题栏移动</span>
            <span className="text-white/15">|</span>
            <span>右下角缩放</span>
            <span className="text-white/15">|</span>
            <span>各实例独立播放与控制</span>
          </div>
        </div>
      )}
    </div>
  );
}
