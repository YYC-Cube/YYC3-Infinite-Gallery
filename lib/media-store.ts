/**
 * @file 媒体资源与播放器状态管理
 * @description 统一管理画廊图源、内置音视频曲目、悬浮播放器布局的本地持久化
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-18
 * @updated 2026-11-22
 */

import { mediaUrl } from "@/lib/media-url";

export type MediaKind = "audio" | "video";
export type RepeatMode = "off" | "all" | "one";
export type PlayerMode = "collapsed" | "panel";

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  src: string;
  kind: MediaKind;
  /** 用户本地上传的曲目（blob URL + IndexedDB 持久化） */
  isLocal?: boolean;
}

export interface PlayerLayout {
  /** 面板左上角横坐标 */
  x: number;
  /** 面板左上角纵坐标 */
  y: number;
  /** 面板宽度 */
  w: number;
  /** 面板高度 */
  h: number;
  volume: number;
  muted: boolean;
  mode: PlayerMode;
  /** 缩小为紧凑条 */
  compact: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
}

const LAYOUT_STORAGE_KEY = "yyc3-gallery-media-layout";

export const DEFAULT_LAYOUT: PlayerLayout = {
  x: 20,
  y: 0,
  w: 380,
  h: 540,
  volume: 0.8,
  muted: false,
  mode: "collapsed",
  compact: false,
  repeat: "off",
  shuffle: false,
};

/* ========================================
   画廊图源（路径统一使用 public 下的新目录）
   ======================================== */
const LANDSCAPE_YEARS = [
  1979, 1980, 1981, 1982, 1983, 1990, 1992, 1995,
] as const;

export const PORTRAIT_IMAGES: string[] = Array.from(
  { length: 10 },
  (_, index) => mediaUrl(`/artist-3x4/${index}.webp`),
);
export const LANDSCAPE_IMAGES: string[] = LANDSCAPE_YEARS.map(
  (year) => mediaUrl(`/artist-4x3/Music-${year}.jpg`),
);
/** 画廊完整图源：3:4 + 4:3 */
export const GALLERY_IMAGES: string[] = [
  ...PORTRAIT_IMAGES,
  ...LANDSCAPE_IMAGES,
];

/* ========================================
   内置曲目
   ======================================== */
const MP3_FILES = [
  "董小姐 - 半生清醒.mp3",
  "董小姐 - 半世浮生.mp3",
  "董小姐 - 伴世浮生.mp3",
  "董小姐 - 不负流年.mp3",
  "董小姐 - 浮渡.mp3",
  "董小姐 - 浮生如渡.mp3",
  "董小姐 - 时光温柔倚梦行.mp3",
  "董小姐 - 时间都去哪了.mp3",
  "董小姐 - 岁月尘烟.mp3",
  "董小姐 - 岁月如歌.mp3",
  "董小姐 - 醍醐灌顶.mp3",
  "董小姐 - 忘了曾经忘了累.mp3",
  "董小姐 - 唯一的色彩.mp3",
  "董小姐 - 我的宝贝.mp3",
  "董小姐 - 幸福的脸.mp3",
] as const;

interface VideoSource {
  year: number;
  dir: "mv-3x4" | "mv-4x3";
  cover: string;
}

const VIDEO_FILES: VideoSource[] = [
  { year: 1990, dir: "mv-3x4", cover: "/artist-4x3/Music-1990.jpg" },
  { year: 1991, dir: "mv-3x4", cover: "/artist-3x4/0.webp" },
  { year: 1992, dir: "mv-3x4", cover: "/artist-4x3/Music-1992.jpg" },
  { year: 1993, dir: "mv-3x4", cover: "/artist-3x4/1.webp" },
  { year: 1995, dir: "mv-3x4", cover: "/artist-4x3/Music-1995.jpg" },
  { year: 1989, dir: "mv-4x3", cover: "/artist-4x3/Music-1989.jpg" },
  { year: 1994, dir: "mv-4x3", cover: "/artist-3x4/2.webp" },
  { year: 1996, dir: "mv-4x3", cover: "/artist-4x3/Music-1995.jpg" },
];

function coverAt(index: number): string {
  return GALLERY_IMAGES[index % GALLERY_IMAGES.length] ?? "";
}

export const BUILTIN_TRACKS: MediaTrack[] = [
  ...MP3_FILES.map((name, index) => ({
    id: `builtin-audio-${index}`,
    title: name.replace(/\.mp3$/i, ""),
    artist: "董小姐",
    album: "YYC³ 音乐典藏",
    cover: mediaUrl(coverAt(index)),
    src: mediaUrl(`/mp3/${encodeURIComponent(name)}`),
    kind: "audio" as const,
  })),
  ...VIDEO_FILES.map((video, index) => ({
    id: `builtin-video-${index}`,
    title: `Music ${video.year}`,
    artist: "YYC³ 影像",
    album: video.dir === "mv-3x4" ? "影像典藏 · 3:4" : "影像典藏 · 4:3",
    cover: mediaUrl(video.cover),
    src: mediaUrl(`/${video.dir}/Music-${video.year}.mp4`),
    kind: "video" as const,
  })),
];

/* ========================================
   播放器布局持久化
   ======================================== */
export function loadPlayerLayout(): PlayerLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<PlayerLayout>;
    return {
      ...DEFAULT_LAYOUT,
      ...parsed,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_LAYOUT.volume,
      repeat: parsed.repeat ?? DEFAULT_LAYOUT.repeat,
      mode: parsed.mode === "panel" ? "panel" : "collapsed",
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function savePlayerLayout(layout: PlayerLayout): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* 存储不可用时静默降级 */
  }
}
