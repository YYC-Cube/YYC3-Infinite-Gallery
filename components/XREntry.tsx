/**
 * @file WebXR 沉浸式入口
 * @description 探测 WebXR 能力并提供沉浸式模式入口原型，不支持时显示降级提示
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
"use client";

import { useEffect, useState } from "react";
import { Glasses, Info, X } from "lucide-react";
import {
  detectXRCapabilities,
  requestXRSession,
  type XRCapabilities,
} from "@/lib/webxr";

export default function XREntry() {
  const [caps, setCaps] = useState<XRCapabilities | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    void detectXRCapabilities().then(setCaps);
  }, []);

  if (!caps || !caps.supported) return null;

  const enterXR = async () => {
    const mode = caps.vr ? "immersive-vr" : "immersive-ar";
    const session = await requestXRSession(mode, () => setInSession(true));
    if (!session) setShowInfo(true);
  };

  return (
    <div className="fixed left-5 top-20 z-[9997] flex flex-col gap-2 sm:left-6">
      <button
        type="button"
        onClick={() => void enterXR()}
        className="flex items-center gap-1.5 rounded-full border border-warm/30 bg-[#0a0908]/80 px-3 py-1.5 text-[10px] font-mono text-warm-primary shadow-xl backdrop-blur-xl transition-colors hover:bg-warm/15"
        title="进入沉浸式画廊"
      >
        <Glasses size={13} />
        {inSession ? "XR 会话中" : "沉浸式 XR"}
      </button>

      {showInfo && (
        <div className="flex max-w-[220px] items-start gap-2 rounded-lg border border-warm/20 bg-[#0a0908]/90 p-2.5 text-[9px] text-white/60 shadow-xl backdrop-blur-xl">
          <Info size={12} className="mt-0.5 shrink-0 text-warm-primary" />
          <span>XR 会话启动失败，可能缺少设备权限。当前 3D 画廊仍可正常使用。</span>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="shrink-0 text-white/40 hover:text-white"
            aria-label="关闭提示"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
