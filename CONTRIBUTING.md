---
file: CONTRIBUTING.md
title: 贡献指南
description: YYC³ Infinite Gallery 贡献流程、开发规范、提交约定与协作指引
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-18
updated: 2026-11-20
status: stable
tags: [contributing, guide, workflow, overview, architecture]
category: documentation
language: zh-CN
audience: developers,contributors
complexity: basic
---

# 贡献指南

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 🎯 项目概述

YYC³ Infinite Gallery 是基于 **Next.js 16 + React Three Fiber + TypeScript** 构建的高性能 3D 无限滚动画廊系统，以「温润艺术风」为设计基调，融合自主媒体空间、多版本设计系统与 PWA 离线能力。

### 核心定位

| 维度 | 说明 |
| ---- | ---- |
| 产品形态 | 沉浸式 3D 作品展示 + 多实例媒体播放空间 |
| 技术底座 | Next.js 16（静态导出）+ React 19 + Three.js + Zustand 风格外部 store |
| 设计系统 | 7 套主题 × 3 断点 × 2 布局，CSS 变量驱动 |
| 智能化 | 个性化推荐、AI 内容标注（本地降级）、i18n 三语、WebXR 能力探测 |
| 质量体系 | typecheck / lint / 48 用例 / docs / security 五重门禁 + CI 自动 Pages 部署 |

### 一句话架构

> **一个 3D 画廊 Canvas + 一组领域 Store + 一层 PWA 外壳**：画廊负责视觉，Store 负责状态与持久化，PWA 负责离线与安装，三者通过 `app/page.tsx` 编排。

---

## 🗺️ 图标可视架构展示

以下用图标 + ASCII 形式展示项目分层架构与数据流向，帮助贡献者快速建立全局认知。

### 分层架构

```
┌──────────────────────────────────────────────────────────────────┐
│  🌐 入口层  app/layout.tsx · app/page.tsx                        │
│  ├─ 📐 元数据/PWA meta · 字体 · 全局样式                          │
│  └─ 🎼 编排：Provider → 画廊 → 媒体空间 → 浮层组件               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  🧩 组件层  components/                                          │
│  ├─ 🎞️  InfiniteGallery ── R3F Canvas / 着色器 / 视图降级        │
│  ├─ 🎧  media-space/ ────── SessionWindow / VideoEngine          │
│  ├─ ⚙️   ConfigPanel ────── 背景/光效/字体配置                   │
│  ├─ 🎭  VersionSwitcher ── 主题/断点/布局/动效切换               │
│  ├─ 🌐  LocaleSwitcher ─── 中/英/日切换                          │
│  ├─ 📱  MobileBottomNav ── 底部导航/安全区/手势                  │
│  ├─ 🏷️  AI 标签浮层 ────── 焦点作品标签                          │
│  ├─ 🥽  XREntry ────────── WebXR 沉浸式入口                      │
│  └─ 🧩  widgets/ ───────── 时钟/日历/天气/笔记（拖拽缩放）       │
└────────────────────────────┬─────────────────────────────────────┘
                             │ useSyncExternalStore
┌────────────────────────────▼─────────────────────────────────────┐
│  🧠 领域状态层  lib/                                             │
│  ├─ 🎨  version-store ───── 主题/断点/布局/动效                  │
│  ├─ 🎧  media-space/store ─ 音视频会话/队列/窗口帧               │
│  ├─ ⚙️   config-store ───── 画廊配置 → DOM CSS 变量              │
│  ├─ ⭐  favorites-store ─── 收藏（长按手势写入）                 │
│  ├─ 💡  recommendation-store ─ 曝光/互动 → 亲和度排序            │
│  ├─ 🌐  i18n ────────────── 字典/语言状态                        │
│  ├─ 🏷️  annotation-store ── 标注服务接口 + 本地降级 + 缓存       │
│  ├─ 🔄  media-sync ──────── 媒体元数据 outbox 同步               │
│  ├─ 📊  performance-monitor ─ Web Vitals 采集                    │
│  ├─ 🌉  host-bridge ─────── 宿主能力协商/网络代理/outbox         │
│  └─ 🥽  webxr ───────────── XR 能力探测/会话抽象                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  💾 持久化层                                                     │
│  ├─ 📦  localStorage ───── 版本/配置/收藏/推荐/语言/标注缓存     │
│  ├─ 🗄️  IndexedDB ──────── 本地上传媒体文件（media-db/asset-store）│
│  └─ ☁️  宿主 outbox ────── 离线队列，联网后 flushOutbox 补传     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  🚀 交付层                                                       │
│  ├─ ⚙️   CI ─────────────── typecheck → lint → test → docs → sec │
│  ├─ 📤  Build ───────────── 静态导出 out/ + SW 清单生成          │
│  └─ 🌍  Pages ───────────── configure-pages → deploy-pages       │
└──────────────────────────────────────────────────────────────────┘
```

### 关键数据流

```
🖱️ 用户滚动/手势
   │
   ▼
🎞️ InfiniteGallery onFocusImage ──► 💡 recommendation-store（曝光采集）
   │                                        │
   │                                        ▼ 挂载时一次性排序（防抖动）
   │                                  🖼️ orderedImages
   ▼
🏷️ annotation-store（焦点标注）──────► UI 标签浮层

📱 媒体上传 ──► 🗄️ IndexedDB ──► 🔄 media-sync ──► 🌉 host-bridge outbox
                                                        │ 联网
                                                        ▼
                                                   ☁️ 宿主 API
```

> 图例：🎞️ 视觉 · 🧠 状态 · 💾 存储 · 🚀 交付 · 🌉 桥接 · 🏷️ 智能

感谢你考虑为 YYC³ Infinite Gallery 贡献代码！

本指南将帮助你了解如何参与项目开发。

## 📋 行为准则

请阅读并遵守我们的 [行为准则](./CODE_OF_CONDUCT.md)。

## 🚀 快速开始

### 1. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮。

### 2. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/yyc3-infinite-gallery.git
cd yyc3-infinite-gallery
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 5. 开始开发

```bash
pnpm dev
```

## 🔧 开发流程

### 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 格式
<type>(<scope>): <subject>

# 示例
git commit -m "feat(gallery): add spiral layout support"
git commit -m "fix(3d): resolve camera position issue"
git commit -m "docs(readme): update installation guide"
git commit -m "chore(deps): update three.js to 0.185.1"
```

#### 类型说明

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 代码规范

#### ESLint

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

#### Prettier

```bash
# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

#### TypeScript

```bash
# 类型检查
pnpm typecheck
```

### 测试

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

## 📦 Pull Request 流程

### 1. 更新代码

```bash
# 添加更改
git add .

# 提交
git commit -m "feat: your feature description"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

### 2. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 "Compare & pull request"
3. 填写 PR 模板
4. 点击 "Create pull request"

### 3. PR 检查清单

- [ ] 代码符合 ESLint 规范
- [ ] 代码已格式化（Prettier）
- [ ] 通过 TypeScript 类型检查
- [ ] 通过所有测试
- [ ] 添加必要的文档
- [ ] 提交信息符合 Conventional Commits

### 4. Code Review

- 项目维护者会审查你的代码
- 根据反馈进行修改
- 一旦批准，代码将被合并

## 🐛 报告 Bug

### 创建 Issue

1. 访问 [Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)
2. 点击 "New issue"
3. 选择 "Bug report"
4. 填写模板

### Bug 报告模板

```markdown
**描述**
简明描述 Bug

**复现步骤**
1. 访问 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

**预期行为**
描述期望的正确行为

**截图**
如果可能，添加截图

**环境信息**
- 操作系统: [e.g. macOS, Windows]
- 浏览器: [e.g. Chrome, Safari]
- 版本: [e.g. 22]
- 设备: [e.g. Desktop, iPhone 12]
```

## 💡 功能请求

### 创建 Feature Request

1. 访问 [Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)
2. 点击 "New issue"
3. 选择 "Feature request"
4. 描述你的想法

### 功能请求模板

```markdown
**功能描述**
简明描述你希望添加的功能

**使用场景**
描述为什么需要这个功能

**可能的实现**
如果你有实现思路，请描述

**截图/草图**
如果可能，添加视觉参考
```

## 🔧 开发技巧

### 调试 3D 场景

```typescript
// 在组件中添加调试信息
import { useThree } from '@react-three/fiber';

function DebugInfo() {
  const { camera, gl } = useThree();
  
  useEffect(() => {
    console.log('Camera position:', camera.position);
    console.log('Renderer size:', gl.getSize());
  }, []);
  
  return null;
}
```

### 性能分析

```bash
# 构建并分析
pnpm analyze

# 打开分析报告
open .next/analyze/client.html
```

### 测试 PWA

```bash
# 本地测试 PWA
pnpm build
pnpm start

# 在 Chrome 中访问 http://localhost:3000
# 打开 DevTools → Application → Service Workers
```

## 📚 资源

- [Next.js 文档](https://nextjs.org/docs)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [Three.js 文档](https://threejs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

## ❓ 需要帮助？

- 查看 [项目文档](./README.md)（完整阶段文档见本地 `docs/` 目录，按团队规范维护、不提交远程）
- 搜索 [现有 Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)
- 加入 [Discussions](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/discussions)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-18 | 按 YYC³ 团队标规统一 front matter、品牌写法与标头标尾 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
