/**
 * @file 媒体手势 Hook
 * @description 为媒体展示区提供左右划翻切歌、双指缩放调音量、长按收藏手势
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface MediaGestureOptions {
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  /** 双指手势开始时触发，用于记录基准值 */
  onPinchStart?: () => void;
  onPinch: (scale: number) => void;
  onLongPress: () => void;
  /** 滑动触发阈值（px），默认 60 */
  swipeThreshold?: number;
  /** 长按触发时长（ms），默认 500 */
  longPressMs?: number;
}

interface PointerInfo {
  x: number;
  y: number;
}

interface GestureState {
  pointers: Map<number, PointerInfo>;
  startX: number;
  startY: number;
  pinchStartDistance: number;
  longPressTimer: number | null;
  longPressFired: boolean;
  isPinching: boolean;
}

export interface MediaGestureHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

export interface MediaGestureResult {
  handlers: MediaGestureHandlers;
  /** 是否正在长按（用于视觉反馈） */
  isLongPressing: boolean;
  /** 双指缩放比例（>1 放大），用于视觉反馈 */
  pinchScale: number;
}

function distance(a: PointerInfo, b: PointerInfo): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function useMediaGestures(
  options: MediaGestureOptions,
): MediaGestureResult {
  const {
    onSwipeNext,
    onSwipePrev,
    onPinchStart,
    onPinch,
    onLongPress,
    swipeThreshold = 60,
    longPressMs = 500,
  } = options;

  const stateRef = useRef<GestureState>({
    pointers: new Map(),
    startX: 0,
    startY: 0,
    pinchStartDistance: 0,
    longPressTimer: null,
    longPressFired: false,
    isPinching: false,
  });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);

  const clearLongPress = useCallback(() => {
    const timer = stateRef.current.longPressTimer;
    if (timer !== null) {
      window.clearTimeout(timer);
      stateRef.current.longPressTimer = null;
    }
    setIsLongPressing(false);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = stateRef.current;
      state.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (state.pointers.size === 1) {
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.longPressFired = false;
        state.isPinching = false;
        const timer = window.setTimeout(() => {
          state.longPressFired = true;
          setIsLongPressing(true);
          onLongPress();
        }, longPressMs);
        state.longPressTimer = timer;
      } else if (state.pointers.size === 2) {
        clearLongPress();
        const [a, b] = Array.from(state.pointers.values());
        state.isPinching = true;
        state.pinchStartDistance = a && b ? distance(a, b) : 0;
        onPinchStart?.();
      }
    },
    [clearLongPress, longPressMs, onLongPress, onPinchStart],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = stateRef.current;
      if (!state.pointers.has(event.pointerId)) return;

      state.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      // 双指缩放
      if (state.pointers.size === 2 && state.isPinching) {
        const [a, b] = Array.from(state.pointers.values());
        if (a && b && state.pinchStartDistance > 0) {
          const ratio = distance(a, b) / state.pinchStartDistance;
          const scale = Math.min(2, Math.max(0.5, ratio));
          setPinchScale(scale);
          onPinch(scale);
        }
        return;
      }

      // 单指移动超过阈值时取消长按
      if (state.pointers.size === 1 && state.longPressTimer !== null) {
        const dx = Math.abs(event.clientX - state.startX);
        const dy = Math.abs(event.clientY - state.startY);
        if (dx > 10 || dy > 10) clearLongPress();
      }
    },
    [clearLongPress, onPinch],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = stateRef.current;
      const wasPinching = state.isPinching;
      state.pointers.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      clearLongPress();

      if (wasPinching) {
        if (state.pointers.size < 2) {
          state.isPinching = false;
          setPinchScale(1);
          state.pinchStartDistance = 0;
        }
        return;
      }

      // 单指滑动切歌
      if (!state.longPressFired && state.pointers.size === 0) {
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (Math.abs(dx) >= swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) onSwipePrev();
          else onSwipeNext();
        }
      }
    },
    [clearLongPress, onSwipeNext, onSwipePrev, swipeThreshold],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = stateRef.current;
      state.pointers.delete(event.pointerId);
      state.isPinching = false;
      setPinchScale(1);
      clearLongPress();
    },
    [clearLongPress],
  );

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    isLongPressing,
    pinchScale,
  };
}
