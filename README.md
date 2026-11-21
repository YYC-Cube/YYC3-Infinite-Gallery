# YYC³ Infinite Gallery

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

<p align="center">
  <img src="public/D-1998.png" alt="YYC³ 3D Gallery Preview" width="100%" />
</p>

<p align="center">
  <strong>基于 Next.js × Three.js 构建的高性能 3D 无限滚动画廊展示系统</strong>
</p>

<p align="center">
  <a href="https://gallery.yyc3.top" target="_blank">🌐 在线演示</a> ·
  <a href="#-快速开始">🚀 快速开始</a> ·
  <a href="#-核心特性">✨ 核心特性</a> ·
  <a href="docs/api.md">📖 API 文档</a> ·
  <a href="#-贡献">🤝 贡献</a>
</p>

---

## 📊 项目状态

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-Infinite-Gallery/deploy.yml?branch=main&style=for-the-badge" />
  <img src="https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge&logo=pwa" />
</p>

<p align="center">
  <img src="https://img.shields.io/codefactor/grade/github/YYC-Cube/YYC3-Infinite-Gallery?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/React-19.2.7-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Three.js-0.185.1-000000?style=for-the-badge&logo=three.js" />
</p>

---

## 📦 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16.4.6 | React 应用框架（Turbopack，静态导出） |
| [React](https://react.dev/) | 19.2.7 | UI 库 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | 严格类型安全 |
| [Three.js](https://threejs.org/) | 0.185.1 | 3D 图形引擎 |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 9.6.1 | React 3D 渲染器 |
| [Drei](https://github.com/pmndrs/drei) | 10.7.7 | 3D 辅助组件库 |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.17 | 原子化 CSS 框架 |
| [ArtPlayer](https://artplayer.org/) | 5.4.0 | 视频播放内核 |
| 测试 | Jest 29 / Playwright 1.65 | 单元与关键路径 E2E |

---

## ✨ 核心特性

### 🎯 3D 循环画廊
- **WebGL 渲染** — Three.js + React Three Fiber，自定义 ShaderMaterial 实现布料形变与景深模糊
- **循环展示** — 18 件音乐影像作品循环排列，支持滚轮、方向键与移动端单指滑动
- **自动播放** — 3 秒无交互后缓慢推进，任意交互立即接管
- **WebGL 降级** — 不支持 WebGL 时展示可滚动图片列表

### 📱 全设备支持
- **响应式设计** — 桌面 / 平板 / 手机断点，移动端底部导航与安全区适配
- **媒体手势** — 左右滑动切歌、双指调节音量、长按收藏
- **PWA 安装** — 可安装为主屏幕应用，Service Worker 预缓存应用壳并支持离线打开

### 🎨 视觉与设计系统
- **多版本设计** — 7 套主题、3 个断点、2 种媒体空间布局
- **Design Studio** — 背景、光晕、边线色度、玻璃模糊、排版与动效参数实时可调
- **页面组件** — 时钟、日历、天气、随手记，支持拖拽、缩放与最小化

### ⚡ 性能与工程
- **静态导出** — Next.js `output: 'export'` + Turbopack 构建
- **渲染约束** — Canvas DPR 上限 2，纹理/材质卸载释放，渲染循环不触发 React 重渲染
- **质量门禁** — 严格 TypeScript、ESLint、Jest 覆盖率阈值、Playwright 关键路径用例
- **PWA 更新** — SW 版本化缓存，新版本就绪时提示刷新

---

## 🔐 数据与隐私

本项目默认是纯静态前端，不包含自建后端与账号体系。

| 数据 | 存储位置 | 说明 |
| ---- | ---- | ---- |
| 主题、布局、断点、组件位置、收藏、推荐偏好 | 浏览器 localStorage | 仅本机可读，可在浏览器设置中清除 |
| 背景图、本地上传的音频/视频 | 浏览器 IndexedDB | 文件二进制不上传服务端；删除浏览器站点数据后丢失 |
| 本地媒体清单 | localStorage / 宿主桥接 | 仅元数据：文件 id、名称、类型、大小、创建时间 |
| 天气 | Open-Meteo + localStorage 缓存 | 默认杭州坐标；离线时展示最近一次缓存 |

**可选的宿主同步**：仅当构建时配置 `NEXT_PUBLIC_YYC3_HOST_URL`，应用才会通过 `/v1/storage/*` 同步配置、版本、组件、媒体元数据与离线 outbox。同步请求使用 `credentials: "include"`，宿主端必须自行实现鉴权、CSRF 防护与隐私政策；本仓库不包含宿主实现。

默认未接入第三方分析脚本。若启用 Google Analytics、GTM、Sentry 等，需要自行补充对应的隐私告知与同意机制。

## 🛡️ 安全头部建议

GitHub Pages 无法自定义响应头。建议在 CDN 或反向代理层至少配置：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://api.open-meteo.com https://<宿主域名>; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

> Next.js 静态导出包含内联脚本，CSP 需要保留 `'unsafe-inline'`；若要收紧到 nonce/hash，需要改用 Node 运行时部署或边缘函数注入响应头。

---

## 🚀 快速开始

### 环境要求

| 依赖 | 最低版本 |
|------|----------|
| Node.js | ≥ 18.0.0 |
| pnpm | ≥ 8.0.0（推荐） |

### 安装 & 启动

```bash
# 克隆项目
git clone https://github.com/YYC-Cube/YYC3-Infinite-Gallery.git
cd YYC3-Infinite-Gallery

# 安装依赖（推荐 pnpm）
pnpm install

# 启动开发服务器（Turbopack 加速）
pnpm dev
# → http://localhost:3033
```

### 可用脚本

```bash
pnpm dev          # 启动开发服务器（Turbopack）
pnpm dev:lan      # 启动开发服务器并允许局域网访问
pnpm build        # 构建生产版本（静态导出）
pnpm start        # 本地预览生产版本
pnpm lint         # ESLint 代码检查
pnpm lint:fix     # 自动修复 Lint 问题
pnpm typecheck    # TypeScript 类型检查
pnpm test         # 运行测试
pnpm test:watch   # 监听模式运行测试
pnpm format       # 代码格式化（Prettier）
pnpm analyze      # 构建分析（Bundle Size）
pnpm audit        # 依赖安全审计
pnpm update-deps  # 交互式更新依赖
```

### 局域网 / 多设备调试

Next.js 16 默认只允许 localhost 请求开发资源。通过局域网 IP 访问 `next dev` 时，会出现 HMR WebSocket 失败、字体资源 403，页面有样式但按钮点击无响应（客户端未完整水合）。

1. 在 `.env.local` 登记你的局域网主机名或 IP（不含协议与端口）：

```bash
NEXT_DEV_ORIGINS=192.168.1.10
```

2. 使用允许局域网访问的脚本启动（固定 3033 端口）：

```bash
pnpm dev:lan
```

3. 其他设备访问 `http://<你的局域网IP>:3033`。

注意：`allowedDevOrigins` 只在 dev server 启动时读取。修改 `.env.local` 或 `next.config.mjs` 后必须完整停止并重启 `next dev`，否则仍会看到：

```text
Blocked cross-origin request to Next.js dev resource /_next/hmr from "192.168.x.x"
```

若 IP 变化，只需同步修改 `.env.local`；该文件已被 `.gitignore` 忽略，不会提交。

---

## 📖 文档导航

| 文档 | 描述 |
|------|------|
| [API 参考](docs/api.md) | 组件 Props、类型定义、Hook 接口 |
| [开发指南](docs/development.md) | 环境设置、代码规范、调试技巧 |
| [部署指南](docs/deployment.md) | GitHub Pages / Vercel / Docker 部署 |
| [PWA 指南](docs/pwa.md) | Manifest / Service Worker / 离线支持 |
| [贡献指南](CONTRIBUTING.md) | Fork 流程、Commit 规范、PR 模板 |

> 📗 **英文文档**: [View English Documentation](README.en.md)

---

## 🎮 使用指南

### 基本用法

```tsx
import InfiniteGallery from '@/components/InfiniteGallery';

export default function Home() {
  const images = [
    { id: '1', src: '/photos/1.webp', alt: 'Photo 1', title: '作品 1' },
    { id: '2', src: '/photos/2.webp', alt: 'Photo 2', title: '作品 2' },
    // ... 更多图片
  ];

  return (
    <InfiniteGallery 
      images={images}
      options={{
        initialZoom: 1,
        autoPlay: false,
        enableKeyboard: true,
        enableTouch: true,
      }}
      onImageClick={(image) => console.log('Clicked:', image)}
    />
  );
}
```

### 配置选项

```typescript
interface GalleryOptions {
  // 缩放配置
  initialZoom?: number;              // 初始缩放级别（默认: 1）
  zoomSensitivity?: number;          // 缩放敏感度（默认: 0.1）
  
  // 滚动配置
  scrollSensitivity?: number;        // 滚动敏感度（默认: 1）
  rotationSensitivity?: number;      // 旋转敏感度（默认: 0.01）
  
  // 自动播放
  autoPlay?: boolean;                // 自动播放（默认: false）
  autoPlaySpeed?: number;            // 自动播放速度（默认: 1）
  
  // 交互控制
  enableKeyboard?: boolean;          // 启用键盘控制（默认: true）
  enableTouch?: boolean;             // 启用触摸控制（默认: true）
  enableMouseWheel?: boolean;        // 启用鼠标滚轮（默认: true）
  
  // 视觉配置
  backgroundColor?: string;          // 背景颜色（默认: '#000000'）
  imageSize?: number;                // 图片初始大小（默认: 300）
  spacing?: number;                  // 图片间距（默认: 50）
  layout?: 'grid' | 'random' | 'spiral'; // 布局模式（默认: 'grid'）
  depth?: number;                   // 3D 深度效果（默认: 10）
  shadows?: boolean;                // 启用阴影（默认: true）
  reflection?: boolean;             // 启用反射（默认: false）
}
```

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` `↓` `←` `→` | 滚动 / 导航 |
| `+` / `=` | 放大 |
| `-` / `_` | 缩小 |
| `0` | 重置缩放 |
| `Space` | 暂停 / 播放自动轮播 |
| `F` | 全屏切换 |
| `Esc` | 退出全屏 |

---

## 📱 PWA 功能

### 安装为应用

1. **桌面端**: 点击浏览器地址栏的"安装"图标
2. **移动端**: 在浏览器菜单中选择"添加到主屏幕"
3. **离线使用**: 安装后支持离线访问缓存内容

### PWA 特性

- ✅ **离线支持** — Service Worker 缓存策略
- ✅ **应用壳** — 快速加载的应用壳架构
- ✅ **后台同步** — 网络恢复后自动同步
- ✅ **全屏模式** — 沉浸式全屏体验
- ✅ **自动更新** — 新版本检测并提示更新

---

## ⚡ 性能优化

### 最佳实践

1. **图片优化**
   - 使用 WebP/AVIF 格式
   - 实施响应式图片（`sizes` + `srcset`）
   - 启用懒加载（Intersection Observer）

2. **代码优化**
   - 使用 `React.memo` 避免不必要的重渲染
   - 实施代码分割（动态 `import()`）
   - 优化打包体积（Tree Shaking）

3. **渲染优化**
   - 使用 Canvas 外的 DOM 叠加层
   - 实施视锥体剔除（Frustum Culling）
   - 优化 3D 模型复杂度（LOD）

### 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| Lighthouse Performance | > 90 | ✅ 95+ |
| First Contentful Paint | < 1.5s | ✅ ~1.2s |
| Time to Interactive | < 3.5s | ✅ ~2.8s |
| Core Web Vitals | Good | ✅ Good |

---

## 🌍 部署

### GitHub Pages（已配置 🟢）

推送到 `main` 分支后，GitHub Actions 自动构建并部署：

```bash
git push origin main
# → 等待 ~2 分钟
# → 访问 https://gallery.yyc3.top
```

### Vercel（推荐用于动态 API）

```bash
pnpm add -D vercel
vercel deploy
```

### 环境变量

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://gallery.yyc3.top
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX     # 可选：Google Analytics
NEXT_PUBLIC_SENTRY_DSN=https://...  # 可选：错误监控
```

---

## 🤝 贡献

欢迎任何形式的贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

```bash
# 1. Fork 项目
# 2. 创建功能分支
git checkout -b feat/your-feature

# 3. 提交（遵循 Conventional Commits）
git commit -m "feat: add spiral layout"

# 4. 推送并创建 PR
git push origin feat/your-feature
```

### 代码规范

- **提交信息**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- **代码风格**: ESLint + Prettier（自动格式化）
- **类型安全**: TypeScript 严格模式，完整类型定义

---

## 🐛 问题反馈

### 报告 Bug

请使用 [GitHub Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues) 报告问题：

1. **描述问题** — 清晰描述遇到的问题
2. **复现步骤** — 提供复现问题的详细步骤
3. **预期行为** — 描述期望的正确行为
4. **截图** — 如果可能，提供截图或录像
5. **环境信息** — 浏览器、操作系统、设备信息

### 功能请求

我们欢迎新功能建议！请在 Issues 中使用 "Feature Request" 标签。

---

## 📄 许可证

[MIT License](LICENSE) — 可自由使用、修改和分发。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) — React 应用框架
- [Three.js](https://threejs.org/) — 3D 图形引擎
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React 3D 渲染器
- [Tailwind CSS](https://tailwindcss.com/) — 原子化 CSS 框架
- [Vercel](https://vercel.com/) — 部署平台

---

## 📧 联系我们

- **项目作者**: YYC³
- **官方网站**: [https://yyc3.top](https://yyc3.top)
- **项目演示**: [https://gallery.yyc3.top](https://gallery.yyc3.top)
- **GitHub**: [@yyc3](https://github.com/yyc3)
- **邮箱**: contact@yyc3.top

---

## 📊 项目统计

<p align="center">
  <img src="https://img.shields.io/github/stars/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/forks/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/watchers/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/contributors/YYC-Cube/YYC3-Infinite-Gallery" />
  <img src="https://img.shields.io/github/last-commit/YYC-Cube/YYC3-Infinite-Gallery" />
</p>

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v2.0.0 | 2026-11-18 | 按 YYC³ 团队标规统一 front matter、品牌写法与标头标尾；新增悬浮音乐影像播放器与新图源 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
