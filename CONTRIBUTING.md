# 🤝 贡献指南

感谢你考虑为 YYC3 Infinite Gallery 贡献代码！

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

- 查看 [文档](./docs/README.md)
- 搜索 [现有 Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues)
- 加入 [Discussions](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/discussions)

---

<div align="center">
  <p>再次感谢你的贡献！🙏</p>
</div>
