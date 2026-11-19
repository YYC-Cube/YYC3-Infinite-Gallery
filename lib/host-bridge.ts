/**
 * @file 宿主机桥接层
 * @description 统一 Web/PWA/移动 WebView 的能力协商、网络代理与持久化同步入口
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-19
 * @updated 2026-11-19
 */

import { useSyncExternalStore } from "react";

export type HostConnection =
  "direct" | "checking" | "online" | "offline" | "incompatible";

export interface HostState {
  connection: HostConnection;
  endpoint: string;
  version: string;
  capabilities: string[];
  lastCheckedAt: number | null;
}

export interface HostCapabilitiesPayload {
  version?: string;
  capabilities?: string[];
}

const ENDPOINT = (process.env.NEXT_PUBLIC_YYC3_HOST_URL ?? "").replace(
  /\/$/,
  "",
);
const OUTBOX_KEY = "yyc3-host-outbox-v1";
const listeners = new Set<() => void>();

let state: HostState = {
  connection: ENDPOINT ? "checking" : "direct",
  endpoint: ENDPOINT,
  version: "",
  capabilities: [],
  lastCheckedAt: null,
};

function emit(next: Partial<HostState>) {
  state = { ...state, ...next, lastCheckedAt: Date.now() };
  listeners.forEach((listener) => listener());
}

export function subscribeHost(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHostSnapshot(): HostState {
  return state;
}

export function useHostState(): HostState {
  return useSyncExternalStore(subscribeHost, getHostSnapshot, getHostSnapshot);
}

export async function probeHost(): Promise<HostState> {
  if (!ENDPOINT) {
    emit({ connection: "direct", capabilities: [] });
    return state;
  }
  emit({ connection: "checking" });
  try {
    const response = await fetch(`${ENDPOINT}/v1/capabilities`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      emit({
        connection: response.status === 404 ? "incompatible" : "offline",
      });
      return state;
    }
    const payload = (await response.json()) as HostCapabilitiesPayload;
    emit({
      connection: "online",
      version:
        typeof payload.version === "string" ? payload.version : "unknown",
      capabilities: Array.isArray(payload.capabilities)
        ? payload.capabilities
        : [],
    });
    void flushOutbox();
    return state;
  } catch {
    emit({ connection: "offline" });
    return state;
  }
}

export async function hostFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (!ENDPOINT || state.connection !== "online") {
    return fetch(input, init);
  }

  const body =
    typeof init?.body === "string"
      ? init.body
      : init?.body instanceof URLSearchParams
        ? init.body.toString()
        : undefined;
  const response = await fetch(`${ENDPOINT}/v1/network/fetch`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: input,
      method: init?.method ?? "GET",
      headers: init?.headers,
      body,
    }),
    signal: init?.signal,
  });
  if (!response.ok) {
    throw new Error(`宿主网络代理失败：${response.status}`);
  }
  return response;
}

interface OutboxItem {
  id: string;
  key: string;
  value: unknown;
  createdAt: number;
}

function readOutbox(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    const parsed = raw ? (JSON.parse(raw) as OutboxItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-100)));
  } catch {
    /* 配额不足时保留现有队列 */
  }
}

export async function hostStorageGet<T>(key: string): Promise<T | null> {
  if (ENDPOINT && state.connection === "online") {
    try {
      const response = await fetch(
        `${ENDPOINT}/v1/storage/${encodeURIComponent(key)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      /* 回退到本地缓存 */
    }
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function hostStorageSet(
  key: string,
  value: unknown,
): Promise<void> {
  if (ENDPOINT && state.connection === "online") {
    try {
      const response = await fetch(
        `${ENDPOINT}/v1/storage/${encodeURIComponent(key)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        },
      );
      if (response.ok) return;
    } catch {
      /* 进入待同步队列 */
    }
  }

  if (!ENDPOINT) return;
  const outbox = readOutbox();
  outbox.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key,
    value,
    createdAt: Date.now(),
  });
  writeOutbox(outbox);
}

export async function flushOutbox(): Promise<void> {
  if (!ENDPOINT || state.connection !== "online") return;
  const pending = readOutbox();
  if (pending.length === 0) return;
  const remaining: OutboxItem[] = [];
  for (const item of pending) {
    try {
      const response = await fetch(
        `${ENDPOINT}/v1/storage/${encodeURIComponent(item.key)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": item.id,
          },
          body: JSON.stringify(item.value),
        },
      );
      if (!response.ok) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  writeOutbox(remaining);
}

export function configureHostEndpoint(endpoint: string) {
  if (!endpoint) return;
  state = {
    ...state,
    endpoint: endpoint.replace(/\/$/, ""),
    connection: "checking",
  };
  emit({});
  void probeHost();
}

export function hostIsAvailable(): boolean {
  return !ENDPOINT || state.connection === "online";
}
