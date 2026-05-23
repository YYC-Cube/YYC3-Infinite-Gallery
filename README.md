# 🌟 yyc3-infinite-gallery

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-blue)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.0-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0.0-06B6D4)](https://tailwindcss.com/)

## 📖 项目介绍

yyc3-infinite-gallery 是一个基于Next.js和Three.js构建的高性能3D无限滚动画廊展示系统。该项目为摄影师、艺术家和设计师提供了一个沉浸式的作品展示平台，支持3D交互、自动布局和响应式设计。

### 🎯 核心特性

- **3D无限滚动**: 流畅的3D空间中无限展示内容
- **沉浸式体验**: 基于React Three Fiber的高性能WebGL渲染
- **智能布局**: 自动优化内容排列和视觉效果
- **多设备支持**: 完美适配桌面端、平板和手机
- **多交互方式**: 支持键盘、鼠标滚轮和触摸交互
- **优雅降级**: 在不支持WebGL的环境中提供替代方案
- **性能优化**: 懒加载、资源预加载和渲染优化

## 🛠 技术栈

- **前端框架**: Next.js 15.5.3 (App Router)
- **3D渲染**: React Three Fiber, Drei, Three.js
- **样式系统**: Tailwind CSS 4.0.0
- **类型系统**: TypeScript 5.2.0
- **包管理**: pnpm
- **字体**: Google Fonts (Geist Mono, Instrument Serif)

## 📦 快速开始

### 安装依赖

```bash
# 使用pnpm安装依赖
pnpm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 运行生产服务器
pnpm start
```

### 代码检查

```bash
# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

## 📁 项目结构

```
├── app/                    # Next.js App Router目录
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局组件
│   └── page.tsx            # 首页组件
├── components/             # React组件
│   └── InfiniteGallery.tsx # 核心3D画廊组件
├── lib/                    # 工具库
│   └── utils.ts            # 通用工具函数
├── docs/                   # 项目文档
│   └── yyc3_infinite_gallery_roadmap.md # 项目开发规划
├── public/                 # 静态资源
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
└── tailwind.config.js      # Tailwind CSS配置
```

## 📋 API文档

### 1. 核心组件接口

#### InfiniteGallery 组件

```tsx
import InfiniteGallery from '@/components/InfiniteGallery';

// 基本用法
<InfiniteGallery 
  images={images} 
  options={options}
  onImageClick={handleImageClick}
/>
```

**参数说明**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `images` | `ImageData[]` | 是 | 画廊图片数据数组 |
| `options` | `GalleryOptions` | 否 | 画廊配置选项 |
| `onImageClick` | `(image: ImageData) => void` | 否 | 图片点击回调函数 |

**ImageData 接口**:

```typescript
interface ImageData {
  id: string;             // 图片唯一标识
  src: string;            // 图片URL
  alt?: string;           // 替代文本
  title?: string;         // 图片标题
  description?: string;   // 图片描述
  aspectRatio?: number;   // 图片宽高比
  tags?: string[];        // 标签数组
}
```

**GalleryOptions 接口**:

```typescript
interface GalleryOptions {
  initialZoom?: number;              // 初始缩放级别 (默认: 1)
  zoomSensitivity?: number;          // 缩放敏感度 (默认: 0.1)
  scrollSensitivity?: number;        // 滚动敏感度 (默认: 1)
  rotationSensitivity?: number;      // 旋转敏感度 (默认: 0.01)
  autoPlay?: boolean;                // 自动播放 (默认: false)
  autoPlaySpeed?: number;            // 自动播放速度 (默认: 1)
  enableKeyboard?: boolean;          // 启用键盘控制 (默认: true)
  enableTouch?: boolean;             // 启用触摸控制 (默认: true)
  enableMouseWheel?: boolean;        // 启用鼠标滚轮 (默认: true)
  backgroundColor?: string;          // 背景颜色 (默认: '#000000')
  imageSize?: number;                // 图片初始大小 (默认: 300)
  spacing?: number;                  // 图片间距 (默认: 50)
  layout?: 'grid' | 'random' | 'spiral'; // 布局模式 (默认: 'grid')
  depth?: number;                    // 3D深度效果 (默认: 10)
  shadows?: boolean;                 // 启用阴影 (默认: true)
  reflection?: boolean;              // 启用反射 (默认: false)
}
```

### 2. 工具函数API

#### cn 函数 (样式合并)

```typescript
import { cn } from '@/lib/utils';

// 合并多个className
const className = cn('base-class', 'conditional-class', { 'dynamic-class': condition });
```

**参数说明**:
- 接受任意数量的字符串或对象参数
- 对象参数中，键为类名，值为条件表达式

**返回值**:
- 合并后的className字符串

### 3. 页面路由

| 路由 | 描述 | 参数 |
|------|------|------|
| `/` | 首页画廊 | 无 |
| `/api/health` | 健康检查接口 | 无 |

### 4. 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `ArrowUp` | 向上滚动 |
| `ArrowDown` | 向下滚动 |
| `ArrowLeft` | 向左滚动 |
| `ArrowRight` | 向右滚动 |
| `+` / `=` | 放大 |
| `-` / `_` | 缩小 |
| `0` | 重置缩放 |
| `Space` | 暂停/播放 |
| `Escape` | 退出全屏模式 |
| `F` | 切换全屏模式 |

## 🎨 样式定制

项目使用Tailwind CSS进行样式管理，可以通过以下方式进行定制：

1. **修改`tailwind.config.js`**调整全局主题配置
2. **更新`app/globals.css`**中的全局样式变量
3. **组件内联样式**通过Tailwind类名进行定制

### 主题颜色变量

在`app/globals.css`中定义了以下CSS变量：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

## 🚀 性能优化建议

### 图片优化

1. 使用响应式图片格式（WebP, AVIF）
2. 实现图片懒加载和渐进式加载
3. 预加载即将查看的图片
4. 合理设置图片压缩质量和分辨率

### 渲染优化

1. 减少不必要的重渲染
2. 使用`React.memo`优化组件渲染
3. 实现视锥体剔除减少渲染对象
4. 优化几何体和材质数量
5. 实现LOD（Level of Detail）根据距离调整渲染细节

### 网络优化

1. 启用HTTP/2或HTTP/3
2. 配置适当的缓存策略
3. 使用CDN分发静态资源
4. 实现Service Worker支持离线访问

## 📱 响应式设计

项目支持多设备适配，主要断点设置：

- **移动端**: < 640px
- **平板**: 640px - 1024px
- **桌面**: > 1024px

### 移动端优化

- 简化3D效果减少性能消耗
- 增大触摸目标尺寸
- 优化虚拟键盘交互
- 针对移动网络优化资源加载

## ⚠️ 已知限制

1. **浏览器兼容性**: 需要支持WebGL 2.0的现代浏览器
2. **性能要求**: 在低端设备上可能出现性能问题
3. **大文件处理**: 超大分辨率图片可能导致加载延迟
4. **内容量限制**: 一次性加载过多图片可能影响性能

## 🛡️ 错误处理与降级

项目包含完善的错误处理机制：

1. **WebGL检测**: 自动检测浏览器是否支持WebGL
2. **降级方案**: 不支持WebGL时提供静态布局替代
3. **错误边界**: 组件级错误捕获防止整个应用崩溃
4. **图片加载失败处理**: 提供占位符和重试机制

## 📝 开发指南

### 添加新功能

1. 创建新组件或修改现有组件
2. 遵循TypeScript类型定义规范
3. 编写适当的文档和注释
4. 确保响应式兼容性
5. 测试性能影响

### 代码风格

- 使用ESLint和Prettier保持代码风格一致
- 遵循TypeScript最佳实践
- 组件命名使用PascalCase
- 文件命名使用PascalCase（组件）或camelCase（工具）

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 详情请查看 [LICENSE](LICENSE) 文件

## 📧 联系我们

**项目作者**: YYC³  
**版本**: 1.0.0  
**创建日期**: 2025-09-15  

---

感谢使用 yyc3-infinite-gallery！我们致力于提供最佳的3D内容展示体验。如有任何问题或建议，欢迎联系我们。

保持代码健康，稳步前行！ 🌹
