/**
 * @file 语言切换器
 * @description 悬浮语言切换控件，支持中/英/日实时切换
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
"use client";

import { Languages } from "lucide-react";
import { LOCALES, setLocale, useLocale } from "@/lib/i18n";

export default function LocaleSwitcher() {
  const locale = useLocale();

  return (
    <div
      className="version-switcher fixed right-6 top-6 z-[9998] flex items-center gap-1 rounded-full border border-warm/25 bg-[#0a0908]/80 px-2 py-1.5 shadow-xl backdrop-blur-xl"
      role="group"
      aria-label="语言切换"
    >
      <Languages size={13} className="mx-1 text-warm-primary/60" />
      {LOCALES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setLocale(item.id)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-mono transition-all ${
            locale === item.id
              ? "bg-warm/20 text-warm-primary"
              : "text-white/40 hover:text-white/80"
          }`}
          aria-label={`切换到 ${item.native}`}
          aria-pressed={locale === item.id}
          title={item.native}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
