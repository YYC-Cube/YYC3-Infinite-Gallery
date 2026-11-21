/**
 * @file 独立媒体空间状态
 * @description 音频、视频和多视频实例各自持有队列、播放与音量状态；窗口布局独立于媒体实例
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */

import { useSyncExternalStore } from "react";
import { BUILTIN_TRACKS } from "@/lib/media-store";
import type { MediaTrack, RepeatMode } from "@/lib/media-store";
import { hostStorageSet } from "@/lib/host-bridge";

export type MediaSpaceMode = "unified" | "split";
export type PlayerSkin = "cinema" | "standard" | "minimal";
export type AudioSkin = "vinyl" | "minimal";

export interface WindowFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface MediaSessionState {
  id: string;
  kind: "audio" | "video";
  label: string;
  queue: MediaTrack[];
  currentTrackId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  skin: PlayerSkin | AudioSkin;
  orientation: "portrait" | "landscape";
  frame: WindowFrame;
}

export interface MediaSpaceState {
  version: 1;
  isOpen: boolean;
  mode: MediaSpaceMode;
  sessions: Record<string, MediaSessionState>;
  order: string[];
  activeSessionId: string;
}

const STORAGE_KEY = "yyc3-media-space-v1";
const MAX_VIDEO_SESSIONS = 4;
const AUDIO_SESSION_ID = "audio-main";
const VIDEO_SESSION_ID = "video-main";
const listeners = new Set<() => void>();

const AUDIO_TRACKS = BUILTIN_TRACKS.filter((track) => track.kind === "audio");
const VIDEO_TRACKS = BUILTIN_TRACKS.filter((track) => track.kind === "video");

function makeSession(
  kind: MediaSessionState["kind"],
  id: string,
  label: string,
  track: MediaTrack,
  frame: WindowFrame,
  skin: MediaSessionState["skin"],
): MediaSessionState {
  return {
    id,
    kind,
    label,
    queue: kind === "audio" ? [...AUDIO_TRACKS] : [...VIDEO_TRACKS],
    currentTrackId: track.id,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: kind === "audio" ? 0.72 : 0.55,
    muted: false,
    repeat: "all",
    shuffle: false,
    skin,
    orientation: "landscape",
    frame,
  };
}

function defaultState(): MediaSpaceState {
  const audioTrack = (AUDIO_TRACKS[0] ?? BUILTIN_TRACKS[0])!;
  const videoTrack = (VIDEO_TRACKS[0] ?? BUILTIN_TRACKS[0])!;
  const audio = makeSession(
    "audio",
    AUDIO_SESSION_ID,
    "音乐空间",
    audioTrack,
    { x: 24, y: 124, w: 360, h: 520, z: 40 },
    "vinyl",
  );
  const video = makeSession(
    "video",
    VIDEO_SESSION_ID,
    "影像空间",
    videoTrack,
    { x: 404, y: 124, w: 600, h: 380, z: 41 },
    "cinema",
  );

  return {
    version: 1,
    isOpen: true,
    mode: "split",
    sessions: { [audio.id]: audio, [video.id]: video },
    order: [audio.id, video.id],
    activeSessionId: video.id,
  };
}

function isTrackArray(value: unknown): value is MediaTrack[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const track = item as Partial<MediaTrack>;
      return (
        typeof track.id === "string" &&
        typeof track.title === "string" &&
        typeof track.src === "string" &&
        (track.kind === "audio" || track.kind === "video")
      );
    })
  );
}

function restoreFromStorage(): MediaSpaceState {
  if (typeof window === "undefined") return defaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<MediaSpaceState>;
    const base = defaultState();
    if (!parsed.sessions || typeof parsed.sessions !== "object") return base;

    const sessions: Record<string, MediaSessionState> = {};
    const order: string[] = [];

    for (const id of parsed.order ?? []) {
      const saved = parsed.sessions[id];
      if (!saved || (saved.kind !== "audio" && saved.kind !== "video")) {
        continue;
      }
      if (
        saved.kind === "video" &&
        order.filter((key) => sessions[key]?.kind === "video").length >=
          MAX_VIDEO_SESSIONS
      ) {
        continue;
      }

      const seed = saved.kind === "audio" ? AUDIO_TRACKS[0] : VIDEO_TRACKS[0];
      const savedQueue =
        Array.isArray(saved.queue) && isTrackArray(saved.queue)
          ? saved.queue.filter(
              (track) => !track.isLocal && track.kind === saved.kind,
            )
          : [];
      const queue =
        savedQueue.length > 0
          ? savedQueue
          : saved.kind === "audio"
            ? [...AUDIO_TRACKS]
            : [...VIDEO_TRACKS];
      const currentTrack =
        queue.find((track) => track.id === saved.currentTrackId) ??
        queue[0] ??
        seed;
      if (!currentTrack) continue;

      sessions[id] = {
        id,
        kind: saved.kind,
        label:
          typeof saved.label === "string"
            ? saved.label
            : saved.kind === "audio"
              ? "音乐空间"
              : "影像空间",
        queue,
        currentTrackId: currentTrack.id,
        currentTime: Number.isFinite(saved.currentTime)
          ? Math.max(0, saved.currentTime)
          : 0,
        duration: Number.isFinite(saved.duration)
          ? Math.max(0, saved.duration)
          : 0,
        isPlaying: false,
        volume: Number.isFinite(saved.volume)
          ? Math.min(1, Math.max(0, saved.volume))
          : 0.6,
        muted: Boolean(saved.muted),
        repeat:
          saved.repeat === "off" || saved.repeat === "one"
            ? saved.repeat
            : "all",
        shuffle: Boolean(saved.shuffle),
        skin:
          saved.skin === "cinema" ||
          saved.skin === "standard" ||
          saved.skin === "minimal" ||
          saved.skin === "vinyl"
            ? saved.skin
            : saved.kind === "audio"
              ? "vinyl"
              : "cinema",
        orientation:
          saved.orientation === "portrait" ? "portrait" : "landscape",
        frame: {
          x: Number.isFinite(saved.frame?.x)
            ? saved.frame.x
            : (base.sessions[VIDEO_SESSION_ID]?.frame.x ?? 24),
          y: Number.isFinite(saved.frame?.y)
            ? saved.frame.y
            : (base.sessions[VIDEO_SESSION_ID]?.frame.y ?? 124),
          w: Number.isFinite(saved.frame?.w)
            ? Math.max(260, saved.frame.w)
            : 480,
          h: Number.isFinite(saved.frame?.h)
            ? Math.max(180, saved.frame.h)
            : 340,
          z: Number.isFinite(saved.frame?.z) ? saved.frame.z : 40,
        },
      };
      order.push(id);
    }

    if (order.length === 0) return base;
    const active =
      typeof parsed.activeSessionId === "string" &&
      sessions[parsed.activeSessionId]
        ? parsed.activeSessionId
        : (order[0] ?? "");

    return {
      version: 1,
      isOpen: parsed.isOpen !== false,
      mode: parsed.mode === "unified" ? "unified" : "split",
      sessions,
      order,
      activeSessionId: active,
    };
  } catch {
    return defaultState();
  }
}

let state: MediaSpaceState = restoreFromStorage();
let persistTimer: number | null = null;

/** 服务端与首次水合固定返回默认媒体空间 */
const SERVER_MEDIA_SPACE = defaultState();

interface PersistOptions {
  /** 延迟毫秒数，默认 900ms */
  delay?: number;
  /** 是否重置已排队的持久化任务，默认 true */
  reset?: boolean;
}

function schedulePersist({ delay = 900, reset = true }: PersistOptions = {}) {
  if (typeof window === "undefined") return;
  if (persistTimer) {
    if (!reset) return;
    window.clearTimeout(persistTimer);
  }
  persistTimer = window.setTimeout(() => {
    try {
      const serializable: MediaSpaceState = {
        ...state,
        sessions: Object.fromEntries(
          Object.entries(state.sessions).map(([id, session]) => [
            id,
            {
              ...session,
              isPlaying: false,
              queue: session.queue.filter((track) => !track.isLocal),
            },
          ]),
        ),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      void hostStorageSet(STORAGE_KEY, serializable);
    } catch {
      /* 存储不可用时保持会话内存状态 */
    }
    persistTimer = null;
  }, delay);
}

function emit(next: MediaSpaceState, persist?: PersistOptions) {
  state = next;
  listeners.forEach((listener) => listener());
  schedulePersist(persist);
}

export function subscribeMediaSpace(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMediaSpaceSnapshot(): MediaSpaceState {
  return state;
}

export function useMediaSpace(): MediaSpaceState {
  return useSyncExternalStore(
    subscribeMediaSpace,
    getMediaSpaceSnapshot,
    () => SERVER_MEDIA_SPACE,
  );
}

export function getSessionTrack(
  session: MediaSessionState,
): MediaTrack | undefined {
  return (
    session.queue.find((track) => track.id === session.currentTrackId) ??
    session.queue[0]
  );
}

function patchSession(
  id: string,
  patch:
    | Partial<MediaSessionState>
    | ((session: MediaSessionState) => Partial<MediaSessionState>),
  persist?: PersistOptions,
) {
  const session = state.sessions[id];
  if (!session) return;
  const nextPatch = typeof patch === "function" ? patch(session) : patch;
  emit(
    {
      ...state,
      sessions: {
        ...state.sessions,
        [id]: { ...session, ...nextPatch },
      },
    },
    persist,
  );
}

export function setSpaceOpen(isOpen: boolean) {
  emit({ ...state, isOpen });
}

export function setSpaceMode(mode: MediaSpaceMode) {
  const next: MediaSpaceState = { ...state, mode, isOpen: true };
  if (mode === "split") next.sessions = arrangeSplitFrames(next);
  emit(next);
}

/**
 * 由设计系统同步布局模式：不强制打开媒体空间，模式相同时不产生写入。
 * 供 ThemeVersionProvider 与设置面板使用，保证布局只有一个事实源。
 */
export function syncSpaceMode(mode: MediaSpaceMode) {
  if (state.mode === mode) return;
  const next: MediaSpaceState = { ...state, mode };
  if (mode === "split") next.sessions = arrangeSplitFrames(next);
  emit(next);
}

function arrangeSplitFrames(
  current: MediaSpaceState,
): Record<string, MediaSessionState> {
  if (typeof window === "undefined") return current.sessions;
  const desktop = window.innerWidth >= 960;
  const videoIds = current.order.filter(
    (id) => current.sessions[id]?.kind === "video",
  );
  if (!desktop || videoIds.length > 2) return current.sessions;

  const top = 88;
  const left = 20;
  const gap = 10;
  const availableHeight = Math.max(440, window.innerHeight - top - 96);
  const audioWidth = Math.min(
    360,
    Math.max(300, Math.floor(window.innerWidth * 0.28)),
  );
  const videoX = left + audioWidth + 18;
  const videoWidth = Math.max(360, window.innerWidth - videoX - 20);
  const sessions = { ...current.sessions };
  const audio = current.order
    .map((id) => current.sessions[id])
    .find((session) => session?.kind === "audio");
  if (audio) {
    sessions[audio.id] = {
      ...audio,
      frame: {
        ...audio.frame,
        x: left,
        y: top,
        w: audioWidth,
        h: Math.min(540, availableHeight),
      },
    };
  }
  const sideBySide = videoIds.length === 2;
  const paneWidth = sideBySide
    ? Math.floor((videoWidth - gap) / 2)
    : videoWidth;
  videoIds.forEach((id, index) => {
    const session = sessions[id];
    if (!session) return;
    sessions[id] = {
      ...session,
      frame: {
        ...session.frame,
        x: sideBySide ? videoX + index * (paneWidth + gap) : videoX,
        y: top,
        w: paneWidth,
        h: availableHeight,
      },
    };
  });
  return sessions;
}

export function focusSession(id: string) {
  if (!state.sessions[id]) return;
  const maxZ = Math.max(
    ...Object.values(state.sessions).map((session) => session.frame.z),
  );
  emit({
    ...state,
    activeSessionId: id,
    sessions: {
      ...state.sessions,
      [id]: {
        ...state.sessions[id],
        frame: { ...state.sessions[id].frame, z: maxZ + 1 },
      },
    },
  });
}

export function setSessionFrame(id: string, frame: Partial<WindowFrame>) {
  patchSession(id, (session) => ({
    frame: { ...session.frame, ...frame },
  }));
}

export function toggleSessionPlaying(id: string) {
  patchSession(id, (session) => ({ isPlaying: !session.isPlaying }));
}

export function setSessionPlaying(id: string, isPlaying: boolean) {
  patchSession(id, { isPlaying });
}

export function setSessionTime(
  id: string,
  currentTime: number,
  duration?: number,
) {
  // 播放进度是高频事件：仅更新界面状态，持久化延后到 10s 且不打断已有写入计划
  patchSession(
    id,
    {
      currentTime: Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0,
      ...(Number.isFinite(duration)
        ? { duration: Math.max(0, duration ?? 0) }
        : {}),
    },
    { delay: 10_000, reset: false },
  );
}

export function setSessionDuration(id: string, duration: number) {
  patchSession(id, {
    duration: Number.isFinite(duration) ? Math.max(0, duration) : 0,
  });
}

export function setSessionVolume(id: string, volume: number) {
  patchSession(id, {
    volume: Math.min(1, Math.max(0, volume)),
    muted: false,
  });
}

export function setSessionMuted(id: string, muted: boolean) {
  patchSession(id, { muted });
}

export function setSessionSkin(id: string, skin: MediaSessionState["skin"]) {
  patchSession(id, { skin });
}

export function setSessionVideoMetrics(
  id: string,
  width: number,
  height: number,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return;
  }
  patchSession(id, {
    orientation: height > width ? "portrait" : "landscape",
  });
}

export function selectTrack(id: string, trackId: string, autoPlay = true) {
  patchSession(id, () => ({
    currentTrackId: trackId,
    currentTime: 0,
    duration: 0,
    isPlaying: autoPlay,
  }));
}

export function stepTrack(id: string, direction: -1 | 1, autoPlay = true) {
  const session = state.sessions[id];
  if (!session || session.queue.length === 0) return;
  const currentIndex = Math.max(
    0,
    session.queue.findIndex((track) => track.id === session.currentTrackId),
  );
  let nextIndex = currentIndex + direction;
  if (session.shuffle && session.queue.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * session.queue.length);
    } while (nextIndex === currentIndex);
  } else if (nextIndex >= session.queue.length) {
    nextIndex = 0;
  } else if (nextIndex < 0) {
    nextIndex = session.queue.length - 1;
  }
  const nextTrack = session.queue[nextIndex];
  if (!nextTrack) return;
  selectTrack(id, nextTrack.id, autoPlay);
}

export function handleSessionEnded(id: string) {
  const session = state.sessions[id];
  if (!session) return;
  if (session.repeat === "one") {
    patchSession(id, { currentTime: 0, isPlaying: true });
    return;
  }
  const currentIndex = session.queue.findIndex(
    (track) => track.id === session.currentTrackId,
  );
  const isLast = currentIndex === session.queue.length - 1;
  if (isLast && session.repeat === "off" && !session.shuffle) {
    patchSession(id, { isPlaying: false });
    return;
  }
  stepTrack(id, 1, true);
}

export function cycleRepeat(id: string) {
  patchSession(id, (session) => ({
    repeat:
      session.repeat === "off"
        ? "all"
        : session.repeat === "all"
          ? "one"
          : "off",
  }));
}

export function toggleShuffle(id: string) {
  patchSession(id, (session) => ({ shuffle: !session.shuffle }));
}

export function appendTracks(
  id: string,
  tracks: MediaTrack[],
  activate = true,
) {
  if (tracks.length === 0) return;
  patchSession(id, (session) => ({
    queue: [...session.queue, ...tracks],
    ...(activate && tracks[0]
      ? {
          currentTrackId: tracks[0].id,
          currentTime: 0,
          duration: 0,
          isPlaying: true,
        }
      : {}),
  }));
}

export function ensureLocalTrack(id: string, track: MediaTrack) {
  patchSession(id, (session) => {
    if (session.queue.some((item) => item.id === track.id)) return {};
    return { queue: [...session.queue, track] };
  });
}

export function addVideoSession(): string | null {
  const count = state.order.filter(
    (id) => state.sessions[id]?.kind === "video",
  ).length;
  if (count >= MAX_VIDEO_SESSIONS) return null;
  const usedTracks = new Set(
    state.order
      .map((id) => state.sessions[id])
      .filter((session): session is MediaSessionState =>
        Boolean(session && session.kind === "video"),
      )
      .map((session) => session.currentTrackId),
  );
  const track =
    VIDEO_TRACKS.find((item) => !usedTracks.has(item.id)) ??
    VIDEO_TRACKS[count % VIDEO_TRACKS.length];
  if (!track) return null;

  const id = `video-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const baseFrame = state.sessions[VIDEO_SESSION_ID]?.frame ?? {
    x: 404,
    y: 124,
    w: 600,
    h: 380,
    z: 41,
  };
  const session = makeSession(
    "video",
    id,
    `影像空间 ${count + 1}`,
    track,
    {
      x: Math.min(baseFrame.x + 34 * count, 900),
      y: Math.min(baseFrame.y + 34 * count, 600),
      w: baseFrame.w,
      h: baseFrame.h,
      z:
        Math.max(...Object.values(state.sessions).map((item) => item.frame.z)) +
        1,
    },
    "cinema",
  );
  session.queue = [...VIDEO_TRACKS];
  session.currentTrackId = track.id;

  const next: MediaSpaceState = {
    ...state,
    isOpen: true,
    sessions: { ...state.sessions, [id]: session },
    order: [...state.order, id],
    activeSessionId: id,
  };
  const nextVideoCount = count + 1;
  if (next.mode === "split") {
    if (
      nextVideoCount > 2 ||
      (typeof window !== "undefined" && window.innerWidth < 960)
    ) {
      next.mode = "unified";
    } else {
      next.sessions = arrangeSplitFrames(next);
    }
  }
  emit(next);
  return id;
}

export function removeSession(id: string) {
  if (id === AUDIO_SESSION_ID) return;
  const session = state.sessions[id];
  if (!session) return;
  if (session.kind === "video") {
    const videoCount = state.order.filter(
      (key) => state.sessions[key]?.kind === "video",
    ).length;
    if (videoCount <= 1) return;
  }
  const sessions = { ...state.sessions };
  delete sessions[id];
  const order = state.order.filter((key) => key !== id);
  const next: MediaSpaceState = {
    ...state,
    sessions,
    order,
    activeSessionId:
      state.activeSessionId === id ? (order[0] ?? "") : state.activeSessionId,
  };
  if (next.mode === "split") next.sessions = arrangeSplitFrames(next);
  emit(next);
}

export const MEDIA_SPACE_LIMITS = {
  audio: 1,
  video: MAX_VIDEO_SESSIONS,
} as const;

export const PRIMARY_SESSION_IDS = {
  audio: AUDIO_SESSION_ID,
  video: VIDEO_SESSION_ID,
} as const;
