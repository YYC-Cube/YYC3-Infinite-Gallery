/**
 * @file 样式工具单元测试
 * @description 验证类名合并与 Tailwind 冲突消解
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-21
 */

import { cn } from "../utils";

describe("cn", () => {
  test("应合并条件类名", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  test("应消解 Tailwind 冲突类", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
