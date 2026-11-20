/**
 * @file WebXR 能力探测
 * @description 检测沉浸式 VR/AR 会话支持，提供进入会话的抽象接口与降级说明
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

export type XRMode = "immersive-vr" | "immersive-ar" | "inline";

/** WebXR 系统最小接口（避免依赖 DOM 类型库版本） */
interface XRSystemLike {
  isSessionSupported(mode: XRMode): Promise<boolean>;
  requestSession(
    mode: XRMode,
    options?: { optionalFeatures?: string[] },
  ): Promise<unknown>;
}

type NavigatorWithXR = Navigator & { xr?: XRSystemLike };

export interface XRCapabilities {
  supported: boolean;
  vr: boolean;
  ar: boolean;
  inline: boolean;
  reason?: string;
}

/** 探测当前设备的 WebXR 能力（无硬件/无 API 时优雅降级） */
export async function detectXRCapabilities(): Promise<XRCapabilities> {
  if (typeof navigator === "undefined") {
    return { supported: false, vr: false, ar: false, inline: false };
  }
  const xr = (navigator as NavigatorWithXR).xr;
  if (!xr || typeof xr.isSessionSupported !== "function") {
    return {
      supported: false,
      vr: false,
      ar: false,
      inline: false,
      reason: "当前浏览器不支持 WebXR",
    };
  }
  try {
    const [vr, ar, inline] = await Promise.all([
      xr.isSessionSupported("immersive-vr").catch(() => false),
      xr.isSessionSupported("immersive-ar").catch(() => false),
      xr.isSessionSupported("inline").catch(() => false),
    ]) as [boolean, boolean, boolean];
    return {
      supported: vr || ar,
      vr,
      ar,
      inline,
      reason: vr || ar ? undefined : "未检测到沉浸式 XR 设备",
    };
  } catch {
    return {
      supported: false,
      vr: false,
      ar: false,
      inline: false,
      reason: "WebXR 探测失败",
    };
  }
}

/**
 * 请求进入沉浸式会话的原型接口。
 * 实际渲染循环由宿主注入（session 对象透传），此处只负责会话生命周期封装。
 */
export async function requestXRSession(
  mode: XRMode,
  onSession?: (session: unknown) => void,
): Promise<unknown | null> {
  const xr = (navigator as NavigatorWithXR).xr;
  if (!xr?.requestSession) return null;
  try {
    const session = await xr.requestSession(mode, {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });
    onSession?.(session);
    return session;
  } catch {
    return null;
  }
}
