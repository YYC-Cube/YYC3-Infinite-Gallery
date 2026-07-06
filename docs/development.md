# 🔧 开发指南

本文档提供本地开发、调试和代码规范的完整指南。

---

## 目录

1. [环境设置](#环境设置)
2. [项目结构](#项目结构)
3. [开发流程](#开发流程)
4. [代码规范](#代码规范)
5. [调试技巧](#调试技巧)
6. [常见问题](#常见问题)

---

## 环境设置

### 必需依赖

| 工具 | 版本 | 安装 |
|------|------|------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org/) |
| pnpm | ≥ 8 | `npm i -g pnpm` |

### 推荐 IDE 配置

#### VS Code 扩展

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "gruntfuggly.todo-tree"
  ]
}
```

#### VS Code 设置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.preferences.preferTypeOnlyAutoImports": true
}
```

---

## 项目结构

```
yyc3-infinite-gallery/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # 根布局（Metadata 配置在这里）
│   ├── page.tsx         # 首页
│   └── globals.css      # 全局样式
├── components/           # React 组件
│   ├── ui/             # 基础 UI（Button, Modal 等）
│   ├── Gallery.tsx     # 画廊主组件
│   └── Scene3D.tsx    # 3D 场景组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具函数
├── types/               # TypeScript 类型定义
├── public/              # 静态资源
│   ├── manifest.json   # PWA Manifest
│   ├── sw.js          # Service Worker
│   └── offline.html   # 离线 Fallback
├── docs/                # 文档
└── ...
```

---

## 开发流程

### 启动开发服务器

```bash
pnpm dev
# → http://localhost:3000 (Turbopack)
```

### 代码质量检查

```bash
# TypeScript 类型检查
pnpm typecheck

# ESLint 检查 + 自动修复
pnpm lint:fix

# Prettier 格式化全部文件
pnpm format

# 检查格式是否符合规范
pnpm format:check
```

### 构建验证

```bash
# 完整生产构建（静态导出）
pnpm build

# 本地预览生产版本
pnpm start
```

---

## 代码规范

### Commit 消息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>
```

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(gallery): add spiral layout` |
| `fix` | Bug 修复 | `fix(3d): resolve camera jitter` |
| `docs` | 文档 | `docs(readme): update badge section` |
| `style` | 格式 | `style: format with prettier` |
| `refactor` | 重构 | `refactor(hooks): simplify state logic` |
| `perf` | 性能 | `perf(3d): enable geometry instancing` |
| `test` | 测试 | `test(gallery): add snap test` |
| `chore` | 构建/依赖 | `chore(deps): upgrade three to 0.185` |

### TypeScript 规范

- 所有组件 Props 必须显式定义接口
- 避免使用 `any`，使用 `unknown` 或具体类型
- 导出 Props 类型供外部使用

```typescript
// ✅ Good
export interface GalleryProps {
  images: GalleryImage[]
  options?: GalleryOptions
}

export function Gallery({ images, options }: GalleryProps) { ... }

// ❌ Avoid
export function Gallery(props: any) { ... }
```

### React 规范

- 使用函数组件 + Hooks
- 用 `React.memo` 包裹纯展示组件
- 用 `useMemo` / `useCallback` 缓存昂贵计算

---

## 调试技巧

### 3D 场景调试

```typescript
// 在组件中临时添加
import { useThree } from '@react-three/fiber'

function DebugOverlay() {
  const { camera, gl, scene } = useThree()
  console.log('Camera:', camera.position)
  console.log('Scene children:', scene.children.length)
  return null
}
```

### 性能分析

```bash
# 构建并生成打包体积报告
pnpm analyze
# → 打开 .next/analyze/client.html
```

### PWA 调试

1. 打开 Chrome DevTools → **Application** 标签
2. 检查 **Manifest** 是否正确加载
3. 检查 **Service Workers** 是否已注册
4. **Network** 标签勾选 `Offline` 测试离线行为

---

## 常见问题

### `pnpm install` 报错 `packages field missing`

→ 删除 `pnpm-workspace.yaml`（非 monorepo 项目不需要），重新运行 `pnpm install`。

### 3D 场景黑屏

→ 检查浏览器是否支持 WebGL 2.0：
```javascript
console.log(document.createElement('canvas').getContext('webgl2'))
// → null = 不支持
```

### Port 3000 被占用

```bash
# 自动切换到可用端口（Next.js 自动处理）
pnpm dev
# → 使用 3001, 3002...

# 或手动指定端口
PORT=3456 pnpm dev
```

### `tsc --noEmit` 报错但 `pnpm dev` 正常

→ `next.config.mjs` 中 `typescript.ignoreBuildErrors` 默认 `false`（严格模式）。请修复 TS 错误而非忽略。

---

<div align="center">
  <a href="./README.md">← 返回文档首页</a>
</div>
