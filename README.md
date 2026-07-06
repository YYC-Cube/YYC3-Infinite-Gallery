# 🎨 YYC3 Infinite Gallery

<p align="center">
  <img src="public/D-1998.png" alt="YYC3 3D Gallery Preview" width="100%" />
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
  <img src="https://img.shields.io/badge/lighthouse-100-brightgreen?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/codefactor/grade/github/YYC-Cube/YYC3-Infinite-Gallery?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.0-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/React-19.2.7-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Three.js-0.185.1-000000?style=for-the-badge&logo=three.js" />
</p>

---

## 📦 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16.2.10 | React 应用框架（Turbopack） |
| [React](https://react.dev/) | 19.2.7 | UI 库 |
| [TypeScript](https://www.typescriptlang.org/) | 5.7.0 | 类型安全 |
| [Three.js](https://threejs.org/) | 0.185.1 | 3D 图形引擎 |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 9.6.1 | React 3D 渲染器 |
| [Drei](https://github.com/pmndrs/drei) | 10.7.7 | 3D 辅助组件库 |
| [Tailwind CSS](https://tailwindcss.com/) | 4.0.0 | 原子化 CSS 框架 |

---

## ✨ 核心特性

### 🎯 3D 无限滚动
- **WebGL 高性能渲染** — 基于 Three.js + React Three Fiber，60fps 流畅体验
- **无限内容加载** — 滚动到底部自动加载更多内容
- **智能布局算法** — Grid / Random / Spiral 三种布局模式，自动优化排列

### 📱 全设备支持
- **响应式设计** — 桌面端 / 平板 / 手机完美适配
- **触摸优化** — 移动端手势交互精心调校
- **PWA 安装** — 可安装为桌面 / 主屏幕应用，支持离线访问

### 🎨 视觉效果
- **沉浸式 3D** — 动态光照、智能阴影、平滑过渡动画
- **反射效果** — 可选地面反射，提升视觉层次
- **后期处理** — Bloom、景深等后处理效果（可选）

### ⚡ 性能优化
- **Turbopack 构建** — 开发 / 生产构建极速体验
- **懒加载** — 图片和资源按需加载，减少首屏时间
- **代码分割** — 自动路由级代码分割
- **WebGL 降级** — 自动检测并降级到 2D 模式
- **图片优化** — 支持 WebP/AVIF 格式，响应式图片

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
# → http://localhost:3000
```

### 可用脚本

```bash
pnpm dev          # 启动开发服务器（Turbopack）
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

<p align="center">
  <strong>🌹 感谢使用 YYC3 Infinite Gallery！</strong>
</p>

<p align="center">
  我们致力于提供最佳的 3D 内容展示体验。
</p>

<p align="center">
  Built with ❤️ by <a href="https://yyc3.top">YYC³</a> ·
  <a href="https://github.com/YYC-Cube/YYC3-Infinite-Gallery">GitHub</a> ·
  <a href="https://gallery.yyc3.top">Live Demo</a>
</p>
