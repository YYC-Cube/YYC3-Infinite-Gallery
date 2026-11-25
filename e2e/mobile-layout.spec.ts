/**
 * @file 移动端布局与交互回归测试
 * @description 锁定首屏状态、媒体空间与标签同步、设置面板层级、触控布局与最小字号
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-26
 */
import { test, expect, devices, type Page } from "@playwright/test";

const iphone13 = devices["iPhone 13"];
// 仅取尺寸与触控特征：桌面项目固定 chromium，设备描述里的 defaultBrowserType 会切到未安装的 webkit
test.use({
  viewport: iphone13.viewport,
  deviceScaleFactor: iphone13.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
  userAgent: iphone13.userAgent,
  locale: "zh-CN",
});

/** 等待静态页面完成 React 水合（媒体空间挂载后会写入 data-media-hydrated） */
async function gotoHydrated(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute(
    "data-media-hydrated",
    "1",
  );
}

const navLocator = (page: Page) =>
  page.getByRole("navigation", { name: "移动端底部导航" });

test.describe("移动端首屏与导航", () => {
  test("首屏应展示画廊，媒体空间默认收起且无横向溢出", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await gotoHydrated(page);

    await expect(navLocator(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: "画廊" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(".media-space-root")).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test("媒体与画廊标签应双向同步媒体空间状态", async ({ page }) => {
    await gotoHydrated(page);

    await page.getByRole("tab", { name: "媒体" }).click();
    await expect(page.locator(".media-space-root")).toBeVisible();
    await expect(page.getByRole("tab", { name: "媒体" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // 媒体空间打开时 AI 标注与悬浮设置按钮让位，不遮挡窗口控制
    await expect(page.getByText(/AI TAGS/)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "打开设置" }),
    ).toBeHidden();

    await page.getByRole("tab", { name: "画廊" }).click();
    await expect(page.locator(".media-space-root")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "画廊" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("设置面板打开时隐藏底部导航，Esc 关闭后恢复", async ({ page }) => {
    await gotoHydrated(page);
    await expect(navLocator(page)).toHaveCount(1);

    await page.getByRole("tab", { name: "设计" }).click();
    const dialog = page.getByRole("dialog", { name: "Design Studio" });
    await expect(dialog).toBeVisible();
    await expect(navLocator(page)).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(navLocator(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: "画廊" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("悬浮设置按钮不与底部导航重叠，首屏无小于 12px 的字号", async ({
    page,
  }) => {
    await gotoHydrated(page);

    const layout = await page.evaluate(() => {
      const nav = document
        .querySelector('nav[aria-label="移动端底部导航"]')!
        .getBoundingClientRect();
      const settings = document
        .querySelector('button[aria-label="打开设置"]')!
        .getBoundingClientRect();
      const overlap =
        Math.max(0, Math.min(nav.bottom, settings.bottom) - Math.max(nav.top, settings.top)) *
        Math.max(0, Math.min(nav.right, settings.right) - Math.max(nav.left, settings.left));
      return {
        overlap,
        navTop: nav.top,
        settingsBottom: settings.bottom,
        labels: Array.from(
          document.querySelectorAll(
            'nav[aria-label="移动端底部导航"] span, button[aria-label="打开设置"] span',
          ),
        ).map((node) => parseFloat(getComputedStyle(node).fontSize)),
      };
    });

    expect(layout.overlap).toBe(0);
    expect(layout.settingsBottom).toBeLessThanOrEqual(layout.navTop);
    expect(layout.labels.length).toBeGreaterThan(0);
    expect(Math.min(...layout.labels)).toBeGreaterThanOrEqual(12);
  });
});

test.describe("iPhone SE 小屏（320×568）", () => {
  const se = devices["iPhone SE"];
  // 仅取设备尺寸与触控特征：defaultBrowserType 不能在 describe 内使用
  test.use({
    viewport: se.viewport,
    deviceScaleFactor: se.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: se.userAgent,
  });

  test("设置按钮、品牌文案与导航互不遮挡", async ({ page }) => {
    await gotoHydrated(page);

    const metrics = await page.evaluate(() => {
      const nav = document
        .querySelector('nav[aria-label="移动端底部导航"]')!
        .getBoundingClientRect();
      const settings = document
        .querySelector('button[aria-label="打开设置"]')!
        .getBoundingClientRect();
      const brand = Array.from(document.querySelectorAll("p")).find((node) =>
        node.textContent?.includes("言启象限"),
      );
      const brandRect = brand?.getBoundingClientRect();
      return {
        settingsBottom: settings.bottom,
        navTop: nav.top,
        brandBottom: brandRect?.bottom ?? null,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    expect(metrics.settingsBottom).toBeLessThanOrEqual(metrics.navTop);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    if (metrics.brandBottom !== null) {
      expect(metrics.brandBottom).toBeLessThanOrEqual(metrics.navTop);
    }
  });
});
