# 📱 PWA 指南

本文档提供 YYC3 Infinite Gallery PWA（Progressive Web App）的完整配置和使用指南。

---

## 目录

1. [PWA 是什么？](#pwa-是什么)
2. [项目 PWA 文件](#项目-pwa-文件)
3. [Manifest 配置](#manifest-配置)
4. [Service Worker](#service-worker)
5. [安装 PWA](#安装-pwa)
6. [离线支持](#离线支持)
7. [调试 PWA](#调试-pwa)

---

## PWA 是什么？

PWA 是兼具 Web 和原生应用优点的现代 Web 技术：

| 特性 | 描述 |
|------|------|
| **离线访问** | Service Worker 缓存关键资源 |
| **应用安装** | 可安装到桌面 / 主屏幕 |
| **全屏体验** | 隐藏浏览器 UI |
| **后台同步** | 网络恢复后自动同步数据 |
| **推送通知** | 支持 Web Push API（可选） |

---

## 项目 PWA 文件

```
public/
├── manifest.json     ✅ PWA Manifest（应用元数据）
├── sw.js            ✅ Service Worker（缓存策略）
├── offline.html      ✅ 离线 Fallback 页面
└── D-icons/         ✅ 多尺寸应用图标
```

---

## Manifest 配置

`public/manifest.json` 定义了应用的安装行为。

### 关键字段

| 字段 | 值 | 描述 |
|------|------|------|
| `name` | `YYC3 Infinite Gallery` | 安装时显示的全名 |
| `short_name` | `YYC3 Gallery` | 桌面快捷方式名称 |
| `display` | `standalone` | 全屏模式（无浏览器 UI） |
| `background_color` | `#000000` | 启动时的背景色 |
| `theme_color` | `#000000` | 状态栏 / 主题色 |
| `orientation` | `any` | 允许横屏 / 竖屏 |
| `start_url` | `/` | 点击图标启动的 URL |

### 图标要求

PWA 需要多尺寸图标以适配不同平台：

| 用途 | 尺寸 | 格式 |
|------|------|------|
| 桌面快捷方式 | 192×192 | PNG |
| 启动画面 | 512×512 | PNG（`purpose: "any maskable"`）|
| Apple Touch | 180×180 | PNG |

---

## Service Worker

`public/sw.js` 使用 [Workbox](https://developers.google.com/web/tools/workbox) 策略。

### 缓存策略

| 资源类型 | 策略 | 说明 |
|----------|------|------|
| HTML 页面 | **Network First** | 优先网络，离线用缓存 |
| CSS / JS | **Cache First** | 优先缓存，版本化更新 |
| 图片 | **Stale While Revalidate** | 先返回缓存，后台更新 |
| API | **Network Only** | 不使用缓存（动态数据） |

### 手动注册 SW

`app/layout.tsx` 中已自动注册，如需手动控制：

```typescript
// 在 useEffect 中添加
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((reg) => console.log('SW registered:', reg))
    .catch((err) => console.error('SW registration failed:', err))
}
```

---

## 安装 PWA

### 桌面端（Chrome / Edge）

1. 访问 [https://gallery.yyc3.top](https://gallery.yyc3.top)
2. 地址栏右侧出现 **安装图标**（⊕）
3. 点击 → 确认安装

### 移动端（Android / iOS）

#### Android（Chrome）

1. 访问网站
2. 浏览器底部出现 **"安装应用"** 提示
3. 点击 **安装**

#### iOS（Safari）

1. 在 Safari 中访问网站
2. 点击底部的 **分享按钮**（□↑）
3. 滚动找到 **"添加到主屏幕"**
4. 点击 **添加**

---

## 离线支持

### 离线时可访问的内容

| 内容 | 离线可用 |
|------|----------|
| 首页 HTML | ✅ |
| CSS / JS | ✅ |
| 已访问的图片 | ✅（缓存期内）|
| 未访问的图片 | ❌ |
| API 请求 | ❌ |

### 自定义离线页面

`public/offline.html` 是离线时的 Fallback 页面，可自定义样式和内容。

---

## 调试 PWA

### Chrome DevTools

1. 打开 DevTools → **Application** 标签
2. 左侧面板：
   - **Manifest** — 检查 manifest.json 是否正确加载
   - **Service Workers** — 查看 SW 状态、跳过等待、离线模拟
   - **Cache Storage** — 查看缓存内容
   - **Storage** — 清除所有缓存

### Lighthouse PWA 审计

1. DevTools → **Lighthouse** 标签
2. 勾选 **Progressive Web App**
3. 点击 **Analyze page load**
4. 目标得分：**≥ 90**

### 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 安装提示不出现 | Manifest 配置不完整 | 检查 `start_url`、`icons`、`display` |
| SW 未注册 | HTTPS 未启用 | PWA 要求 HTTPS（localhost 除外）|
| 离线不工作 | 缓存策略配置错误 | 检查 `sw.js` 中的路由规则 |
| 图标不显示 | 图标路径错误 / 尺寸不符 | 使用 [PWA Asset Generator](https://github.com/jozsefsallai/pwa-asset-generator) |

---

<div align="center">
  <a href="./README.md">← 返回文档首页</a>
</div>
