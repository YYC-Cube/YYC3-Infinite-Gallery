/**
 * @file AI 内容标注
 * @description 图片内容标签生成：可插拔服务接口 + 本地启发式降级 + localStorage 缓存
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

const STORAGE_KEY = "yyc3-annotations-v1";

export interface ImageAnnotation {
  /** 图片 src（缓存键） */
  id: string;
  /** 标签列表 */
  tags: string[];
  /** 简要描述 */
  description: string;
  /** 标注来源 */
  source: "local" | "remote";
  createdAt: number;
}

export interface AnnotationProvider {
  name: string;
  annotate(id: string, src: string): Promise<ImageAnnotation>;
}

function restore(): Record<string, ImageAnnotation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, ImageAnnotation> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const item = value as Partial<ImageAnnotation>;
      if (!Array.isArray(item.tags)) continue;
      result[key] = {
        id: key,
        tags: item.tags.filter((tag): tag is string => typeof tag === "string"),
        description:
          typeof item.description === "string" ? item.description : "",
        source: item.source === "remote" ? "remote" : "local",
        createdAt:
          typeof item.createdAt === "number" && Number.isFinite(item.createdAt)
            ? item.createdAt
            : Date.now(),
      };
    }
    return result;
  } catch {
    return {};
  }
}

let cache: Record<string, ImageAnnotation> = restore();

export function getAnnotation(id: string): ImageAnnotation | undefined {
  return cache[id];
}

export function getAllAnnotations(): Record<string, ImageAnnotation> {
  return { ...cache };
}

function cacheAnnotation(annotation: ImageAnnotation) {
  cache = { ...cache, [annotation.id]: annotation };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      /* 忽略 */
    }
  }
}

/**
 * 本地启发式标注：从文件名/路径推断主题标签。
 * 无外部 AI 服务时的降级方案，保证功能始终可用。
 */
export const localHeuristicProvider: AnnotationProvider = {
  name: "local-heuristic",
  async annotate(id, src) {
    const fileName = decodeURIComponent(src.split("/").pop() ?? src)
      .replace(/\.[^.]+$/, "")
      .toLowerCase();
    const keywordMap: Record<string, string[]> = {
      artist: ["艺术", "创作", "artist"],
      music: ["音乐", "music"],
      song: ["歌曲", "song"],
      album: ["专辑", "album"],
      portrait: ["人像", "portrait"],
      cover: ["封面", "cover"],
      live: ["现场", "live"],
      concert: ["演出", "concert"],
      nature: ["自然", "nature"],
      city: ["城市", "city"],
    };
    const tags = new Set<string>(["影像"]);
    for (const [keyword, mapped] of Object.entries(keywordMap)) {
      if (fileName.includes(keyword)) mapped.forEach((tag) => tags.add(tag));
    }
    // 从命名中提取可能的作品序号/年份
    const numbers = fileName.match(/\d{2,4}/g);
    if (numbers) tags.add(`编号 ${numbers[0]}`);

    return {
      id,
      tags: Array.from(tags).slice(0, 6),
      description: `本地推断标签：${fileName || "未命名作品"}`,
      source: "local",
      createdAt: Date.now(),
    };
  },
};

/** 远程 AI 标注服务适配器：配置端点后按 POST 请求，失败自动回退本地 */
export function createRemoteProvider(endpoint: string): AnnotationProvider {
  return {
    name: "remote-ai",
    async annotate(id, src) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, src }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as Partial<ImageAnnotation>;
        if (!Array.isArray(data.tags)) throw new Error("invalid payload");
        return {
          id,
          tags: data.tags.filter((tag): tag is string => typeof tag === "string"),
          description: data.description ?? "",
          source: "remote",
          createdAt: Date.now(),
        };
      } catch {
        return localHeuristicProvider.annotate(id, src);
      }
    },
  };
}

/** 获取标注（命中缓存直接返回），provider 默认本地降级 */
export async function annotate(
  id: string,
  src: string,
  provider: AnnotationProvider = localHeuristicProvider,
): Promise<ImageAnnotation> {
  const cached = cache[id];
  if (cached) return cached;
  const annotation = await provider.annotate(id, src);
  cacheAnnotation(annotation);
  return annotation;
}

export function clearAnnotations() {
  cache = {};
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 忽略 */
    }
  }
}

export const ANNOTATION_STORAGE_KEY = STORAGE_KEY;
