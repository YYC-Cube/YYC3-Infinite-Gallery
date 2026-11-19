/**
 * @file PWA 与宿主运行时
 * @description 注册 Service Worker、探测宿主机能力、显示离线状态与可安装性提示
 * @author YYC³
 * @version 1.2.0
 * @created 2026-11-19
 * @updated 2026-11-20
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  WifiOff,
  X,
} from "lucide-react";
import { flushOutbox, probeHost, useHostState } from "@/lib/host-bridge";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAProvider() {
  const host = useHostState();
  const [browserOnline, setBrowserOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<
    BeforeInstallPromptEvent | null
  >(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);
  const dismissRef = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setBrowserOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    void probeHost();

    // 查询预缓存资源数量，用于离线就绪状态展示
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS_RESULT") {
        setCachedCount(Number(event.data.preloaded) || 0);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMessage);
    }

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").then(() => {
        void navigator.serviceWorker.ready.then((registration) => {
          // standalone 模式下认为已安装
          if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
          }
          registration.active?.postMessage({ type: "CACHE_STATUS" });
        });
      }).catch(() => {
        /* PWA 不可用时不影响主应用 */
      });
    }

    const onBeforeInstallPrompt = (rawEvent: Event) => {
      rawEvent.preventDefault();
      const event = rawEvent as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      // 仅在非独立模式下显示安装提示，且不打扰已安装用户
      if (!isInstalled && window.matchMedia("(display-mode: browser)").matches) {
        setShowInstall(true);
        // 10 秒后自动隐藏提示
        dismissRef.current = window.setTimeout(() => setShowInstall(false), 10000);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const onOnline = () => {
      void probeHost().then(() => flushOutbox());
    };
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void probeHost();
    }, 60 * 1000);
    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onMessage);
      }
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
      if (dismissRef.current) window.clearTimeout(dismissRef.current);
    };
  }, [isInstalled]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstall(false);
    if (dismissRef.current) window.clearTimeout(dismissRef.current);
  }, []);

  const showStatus =
    !browserOnline ||
    host.connection === "offline" ||
    host.connection === "incompatible";

  if (!showStatus && !showInstall) return null;

  return (
    <>
      {showStatus && (
        <div
          className="fixed left-1/2 top-3 z-[10000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-warm/25 bg-[#0b0907]/85 px-3 py-1.5 text-[9px] text-white/60 shadow-xl backdrop-blur-xl"
          role="status"
        >
          <WifiOff size={10} className="text-warm-primary" />
          <span>
            {host.connection === "incompatible"
              ? "宿主版本不兼容 · 本地缓存模式"
              : !browserOnline
                ? `网络离线 · ${cachedCount > 0 ? `${cachedCount} 项资源已缓存，` : ""}媒体仍可用`
                : "宿主机离线 · 修改将排队同步"}
          </span>
        </div>
      )}

      {showInstall && (
        <div
          className="fixed right-3 bottom-3 z-[10001] flex items-center gap-2 rounded-xl border border-warm/25 bg-[#0a0908]/95 px-3 py-2 shadow-2xl backdrop-blur-xl animate-fade-in-up"
        >
          <Download size={16} className="text-warm-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-white">可安装为应用</p>
            <p className="text-[9px] text-white/50 truncate">
              将 YYC³ Infinite Gallery 添加到主屏幕，离线也可使用
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstall}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-warm/30 bg-warm/10 text-warm-primary text-[9px] hover:bg-warm/20 transition-colors"
              aria-label="安装到主屏幕"
            >
              <Download size={12} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-7 w-7 rounded-full border border-warm/20 bg-black/40 text-white/40 hover:text-white transition-colors"
              aria-label="关闭提示"
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

