/**
 * @file WebXR 能力入口
 * @description 探测设备 WebXR 能力并展示真实支持状态；渲染管线未就绪时只做能力说明
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-21
 */
"use client";

import { useEffect, useState } from "react";
import { Glasses, Info, X } from "lucide-react";
import { detectXRCapabilities, type XRCapabilities } from "@/lib/webxr";

export default function XREntry() {
  const [caps, setCaps] = useState<XRCapabilities | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    void detectXRCapabilities().then(setCaps);
  }, []);

  if (!caps || !caps.supported) return null;

  return (
    <div className="fixed left-5 top-20 z-[9997] flex flex-col gap-2 sm:left-6">
      <button
        type="button"
        onClick={() => setShowInfo((value) => !value)}
        className="flex items-center gap-1.5 rounded-full border border-warm/30 bg-[#0a0908]/80 px-3 py-1.5 text-[10px] font-mono text-warm-primary shadow-xl backdrop-blur-xl transition-colors hover:bg-warm/15"
        title="查看 WebXR 能力说明"
        aria-expanded={showInfo}
      >
        <Glasses size={13} />
        XR 能力可用
      </button>

      {showInfo && (
        <div
          className="flex max-w-[240px] items-start gap-2 rounded-lg border border-warm/20 bg-[#0a0908]/90 p-2.5 text-[9px] leading-relaxed text-white/60 shadow-xl backdrop-blur-xl"
          role="status"
        >
          <Info size={12} className="mt-0.5 shrink-0 text-warm-primary" />
          <span>
            已检测到沉浸式设备支持（
            {caps.vr ? "VR" : "AR"}
            ）。当前版本仍以桌面/移动 WebGL 画廊呈现，XR
            渲染管线尚在规划中，暂不会启动沉浸式会话。
          </span>
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
