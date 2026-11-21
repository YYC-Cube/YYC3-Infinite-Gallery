/**
 * @file 全局错误边界
 * @description 捕获页面渲染异常，提供重试入口，避免整站白屏
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-21
 */
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[YYC³] 页面渲染失败", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-white">
      <p className="font-mono text-[10px] tracking-[0.3em] text-[#d4a574]/70">
        YYC³ GALLERY
      </p>
      <h1 className="text-lg font-light">页面暂时无法显示</h1>
      <p className="max-w-sm text-xs leading-relaxed text-white/50">
        渲染过程中出现异常。你可以重试，或刷新页面后继续浏览作品。
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-[#d4a574]/40 bg-[#d4a574]/10 px-4 py-2 text-xs text-[#d4a574] transition-colors hover:bg-[#d4a574]/20"
      >
        重新加载
      </button>
    </main>
  );
}
