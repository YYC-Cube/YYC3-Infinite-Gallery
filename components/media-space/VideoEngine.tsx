/**
 * @file ArtPlayer 视频引擎适配
 * @description 使用 ArtPlayer 渲染独立视频实例，并通过原生媒体事件同步 YYC³ 会话状态
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type Artplayer from "artplayer";
import type { MediaTrack } from "@/lib/media-store";
import {
  handleSessionEnded,
  setSessionDuration,
  setSessionPlaying,
  setSessionTime,
  setSessionVideoMetrics,
} from "@/lib/media-space/store";

interface VideoEngineProps {
  sessionId: string;
  track: MediaTrack;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  initialTime: number;
}

export interface VideoEngineHandle {
  seek: (time: number) => void;
  enterFullscreen: () => Promise<void>;
  pictureInPicture: () => Promise<void>;
}

const VideoEngine = forwardRef<VideoEngineHandle, VideoEngineProps>(
  function VideoEngine(
    { sessionId, track, isPlaying, volume, muted, initialTime },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Artplayer | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playingRef = useRef(isPlaying);
    const initialTimeRef = useRef(initialTime);
    const restoredRef = useRef(false);
    const [error, setError] = useState("");

    playingRef.current = isPlaying;
    initialTimeRef.current = initialTime;

    useEffect(() => {
      let cancelled = false;
      let cleanupVideoEvents = () => undefined;

      async function mountPlayer() {
        if (!containerRef.current) return;
        const { default: ArtPlayer } = await import("artplayer");
        if (cancelled || !containerRef.current) return;

        const art = new ArtPlayer({
          container: containerRef.current,
          url: track.src,
          poster: track.cover,
          type: "mp4",
          theme: "#d4a574",
          volume,
          muted,
          autoplay: false,
          loop: false,
          autoSize: false,
          autoMini: false,
          playbackRate: false,
          aspectRatio: false,
          setting: false,
          hotkey: false,
          pip: true,
          airplay: false,
          lock: false,
          gesture: false,
          fastForward: false,
          autoOrientation: false,
          miniProgressBar: false,
          mutex: false,
          backdrop: true,
          playsInline: true,
          moreVideoAttr: {
            playsInline: true,
            preload: "metadata",
          },
          controls: [],
          settings: [],
          contextmenu: [],
          layers: [],
        });

        playerRef.current = art;
        const video = art.video;
        videoRef.current = video;
        video.volume = volume;
        video.muted = muted;

        const restorePosition = () => {
          if (restoredRef.current) return;
          restoredRef.current = true;
          const time = initialTimeRef.current;
          if (time > 0 && Number.isFinite(video.duration)) {
            video.currentTime = Math.min(time, video.duration);
          }
        };
        const syncMetadata = () => {
          restorePosition();
          setSessionDuration(sessionId, video.duration);
          setSessionVideoMetrics(
            sessionId,
            video.videoWidth,
            video.videoHeight,
          );
          if (playingRef.current) {
            void video.play().catch(() => setSessionPlaying(sessionId, false));
          }
        };
        const onPlay = () => setSessionPlaying(sessionId, true);
        const onPause = () => setSessionPlaying(sessionId, false);
        const onTimeUpdate = () =>
          setSessionTime(sessionId, video.currentTime, video.duration);
        const onEnded = () => handleSessionEnded(sessionId);
        const onError = () => {
          setError("视频加载或解码失败");
          setSessionPlaying(sessionId, false);
        };

        video.addEventListener("loadedmetadata", syncMetadata);
        video.addEventListener("durationchange", syncMetadata);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("ended", onEnded);
        video.addEventListener("error", onError);
        cleanupVideoEvents = () => {
          video.removeEventListener("loadedmetadata", syncMetadata);
          video.removeEventListener("durationchange", syncMetadata);
          video.removeEventListener("play", onPlay);
          video.removeEventListener("pause", onPause);
          video.removeEventListener("timeupdate", onTimeUpdate);
          video.removeEventListener("ended", onEnded);
          video.removeEventListener("error", onError);
        };

        if (video.readyState >= 1) syncMetadata();
        else if (playingRef.current) {
          void video.play().catch(() => setSessionPlaying(sessionId, false));
        }
      }

      void mountPlayer();

      return () => {
        cancelled = true;
        cleanupVideoEvents();
        playerRef.current?.destroy(false);
        playerRef.current = null;
        videoRef.current = null;
      };
      // 会话级 ArtPlayer 实例只创建一次；曲目切换由下方原生媒体源更新处理。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const nextSrc = new URL(track.src, window.location.href).href;
      if (video.currentSrc === nextSrc || video.src === nextSrc) return;

      setError("");
      restoredRef.current = false;
      video.src = track.src;
      video.load();
      if (playerRef.current) playerRef.current.poster = track.cover;
      if (playingRef.current) {
        void video.play().catch(() => setSessionPlaying(sessionId, false));
      }
    }, [sessionId, track.cover, track.src]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isPlaying) {
        void video.play().catch(() => setSessionPlaying(sessionId, false));
      } else {
        video.pause();
      }
    }, [isPlaying, sessionId]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.volume = volume;
      video.muted = muted;
      if (playerRef.current) {
        playerRef.current.volume = volume;
        playerRef.current.muted = muted;
      }
    }, [muted, volume]);

    useImperativeHandle(
      ref,
      () => ({
        seek(time: number) {
          const video = videoRef.current;
          if (!video) return;
          video.currentTime = Math.max(
            0,
            Math.min(time, video.duration || time),
          );
        },
        async enterFullscreen() {
          try {
            const container = containerRef.current;
            if (!container) return;
            if (container.requestFullscreen) {
              await container.requestFullscreen();
            } else if (playerRef.current) {
              playerRef.current.fullscreenWeb = true;
            } else {
              setError("当前浏览器不支持全屏播放");
            }
          } catch {
            setError("当前浏览器不允许全屏播放");
          }
        },
        async pictureInPicture() {
          try {
            const video = videoRef.current;
            if (!video || !document.pictureInPictureEnabled) {
              setError("当前浏览器不支持画中画");
              return;
            }
            await video.requestPictureInPicture();
          } catch {
            setError("画中画启动失败，可能缺少浏览器权限");
          }
        },
      }),
      [],
    );

    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/80">
        <div
          ref={containerRef}
          className="h-full w-full [&_.art-video]:object-contain"
        />
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-4 text-center">
            <div className="space-y-1">
              <p className="text-xs text-red-200">{error}</p>
              <p className="text-[10px] text-white/40">
                可尝试切换其他视频或播放器形态
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default VideoEngine;
