/**
 * @file PWA 与宿主运行时
 * @description 注册 Service Worker、探测宿主机能力、显示离线状态、可安装性与新版本提示
 * @author YYC³
 * @version 1.3.0
 * @created 2026-11-19
 * @updated 2026-11-21
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
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
  const [updateReady, setUpdateReady] = useState(false);
  const dismissRef = useRef<number | null>(null);
  const installedRef = useRef(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    installedRef.current = isInstalled;
  }, [isInstalled]);

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

    const onControllerChange = () => {
      if (!reloadingRef.current) return;
      reloadingRef.current = false;
      window.location.reload();
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );
    }

    const markWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      waitingWorkerRef.current = worker;
      setUpdateReady(true);
    };

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
          }
          markWaiting(registration.waiting);
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              // 已有控制器时，新 SW 进入 installed 表示有可用更新
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                markWaiting(installing);
              }
            });
          });
          void navigator.serviceWorker.ready.then((readyRegistration) => {
            readyRegistration.active?.postMessage({ type: "CACHE_STATUS" });
            markWaiting(readyRegistration.waiting);
          });
        })
        .catch(() => {
          /* PWA 不可用时不影响主应用 */
        });
    }

    const onBeforeInstallPrompt = (rawEvent: Event) => {
      rawEvent.preventDefault();
      const event = rawEvent as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      // 仅在非独立模式下显示安装提示，且不打扰已安装用户
      if (
        !installedRef.current &&
        window.matchMedia("(display-mode: browser)").matches
      ) {
        setShowInstall(true);
        // 10 秒后自动隐藏提示
        dismissRef.current = window.setTimeout(
          () => setShowInstall(false),
          10000,
        );
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
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange,
        );
      }
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
      if (dismissRef.current) window.clearTimeout(dismissRef.current);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowInstall(false);
      }
    } catch {
      /* 用户取消或浏览器拒绝安装时不阻断主流程 */
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstall(false);
    if (dismissRef.current) window.clearTimeout(dismissRef.current);
  }, []);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current;
    if (!waiting) {
      window.location.reload();
      return;
    }
    reloadingRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
    setUpdateReady(false);
    // 兜底：部分浏览器 controllerchange 触发较慢
    window.setTimeout(() => {
      if (reloadingRef.current) window.location.reload();
    }, 1500);
  }, []);

  const showStatus =
    !browserOnline ||
    host.connection === "offline" ||
    host.connection === "incompatible";

  if (!showStatus && !showInstall && !updateReady) return null;

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

      {updateReady && (
        <div
          className="fixed left-1/2 top-14 z-[10001] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-warm/25 bg-[#0a0908]/95 px-3 py-2 shadow-2xl backdrop-blur-xl animate-fade-in-up"
          role="status"
        >
          <RefreshCw size={14} className="text-warm-primary" />
          <span className="text-[10px] text-white/70">新版本已就绪</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="rounded-full border border-warm/30 bg-warm/10 px-2.5 py-1 text-[10px] text-warm-primary transition-colors hover:bg-warm/20"
          >
            刷新
          </button>
        </div>
      )}

      {showInstall && (
        <div className="fixed right-3 bottom-3 z-[10001] flex items-center gap-2 rounded-xl border border-warm/25 bg-[#0a0908]/95 px-3 py-2 shadow-2xl backdrop-blur-xl animate-fade-in-up">
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
