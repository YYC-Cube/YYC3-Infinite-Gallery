/**
 * @file PWA 与宿主运行时
 * @description 注册 Service Worker、探测宿主机能力并显示离线/不兼容状态
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */
"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { flushOutbox, probeHost, useHostState } from "@/lib/host-bridge";

export default function PWAProvider() {
  const host = useHostState();
  const [browserOnline, setBrowserOnline] = useState(true);

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

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* PWA 不可用时不影响主应用 */
      });
    }

    const onOnline = () => {
      void probeHost().then(() => flushOutbox());
    };
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void probeHost();
    }, 60 * 1000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, []);

  const showStatus =
    !browserOnline ||
    host.connection === "offline" ||
    host.connection === "incompatible";

  if (!showStatus) return null;

  return (
    <div
      className="fixed left-1/2 top-3 z-[10000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-warm/25 bg-[#0b0907]/85 px-3 py-1.5 text-[9px] text-white/60 shadow-xl backdrop-blur-xl"
      role="status"
    >
      <WifiOff size={10} className="text-warm-primary" />
      <span>
        {host.connection === "incompatible"
          ? "宿主版本不兼容 · 本地缓存模式"
          : !browserOnline
            ? "网络离线 · 已缓存的媒体与组件仍可用"
            : "宿主机离线 · 修改将排队同步"}
      </span>
    </div>
  );
}
