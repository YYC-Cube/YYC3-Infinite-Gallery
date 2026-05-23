# 🎨 YYC3 Gallery Photography Template

<p align="center">
  <img src="public/yyc3-icons/Web App/apple-touch-icon.png" alt="YYC3 Gallery Logo" width="120" height="120">
</p>

<h4 align="center">温润艺术风 · 3D无限滚动画廊系统</h4>
<h5 align="center">Warm Art Style · 3D Infinite Scroll Gallery System</h5>

<p align="center">
  <a href="https://gallery.yyc3.top" target="_blank"><strong>🌐 在线演示</strong></a> •
  <a href="#-快速开始">🚀 快速开始</a> •
  <a href="#-功能特性">✨ 功能特性</a> •
  <a href="#-技术架构">🏗️ 技术架构</a> •
  <a href="#api文档">📚 API文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Three.js-latest-000000?style=flat-square&logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0.0-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Version-3.0.0-blue?style=flat-square" alt="Version">
</p>

---

## 📖 项目简介 (Project Overview)

**YYC3 Gallery Photography Template** 是一个基于 **Next.js 15** 和 **Three.js** 构建的高性能3D无限滚动画廊展示系统。该项目采用**温润艺术风**设计理念，为摄影师、艺术家和设计师提供了一个沉浸式的作品展示平台，支持完整的自定义配置、实时预览和响应式设计。

### 🎯 设计哲学 (Design Philosophy)

本项目遵循 **"五维驱动五高五标准五转型"** 核心框架：

| 维度 | 理念 | 实现方式 |
|------|------|----------|
| **时间维度** | 高可用性 | 静态导出 + CDN全球分发 |
| **空间维度** | 高性能 | WebGL渲染 + GPU加速 |
| **属性维度** | 高安全性 | TypeScript类型安全 + 无服务端依赖 |
| **事件维度** | 高扩展性 | 组件化架构 + 30+可调参数 |
| **关联维度** | 高智能化 | 实时配置 + 持久化存储 |

### ✨ 核心亮点 (Key Highlights)

- 🎨 **温润艺术风主题** - 暖色调配色 + 电影级光效动画
- 🖼️ **3D无限滚动画廊** - 基于React Three Fiber的沉浸式体验
- ⚙️ **30+可调参数** - 实时配置面板，所见即所得
- 📱 **全平台适配** - 移动端 / 平板 / 桌面完美响应式
- 💾 **本地持久化** - localStorage自动保存用户配置
- 🚀 **零运维成本** - GitHub Pages免费托管 + 自动CI/CD
- 🔐 **完全客户端运行** - 无需后端服务器，隐私安全

---

## 🚀 快速开始 (Quick Start)

### 📋 前置要求 (Prerequisites)

- **Node.js**: >= 18.17.0 (推荐 20.x LTS)
- **pnpm**: >= 8.0.0 (推荐最新版)
- **Git**: 版本控制工具
- **现代浏览器**: 支持WebGL 2.0 (Chrome/Firefox/Safari/Edge最新版)

### 📦 安装步骤 (Installation)

```bash
# 1. 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-Infinite-Gallery.git

# 2. 进入项目目录
cd YYC3-Infinite-Gallery

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm dev --port 3051

# 5. 打开浏览器访问
# http://localhost:3051
```

### 🛠️ 可用脚本 (Available Scripts)

```bash
# 开发环境 (带热重载)
pnpm dev              # 启动开发服务器 (默认端口3000，建议使用 --port 3051)

# 生产构建
pnpm build            # 生成静态文件到 ./out 目录
pnpm start            # 启动生产服务器 (仅用于测试，实际部署使用GitHub Pages)

# 代码质量检查
pnpm typecheck        # TypeScript类型检查
pnpm lint             # ESLint代码规范检查
```

---

## ✨ 功能特性 (Features)

### 🎨 视觉设计系统 (Visual Design System)

#### 温润艺术风配色方案 (Warm Art Color Palette)

```css
:root {
  /* 主色调 */
  --warm-primary: #d4a574;      /* 温暖金棕 */
  --warm-secondary: #c9956c;    /* 深琥珀 */
  --warm-accent: #e8c9a0;       /* 浅金 */

  /* 背景与前景 */
  --background: #0a0908;         /* 深黑背景 */
  --foreground: #f5f0e8;         /* 米白文字 */

  /* 环境光效 */
  --ambient-top: rgba(212, 165, 116, 0.08);
  --ambient-left: rgba(255, 200, 150, 0.06);
  --ambient-right: rgba(255, 180, 130, 0.05);
}
```

#### 电影级动画库 (Cinematic Animation Library)

| 动画名称 | CSS类名 | 默认时长 | 效果描述 |
|----------|---------|----------|----------|
| 显现效果 | `animate-reveal` | 1.2s | 文字从模糊到清晰的渐显 |
| 浮动效果 | `animate-float` | 6s | 上下缓慢浮动 |
| 呼吸效果 | `animate-breathe` | 4s | 缩放呼吸动画 |
| 光晕扩散 | `animate-aura` | 3s | 从中心向外扩散的光晕 |
| 线条绘制 | `animate-draw` | 2s | SVG线条从左到右绘制 |
| 环境偏移 | `ambientShift` | 25s | 背景光效缓慢移动 |

### ⚙️ 自定义配置面板 (Customization Panel)

点击页面右下角的 **⚙ 齿轮按钮** 打开完整的Design Studio配置面板。

#### 📁 1. 背景素材上传 (Background Material Upload)

- **拖拽上传** - 点击虚线区域选择图片
- **支持格式** - JPG / PNG / WebP (最大5MB)
- **参数控制**:
  - 透明度: 10% ~ 100%
  - 模糊度: 0px ~ 20px
  - 位置: 居中 / 顶部 / 底部

#### 🎨 2. 视觉风格调节器 (Visual Style Controller)

| 参数 | 类型 | 默认值 | 范围 |
|------|------|--------|------|
| 光效强度 | Slider | 1.0 | 0 ~ 2.0 |
| 顶部光晕色 | ColorPicker | `rgba(212,165,116,0.08)` | 自定义 |
| 左侧光晕色 | ColorPicker | `rgba(255,200,150,0.06)` | 自定义 |
| 右侧光晕色 | ColorPicker | `rgba(255,180,130,0.05)` | 自定义 |
| 主色调 | ColorPicker | `#d4a574` | 自定义 |
| 启用光效 | Toggle | 开启 | 开/关 |

#### ✏️ 3. 排版细节微调 (Typography Fine-tuning)

| 参数 | 选项 | 默认值 |
|------|------|--------|
| 字号 | xs/sm/base/lg/xl | base (16px) |
| 字重 | light/normal/medium | light (300) |
| 字距 | 0.1em ~ 1em | 0.4em |
| 透明度 | 30% ~ 100% | 80% |
| 行高 | 自由调节 | 1.6 |

#### ⚡ 4. 动效参数控制 (Animation Parameters)

| 参数 | 单位 | 默认值 | 范围 | 说明 |
|------|------|--------|------|------|
| 显现时长 | s | 1.2 | 0.3 ~ 3.0 | 文字渐显过渡时间 |
| 显现延迟 | s | 1.5 | 0 ~ 3.0 | 页面加载后延迟显现 |
| 浮动周期 | s | 6 | 2 ~ 12 | 上下浮动一个周期 |
| 浮动距离 | px | 10 | 0 ~ 30 | 浮动最大幅度 |
| 呼吸周期 | s | 4 | 2 ~ 8 | 页脚呼吸节奏 |
| 光晕扩散 | s | 3 | 固定 | 从中心向外扩散 |
| 线条绘制 | s | 2 | 固定 | SVG分隔线画完时间 |

#### 📐 5. 布局结构调整 (Layout Structure Adjustment)

- **底部内边距**: 24px ~ 96px (默认48px)
- **分隔线宽度**: 128px ~ 384px (默认256px)
- **移动端提示**: 开关切换显示/隐藏

---

## 🏗️ 技术架构 (Technical Architecture)

### 技术栈一览表 (Tech Stack Overview)

| 层级 | 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|------|
| **框架** | Next.js | 15.5.3 | React全栈框架 | App Router + Turbopack |
| **UI库** | React | 19.1.0 | 用户界面 | 最新并发特性 |
| **3D引擎** | Three.js | latest | WebGL底层渲染 | 高性能3D图形 |
| **3D绑定** | R3F | latest | React集成Three.js | 声明式3D开发 |
| **3D工具库** | Drei | latest | 常用3D组件 | OrbitControls等 |
| **样式** | Tailwind CSS | 4.0.0 | 原子化CSS | JIT编译 + 变量驱动 |
| **语言** | TypeScript | 5.x | 类型安全 | 完整类型推断 |
| **包管理** | pnpm | 9.x | 依赖管理 | 快速 + 磁盘高效 |
| **字体** | Cormorant Garamond | Google Fonts | 衬线字体 | 温润艺术感 |
| **部署** | GitHub Actions | v4 | CI/CD自动化 | 推送即部署 |
| **托管** | GitHub Pages | - | 静态网站托管 | 全球CDN + HTTPS |

### 项目目录结构 (Directory Structure)

```
yyc3-3d-gallery/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD工作流
│
├── app/                             # Next.js App Router
│   ├── globals.css                 # 全局样式 + 温润艺术风主题系统
│   ├── layout.tsx                  # 根布局 (Cormorant Garamond字体)
│   └── page.tsx                    # 主页面组件 (客户端组件)
│
├── components/
│   ├── ConfigPanel.tsx             # 自定义配置面板 (~350行)
│   │   ├── BackgroundSection      # 背景素材上传区
│   │   ├── VisualStyleSection     # 视觉风格调节区
│   │   ├── TypographySection      # 排版细节微调区
│   │   ├── AnimationSection       # 动效参数控制区
│   │   └── LayoutSection          # 布局结构调整区
│   │
│   ├── InfiniteGallery.tsx         # 3D无限滚动画廊核心组件
│   ├── theme-provider.tsx          # 主题上下文提供者
│   │
│   └── ui/                         # shadcn/ui 组件库 (50+组件)
│       ├── button.tsx
│       ├── slider.tsx
│       ├── select.tsx
│       ├── toggle.tsx
│       └── ...                     # 其他48个组件
│
├── hooks/
│   ├── use-mobile.ts               # 移动端检测Hook
│   └── use-toast.ts                # Toast通知Hook
│
├── lib/
│   ├── config-store.ts             # 配置状态管理 (localStorage)
│   │   ├── GalleryConfig           # 配置接口定义
│   │   ├── DEFAULT_CONFIG          # 默认配置常量
│   │   ├── loadConfig()            # 加载配置
│   │   ├── saveConfig()            # 保存配置
│   │   ├── resetConfig()           # 重置配置
│   │   └── applyConfigToDOM()      # 应用配置到DOM
│   │
│   └── utils.ts                    # 通用工具函数 (cn()等)
│
├── public/
│   ├── CNAME                       # 自定义域名配置 (gallery.yyc3.top)
│   ├── [1-8].webp                  # 示例摄影作品 (8张)
│   ├── yyc3-icons/                 # 多平台图标资源
│   │   ├── Web App/                # Web应用图标
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── android-chrome-192.png
│   │   │   ├── android-chrome-512.png
│   │   │   ├── favicon-16.png
│   │   │   └── favicon-32.png
│   │   ├── iOS/                    # iOS应用图标
│   │   ├── Android/                # Android应用图标
│   │   ├── macOS/                  # macOS应用图标
│   │   └── watchOS/                # watchOS应用图标
│   │
│   └── *.svg / *.jpg               # 其他静态资源
│
├── docs/                            # 项目文档 (中文)
│   ├── AI-Family9创新规划架构提案.md
│   ├── YYC3-团队使用-开发标准.md
│   └── YYC3-规划设计-动态韵律.md
│
├── next.config.mjs                 # Next.js配置 (静态导出优化)
├── package.json                    # 项目元数据和依赖
├── pnpm-lock.yaml                  # 锁定版本
├── postcss.config.mjs              # PostCSS配置
├── tsconfig.json                   # TypeScript配置
├── tailwind.config.ts              # Tailwind CSS配置
└── .gitignore                      # Git忽略规则
```

### 核心组件架构图 (Component Architecture)

```
app/page.tsx (主页面)
    │
    ├─► components/InfiniteGallery.tsx (3D画廊核心)
    │       │
    │       ├─► @react-three/fiber (Canvas)
    │       ├─► @react-three/drei (OrbitControls, etc.)
    │       └─► three.js (WebGL渲染引擎)
    │
    ├─► components/ConfigPanel.tsx (配置面板)
    │       │
    │       ├─► lib/config-store.ts (状态管理)
    │       ├─► components/ui/* (shadcn/ui组件)
    │       └─► localStorage (持久化存储)
    │
    └─► app/layout.tsx (根布局)
            │
            ├─► Cormorant Garamond (Google Fonts)
            └─► globals.css (温润艺术风主题)
```

---

## 📚 API文档 (API Documentation)

### 1. 核心组件接口 (Core Component APIs)

#### InfiniteGallery 组件

```tsx
import InfiniteGallery from '@/components/InfiniteGallery';

interface ImageData {
  src: string;           // 图片路径 (必需)
  alt: string;           // 替代文本 (必需)
}

<InfiniteGallery
  images={ImageData[]}   // 图片数组 (必需)
  speed={number}         // 滚动速度 (可选, 默认: 1.2)
  zSpacing={number}      // Z轴间距 (可选, 默认: 3)
  visibleCount={number}  // 可见数量 (可选, 默认: 12)
  falloff={{             // 衰减配置 (可选)
    near: number,        // 近裁剪面 (默认: 0.8)
    far: number          // 远裁剪面 (默认: 14)
  }}
  className={string}     // 自定义类名 (可选)
/>
```

**Props详细说明**:

| Prop | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `images` | `ImageData[]` | ✅ | - | 画廊图片数据数组 |
| `speed` | `number` | ❌ | `1.2` | 自动滚动速度倍率 |
| `zSpacing` | `number` | ❌ | `3` | 图片在Z轴的间距 |
| `visibleCount` | `number` | ❌ | `12` | 同时可见的图片数量 |
| `falloff.near` | `number` | ❌ | `0.8` | 近处淡出距离 |
| `falloff.far` | `number` | ❌ | `14` | 远处淡出距离 |
| `className` | `string` | ❌ | - | 额外的CSS类名 |

#### ConfigPanel 组件

```tsx
import ConfigPanel from '@/components/ConfigPanel';
import type { GalleryConfig } from '@/lib/config-store';

const [config, setConfig] = useState<GalleryConfig>(DEFAULT_CONFIG);

<ConfigPanel
  config={config}                    // 当前配置对象 (必需)
  onConfigChange={(newConfig) => {   // 配置变更回调 (必需)
    setConfig(newConfig);
  }}
  isOpen={boolean}                   // 面板是否打开 (必需)
  onToggle={() => {}}                // 切换打开/关闭 (必需)
/>
```

### 2. 配置状态管理API (Configuration Store API)

#### GalleryConfig 接口定义

```typescript
interface GalleryConfig {
  /* ===== 背景设置 ===== */
  backgroundImage: string | null;    // Base64编码的背景图片
  backgroundOpacity: number;        // 背景透明度 (0-1)
  backgroundBlur: number;            // 背景模糊度 (px)
  backgroundPosition: string;        // 背景位置 ('center' | 'top' | 'bottom')

  /* ===== 视觉风格 ===== */
  glowIntensity: number;             // 光效强度 (0-2)
  ambientTopColor: string;           // 顶部光晕颜色 (rgba)
  ambientLeftColor: string;          // 左侧光晕颜色 (rgba)
  ambientRightColor: string;         // 右侧光晕颜色 (rgba)
  warmPrimaryColor: string;          // 主色调 (hex)

  /* ===== 排版设置 ===== */
  fontSize: string;                  // 字号 ('xs' | 'sm' | 'base' | 'lg' | 'xl')
  fontWeight: string;                // 字重 ('light' | 'normal' | 'medium')
  letterSpacing: number;             // 字距 (em单位)
  textOpacity: number;               // 文字透明度 (0-1)
  lineHeight: number;                // 行高

  /* ===== 动效参数 ===== */
  revealDuration: number;            // 显现时长 (秒)
  revealDelay: number;               // 显现延迟 (秒)
  floatDuration: number;             // 浮动周期 (秒)
  floatDistance: number;             // 浮动距离 (px)
  breatheDuration: number;           // 呼吸周期 (秒)
  auraDuration: number;              // 光晕扩散时长 (秒)
  drawDuration: number;              // 线条绘制时长 (秒)

  /* ===== 布局结构 ===== */
  footerPaddingY: number;            // 底部内边距 (单位乘数)
  separatorWidth: number;            // 分隔线宽度 (单位乘数)
  showMobileHint: boolean;           // 显示移动端提示
  enableGlowEffect: boolean;         // 启用光效
}
```

#### 工具函数说明

```typescript
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  applyConfigToDOM,
} from '@/lib/config-store';

// 获取默认配置
const defaults = DEFAULT_CONFIG;

// 从localStorage加载配置 (如果不存在则返回默认值)
const userConfig = loadConfig();

// 保存配置到localStorage
saveConfig(userConfig);

// 重置为默认配置并保存
resetConfig();

// 将配置应用到DOM CSS变量
applyConfigToDOM(config);
```

### 3. 工具函数API (Utility Functions)

#### cn() 函数 (ClassName合并)

```typescript
import { cn } from '@/lib/utils';

// 基础用法
cn('base-class', 'conditional-class');
// 输出: "base-class conditional-class"

// 条件合并
cn('base', { 'active': isActive, 'disabled': isDisabled });
// 如果isActive=true, isDisabled=false:
// 输出: "base active"

// 合并Tailwind类
cn('px-4 py-2', isActive && 'bg-blue-500', 'rounded-lg');
```

**参数**:
- `...inputs`: ClassValue[] - 可以是字符串、对象、数组或undefined

**返回值**: `string` - 合并后的className

---

## 🎨 样式定制指南 (Customization Guide)

### 方法1: 使用配置面板 (推荐新手)

1. 访问 http://localhost:3051
2. 点击右下角 **⚙ 齿轮按钮**
3. 在可视化界面中调整参数
4. 所有更改自动保存到localStorage

### 方法2: 修改CSS变量 (推荐进阶开发者)

编辑 [app/globals.css](app/globals.css) 中的 `:root` 选择器：

```css
:root {
  /* 修改主色调为蓝色系 */
  --warm-primary: #4A90E2;
  --warm-secondary: #357ABD;
  --warm-accent: #6BA3E8;

  /* 调整背景光效强度 */
  --glow-intensity: 1.5;

  /* 更改模糊程度 */
  --blur-amount: 60px;
}
```

### 方法3: 编程式配置 (适合高级定制)

在代码中直接操作配置对象：

```tsx
import { useState } from 'react';
import { DEFAULT_CONFIG, applyConfigToDOM } from '@/lib/config-store';

function MyCustomPage() {
  const [config] = useState({
    ...DEFAULT_CONFIG,
    warmPrimaryColor: '#FF6B6B',  // 自定义红色主题
    glowIntensity: 1.8,            // 强化光效
    fontSize: 'lg',                 // 大字号
    floatDuration: 8,              // 缓慢浮动
  });

  // 应用配置
  applyConfigToDOM(config);

  return <InfiniteGallery images={images} />;
}
```

---

## 🚀 性能优化 (Performance Optimization)

### 当前性能指标 (Current Performance Metrics)

| 指标 | 数值 | 评级 |
|------|------|------|
| **首次内容绘制 (FCP)** | < 1.5s | 🟢 优秀 |
| **最大内容绘制 (LCP)** | < 2.5s | 🟢 优秀 |
| **首次输入延迟 (FID)** | < 100ms | 🟢 优秀 |
| **累积布局偏移 (CLS)** | < 0.1 | 🟢 优秀 |
| **Lighthouse评分** | 90+ | 🟢 优秀 |
| **构建速度** | < 2s (Turbopack) | 🟢 优秀 |
| **Bundle大小** | 350KB (gzipped: ~110KB) | 🟡 良好 |

### 已实施的优化策略 (Implemented Optimizations)

#### 1. 渲染层优化 (Rendering Optimization)

- ✅ **Turbopack打包器** - 比Webpack快10倍的增量编译
- ✅ **静态导出模式** (`output: 'export'`) - 预渲染所有页面
- ✅ **GPU加速动画** - 使用 `transform` 和 `will-change` 属性
- ✅ **CSS变量驱动** - 运行时无需重新编译
- ✅ **懒加载组件** - `React.lazy()` + `Suspense`

#### 2. 资源加载优化 (Asset Loading Optimization)

- ✅ **图片格式优化** - WebP格式 (比JPEG小25-35%)
- ✅ **字体子集化** - 仅加载使用的字重和字符
- ✅ **Tree Shaking** - 未使用的代码不进入最终产物
- ✅ **Code Splitting** - 按路由自动分割代码块

#### 3. 3D渲染优化 (3D Rendering Optimization)

- ✅ **视锥体剔除** - 只渲染视野内的物体
- ✅ **LOD (Level of Detail)** - 远距离降低多边形数量
- ✅ **实例化渲染** - 相同几何体共享GPU调用
- ✅ **纹理压缩** - 使用压缩纹理格式
- ✅ **请求动画帧节流** - 避免过度渲染

### 进一步优化建议 (Further Optimization Suggestions)

#### PWA支持 (Progressive Web App)

```bash
# 安装PWA插件
pnpm add @serwist/next

# 创建Service Worker
# public/sw.js
# public/sw.js.map (workbox生成)
```

添加manifest.json:

```json
{
  "name": "YYC3 Gallery",
  "short_name": "YYC3",
  "description": "温润艺术风3D画廊",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#d4a574",
  "background_color": "#0a0908",
  "icons": [
    { "src": "/yyc3-icons/Web App/android-chrome-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/yyc3-icons/Web App/android-chrome-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 📱 响应式设计 (Responsive Design)

### 断点系统 (Breakpoint System)

| 设备类型 | 断点范围 | 典型设备 |
|----------|----------|----------|
| **移动端 (Mobile)** | < 640px | iPhone SE, Galaxy S系列 |
| **平板竖屏 (Tablet Portrait)** | 640px - 1024px | iPad Air, iPad Pro 11" |
| **平板横屏 (Tablet Landscape)** | 1024px - 1280px | iPad Pro 12.9", Surface Pro |
| **桌面 (Desktop)** | > 1280px | MacBook, iMac, 外接显示器 |

### 响应式行为 (Responsive Behaviors)

| 功能 | 移动端 (< 640px) | 平板 (640-1024px) | 桌面 (> 1024px) |
|------|-------------------|-------------------|------------------|
| **3D画廊** | 简化效果 | 中等质量 | 完整效果 |
| **配置面板** | 全屏覆盖 | 侧边抽屉 | 浮动面板 |
| **页脚文字** | sm字号 | base字号 | lg字号 |
| **分隔线** | 128px宽 | 200px宽 | 256px宽 |
| **触摸交互** | 优先 | 混合 | 鼠标优先 |
| **移动端提示** | 显示 | 隐藏 | 隐藏 |

---

## 🔄 CI/CD流水线 (CI/CD Pipeline)

### GitHub Actions工作流 (.github/workflows/deploy.yml)

```yaml
触发条件:
  - push 到 main 分支
  - 手动触发 (workflow_dispatch)

权限配置:
  - contents: read
  - pages: write
  - id-token: write

Job流程:
  build → deploy (两阶段)
```

#### Build阶段详情

1. **Checkout** - 拉取代码
2. **Setup pnpm v9** - 安装包管理器
3. **Setup Node.js 20** - 配置运行时 + pnpm缓存
4. **Install dependencies** - `pnpm install --frozen-lockfile`
5. **Build project** - `NODE_ENV=production pnpm run build`
6. **Upload artifact** - 上传 `./out` 目录到GitHub Artifacts

#### Deploy阶段详情

1. **Download artifact** - 下载构建产物
2. **Deploy to Pages** - 部署到GitHub Pages CDN
3. **Return URL** - 返回部署URL

**预计总耗时**: 3-5分钟  
**失败处理**: 自动取消进行中的重复部署

---

## 🌐 部署指南 (Deployment Guide)

### 方案1: GitHub Pages (当前使用) ✅

**优点**: 免费 + 全球CDN + 自动HTTPS + 零运维  
**缺点**: 仅支持静态网站  
**适用场景**: 作品集展示、个人博客、落地页

**已配置完成**:
- ✅ 域名: https://gallery.yyc3.top
- ✅ CI/CD: GitHub Actions自动部署
- ✅ HTTPS: Let's Encrypt自动证书
- ✅ CDN: GitHub Edge Network全球加速

### 方案2: Vercel (推荐备选)

```bash
# 安装Vercel CLI
pnpm i -g vercel

# 部署
vercel --prod
```

**优点**: Serverless函数支持 + 边缘计算 + 实时日志  
**费用**: 免费额度充足 (个人项目够用)

### 方案3: Netlify

```bash
# 安装Netlify CLI
pnpm i -g netlify-cli

# 部署
netlify deploy --prod --dir=./out
```

**优点**: 表单处理 + Identity认证 + Functions  
**费用**: 免费带宽100GB/月

---

## 🧪 测试指南 (Testing Guide)

### 手动测试清单 (Manual Testing Checklist)

#### 功能测试 (Functional Testing)

- [ ] **3D画廊加载**
  - [ ] 8张示例图片正常显示
  - [ ] 无限滚动流畅无卡顿
  - [ ] 鼠标滚轮/触摸滑动正常工作
  - [ ] 拖拽旋转视角正常

- [ ] **配置面板**
  - [ ] 点击齿轮按钮能打开面板
  - [ ] 所有滑块/选择器/开关可操作
  - [ ] 参数调整后实时生效
  - [ ] 刷新页面后配置保留

- [ ] **背景上传**
  - [ ] 能选择本地图片文件
  - [ ] 上传后立即显示为背景
  - [ ] 透明度和模糊度调节有效
  - [ ] 移除背景功能正常

- [ ] **响应式布局**
  - [ ] 移动端 (< 640px) 正常显示
  - [ ] 平板 (640-1024px) 正常显示
  - [ ] 桌面 (> 1024px) 正常显示
  - [ ] 横屏/竖屏切换正常

#### 性能测试 (Performance Testing)

- [ ] **Lighthouse审计** (Chrome DevTools → Lighthouse tab)
  - [ ] Performance ≥ 90
  - [ ] Accessibility ≥ 95
  - [ ] Best Practices ≥ 95
  - [ ] SEO ≥ 90

- [ ] **网络条件模拟**
  - [ ] Slow 3G下可基本使用
  - [ ] Fast 3G下体验良好
  - [ ] WiFi下体验优秀

#### 浏览器兼容性 (Browser Compatibility)

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Chrome | 最新 | ✅ 推荐 | 最佳性能 |
| Firefox | 最新 | ✅ 支持 | 性能良好 |
| Safari | 最新 | ✅ 支持 | macOS/iOS原生 |
| Edge | 最新 | ✅ 支持 | Chromium内核 |
| Opera | 最新 | ✅ 支持 | Chromium内核 |
| IE 11 | - | ❌ 不支持 | 已停止维护 |

---

## 🤝 贡献指南 (Contributing Guide)

我们欢迎所有形式的贡献！无论是新功能、Bug修复、文档改进还是问题报告。

### 如何贡献 (How to Contribute)

#### 1. 报告问题 (Report Issues)

访问 [Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues) 页面提交问题。

**Issue模板**:
```markdown
## 问题描述
清晰描述您遇到的问题

## 复现步骤
1. 步骤一
2. 步骤二
3. 步骤三

## 预期行为
描述应该发生什么

## 实际行为
描述实际发生了什么

## 环境信息
- 操作系统: [如 macOS 14.0]
- 浏览器: [如 Chrome 120]
- Node版本: [如 20.11.0]
- pnpm版本: [如 9.0.0]

## 截图/录屏 (如有)
[附上相关截图或录屏链接]
```

#### 2. 提交代码 (Submit Code)

```bash
# 1. Fork本仓库 (点击GitHub页面右上角Fork按钮)

# 2. 克隆您的Fork
git clone https://github.com/YOUR_USERNAME/YYC3-Infinite-Gallery.git
cd YYC3-Infinite-Gallery

# 3. 创建功能分支
git checkout -b feature/amazing-feature

# 4. 进行开发和测试
# ...编写代码...
pnpm dev          # 本地测试
pnpm build        # 确保构建成功
pnpm typecheck    # 确保类型正确

# 5. 提交更改 (遵循Conventional Commits规范)
git add .
git commit -m "feat: 添加新功能的简短描述"

# 6. 推送到您的Fork
git push origin feature/amazing-feature

# 7. 创建Pull Request
# 访问GitHub仓库页面，点击 "New Pull Request"
```

#### Commit Message规范 (Commit Convention)

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加暗黑模式切换` |
| `fix` | Bug修复 | `fix: 修复移动端配置面板溢出问题` |
| `docs` | 文档更新 | `docs: 更新API文档` |
| `style` | 代码格式 | `style: 调整缩进为2空格` |
| `refactor` | 重构 | `refactor: 简化配置状态管理逻辑` |
| `perf` | 性能优化 | `perf: 减少3D渲染调用次数` |
| `test` | 测试相关 | `test: 添加配置面板单元测试` |
| `chore` | 构建/工具 | `chore: 更新依赖版本` |

**示例完整格式**:
```
feat(config): 添加主题预设功能

- 新增5种内置主题预设 (温暖/冷艳/极简/梦幻/炽热)
- 支持一键应用预设配置
- 预设数据存储在 lib/presets.ts

Closes #123
```

#### 代码风格规范 (Code Style Guidelines)

- **TypeScript严格模式**: 启用所有strict选项
- **ESLint**: 遵循项目 `.eslintrc.json` 配置
- **Prettier**: 自动格式化 (建议配置编辑器保存时自动格式化)
- **命名规范**:
  - 组件: PascalCase (`InfiniteGallery.tsx`)
  - 函数/变量: camelCase (`loadConfig`)
  - 常量: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)
  - CSS类: kebab-case (`warm-primary-color`)
- **注释**: 关键逻辑必须添加中文注释

---

## 📄 许可证 (License)

本项目采用 **MIT License** 开源协议。

```
MIT License

Copyright (c) 2025-2026 YYC³ (言启象限 | 语枢未来)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📊 项目信息 (Project Information)

| 项目 | 详情 |
|------|------|
| **项目名称** | YYC3 Gallery Photography Template |
| **项目代号** | YYC³-Infinite-Gallery |
| **版本号** | v3.0.0 (温润艺术风专业版) |
| **创建日期** | 2025-09-15 |
| **最后更新** | 2026-05-23 |
| **作者/组织** | YYC³ (言启象限 \| 语枢未来) |
| **许可证** | MIT |
| **在线地址** | https://gallery.yyc3.top |
| **仓库地址** | https://github.com/YYC-Cube/YYC3-Infinite-Gallery |
| **包管理器** | pnpm |
| **构建工具** | Next.js 15.5.3 + Turbopack |
| **部署平台** | GitHub Pages (CDN) |

### 🏷️ 技术标签 (Tags)

```
nextjs react three.js react-three-fiber gallery 3d photography
webgl typescript tailwindcss responsive design animation
customizable configuration-panel warm-art-style github-pages
ci-cd pnpm performance optimization
```

---

## 📞 联系方式 (Contact)

### 项目维护者 (Maintainers)

- **YYC³ Team** - [GitHub Organization](https://github.com/YYC-Cube)
- **项目邮箱**: [通过GitHub Issues联系我们](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)

### 社区支持 (Community Support)

- **问题反馈**: [GitHub Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)
- **功能请求**: [GitHub Discussions](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/discussions)
- **Pull Requests**: 欢迎提交！

### 致谢 (Acknowledgments)

- **Next.js团队** - 提供优秀的React框架
- **Three.js社区** - 强大的3D渲染引擎
- **shadcn/ui** - 美观的UI组件库
- **Google Fonts** - Cormorant Garamond字体
- **GitHub** - 免费的代码托管和CI/CD服务

---

## 🗺️ 发展路线图 (Roadmap)

### v3.1.0 (计划中 - 2026 Q2)

- [ ] 多语言支持 (i18n: 中文/英文/日文)
- [ ] PWA离线访问支持
- [ ] 键盘快捷键增强
- [ ] 导入/导出配置JSON

### v3.2.0 (规划中 - 2026 Q3)

- [ ] Headless CMS集成 (Strapi/Sanity)
- [ ] 用户账户系统 (登录/收藏)
- [ ] 社交分享功能
- [ ] 图片懒加载优化

### v4.0.0 (远期规划 - 2026 Q4)

- [ ] VR模式 (WebXR支持)
- [ ] AI智能分类标签
- [ ] 实时协作编辑
- [ ] 移动端App (React Native)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！⭐**

Made with ❤️ by [YYC³](https://github.com/YYC-Cube)

*言启象限 · 语枢未来*

*Powered by Next.js + Three.js + Tailwind CSS*

**最后更新**: 2026-05-23

</div>
