/**
 * @file 关键路径端到端测试
 * @description 覆盖首屏渲染、语言切换、主题切换、断点切换与响应式导航
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */
import { test, expect, type Page } from "@playwright/test";

/** 等待静态页面完成 React 水合（事件绑定）后再交互 */
async function gotoHydrated(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // 水合标志：语言切换器按钮变为可交互
  await expect(page.getByRole("button", { name: "切换到 English" })).toBeEnabled();
}

test.describe("YYC³ Infinite Gallery 关键路径", () => {
  test("首屏应渲染 3D 画廊与核心浮层", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await gotoHydrated(page);

    await expect(
      page.getByLabel("版本切换面板", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("语言切换", { exact: true })).toBeVisible();

    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const hasFallback = await page
      .getByText(/不支持WebGL/)
      .isVisible()
      .catch(() => false);
    expect(hasCanvas || hasFallback).toBe(true);

    expect(errors).toEqual([]);
  });

  test("语言切换应更新 <html lang> 与标语文案", async ({ page }) => {
    await gotoHydrated(page);

    await page.getByRole("button", { name: "切换到 English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Words Initiate")).toBeVisible();

    await page.getByRole("button", { name: "切换到 日本語" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });

  test("主题切换应写入 data-theme 属性", async ({ page }) => {
    await gotoHydrated(page);

    await page.getByRole("button", { name: "切换到 赛博朋克" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cyberpunk");

    await page.getByRole("button", { name: "切换到 水墨丹青" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "ink-wash");
  });

  test("断点切换应写入 data-breakpoint 覆盖属性", async ({ page }) => {
    await gotoHydrated(page);

    // 断点按钮的 title 为「移动版」，可见文字为「移动」
    await page.getByTitle("移动版").click();
    await expect(page.locator("html")).toHaveAttribute("data-breakpoint", "mobile");

    await page.getByRole("button", { name: "自动断点模式" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-breakpoint");
  });

  test("移动端视口应显示底部导航", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page);

    const nav = page.getByRole("navigation", { name: "移动端底部导航" });
    await expect(nav).toBeVisible();
    // tab 的可访问名由 t() 提供，默认中文
    await expect(nav.getByRole("tab").first()).toBeVisible();
    expect(await nav.getByRole("tab").count()).toBe(4);
  });

  test("媒体空间应可收起再打开", async ({ page }) => {
    await gotoHydrated(page);

    const openButton = page.getByRole("button", { name: "打开自主媒体空间" });
    const closeButton = page.getByRole("button", { name: "收起媒体空间" });
    // split 模式下容器为 display:contents（无自身盒子），验证其子 chrome 的可见性
    const chrome = page.locator(".media-space-chrome");

    // 根据持久化状态从任一态开始，验证收起→打开闭环
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
    await expect(openButton).toBeVisible();
    await expect(chrome).toHaveCount(0);

    await openButton.click();
    await expect(chrome).toBeVisible();
  });
});
