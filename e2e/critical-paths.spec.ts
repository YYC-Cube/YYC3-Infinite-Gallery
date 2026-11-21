/**
 * @file 关键路径端到端测试
 * @description 覆盖首屏渲染、统一设置面板、主题/语言/断点切换、导航与响应式
 * @author YYC³
 * @version 1.1.0
 * @created 2026-11-20
 * @updated 2026-11-21
 */
import { test, expect, type Page } from "@playwright/test";

/** 等待静态页面完成 React 水合（data-theme 由挂载后的 effect 写入） */
async function gotoHydrated(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("data-theme", /.+/);
  await expect(page.getByRole("button", { name: "打开设置" })).toBeEnabled();
}

/** 打开默认收起的设置面板 */
async function openSettings(page: Page) {
  await page.getByRole("button", { name: "打开设置" }).click();
  await expect(
    page.getByRole("dialog", { name: "Design Studio" }),
  ).toBeVisible();
}

test.describe("YYC³ Infinite Gallery 关键路径", () => {
  test("首屏应渲染 3D 画廊，设置面板默认收起", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await gotoHydrated(page);

    await expect(page.getByRole("button", { name: "打开设置" })).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "Design Studio" }),
    ).toHaveCount(0);

    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const hasFallback = await page
      .getByText(/不支持WebGL/)
      .isVisible()
      .catch(() => false);
    expect(hasCanvas || hasFallback).toBe(true);

    expect(errors).toEqual([]);
  });

  test("语言切换应收敛在设置面板内并更新 <html lang>", async ({ page }) => {
    await gotoHydrated(page);
    await openSettings(page);

    await page.getByRole("tab", { name: "语言" }).click();
    await page.getByRole("button", { name: "切换到 English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Words Initiate")).toBeVisible();

    await page.getByRole("button", { name: "切换到 日本語" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });

  test("主题切换应写入 data-theme 属性", async ({ page }) => {
    await gotoHydrated(page);
    await openSettings(page);

    await page.getByRole("button", { name: "切换到 赛博朋克" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cyberpunk");

    await page.getByRole("button", { name: "切换到 水墨丹青" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "ink-wash");
  });

  test("断点切换应写入 data-breakpoint 覆盖属性", async ({ page }) => {
    await gotoHydrated(page);
    await openSettings(page);

    await page.getByTitle("移动版").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-breakpoint",
      "mobile",
    );

    await page.getByRole("button", { name: "自动断点模式" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-breakpoint");
  });

  test("移动端视口应显示底部导航", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page);

    const nav = page.getByRole("navigation", { name: "移动端底部导航" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("tab").first()).toBeVisible();
    expect(await nav.getByRole("tab").count()).toBe(4);
  });

  test("媒体窗口应支持最小化、最大化与还原", async ({ page }) => {
    await gotoHydrated(page);

    const audio = page.locator('[data-session-kind="audio"]');
    await expect(audio).toBeVisible();
    await expect(
      audio.getByRole("button", { name: "上传本地音频" }),
    ).toBeVisible();

    await audio.getByRole("button", { name: "最大化" }).click();
    await expect(audio).toHaveAttribute("data-window-mode", "maximized");

    await audio.getByRole("button", { name: "还原窗口" }).click();
    await expect(audio).toHaveAttribute("data-window-mode", "normal");

    await audio.getByRole("button", { name: "最小化" }).click();
    await expect(audio).toHaveAttribute("data-window-mode", "minimized");

    await audio.getByRole("button", { name: "还原窗口" }).click();
    await expect(audio).toHaveAttribute("data-window-mode", "normal");
  });

  test("媒体空间应可收起再打开", async ({ page }) => {
    await gotoHydrated(page);

    const openButton = page.getByRole("button", { name: "打开自主媒体空间" });
    const closeButton = page.getByRole("button", { name: "收起媒体空间" });
    const chrome = page.locator(".media-space-chrome");

    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
    await expect(openButton).toBeVisible();
    await expect(chrome).toHaveCount(0);

    await openButton.click();
    await expect(chrome).toBeVisible();
  });
});
