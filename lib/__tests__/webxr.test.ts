/**
 * @file WebXR 能力探测单元测试
 * @description 验证无 WebXR 时的优雅降级与能力检测逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

import { detectXRCapabilities, requestXRSession } from "../webxr";

describe("webxr", () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });

  test("无 navigator.xr 时应返回不支持", async () => {
    Object.defineProperty(global, "navigator", {
      value: {},
      configurable: true,
    });
    const caps = await detectXRCapabilities();
    expect(caps.supported).toBe(false);
    expect(caps.reason).toBeDefined();
  });

  test("isSessionSupported 返回 true 时应标记支持", async () => {
    Object.defineProperty(global, "navigator", {
      value: {
        xr: {
          isSessionSupported: jest.fn().mockResolvedValue(true),
          requestSession: jest.fn(),
        },
      },
      configurable: true,
    });
    const caps = await detectXRCapabilities();
    expect(caps.supported).toBe(true);
    expect(caps.vr).toBe(true);
    expect(caps.ar).toBe(true);
  });

  test("无 requestSession 时请求会话应返回 null", async () => {
    Object.defineProperty(global, "navigator", {
      value: {},
      configurable: true,
    });
    const session = await requestXRSession("immersive-vr");
    expect(session).toBeNull();
  });
});
