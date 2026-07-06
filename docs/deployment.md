# 🚀 部署指南

本文档提供 YYC3 Infinite Gallery 多种部署方案的完整指南。

---

## 目录

1. [GitHub Pages](#github-pages)（已配置 ✅）
2. [Vercel](#vercel)（推荐）
3. [Netlify](#netlify)
4. [自托管（Docker）](#自托管docker)
5. [环境变量](#环境变量)
6. [自定义域名](#自定义域名)

---

## GitHub Pages

项目已配置 GitHub Actions 自动部署，推送到 `main` 即触发。

### 工作流程

```
git push origin main
    ↓
GitHub Actions: build (pnpm install + pnpm build)
    ↓
GitHub Pages: 部署 /out 目录
    ↓
🌐 https://gallery.yyc3.top
```

### 手动触发部署

```
仓库 → Actions → "Deploy to GitHub Pages" → Run workflow
```

### 注意事项

| 限制 | 说明 |
|------|------|
| `output: export` | 静态导出，不支持 API Routes / SSR |
| `basePath` | 设置为 `/YYC3-Infinite-Gallery`，自定义域名后可为空 |
| Client-side Router | 需使用 `next/link` 或 `next/router` |

---

## Vercel

支持 SSR / API Routes / ISR，是 Next.js 官方推荐平台。

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YYC-Cube/YYC3-Infinite-Gallery)

### 手动配置

1. 导入仓库 → [vercel.com/new](https://vercel.com/new)
2. 配置：

```
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

3. 环境变量：

```
NEXT_PUBLIC_SITE_URL=https://gallery.yyc3.top
```

### 持续部署

| 分支 | 环境 |
|------|------|
| `main` | Production |
| PR 分支 | Preview（每 PR 独立 URL） |

---

## Netlify

### 配置

```
Build command: pnpm build
Publish directory: .out   （静态导出）
                   .next     （SSR 模式）
```

### `netlify.toml`

```toml
[build]
  command = "pnpm build"
  publish = ".out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 自托管（Docker）

### `Dockerfile`

```dockerfile
FROM node:18-alpine AS base
RUN npm i -g pnpm

# ── Build ───────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── Production ─────────────────────────
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "start"]
```

### 构建 & 运行

```bash
docker build -t yyc3-gallery .
docker run -p 3000:3000 yyc3-gallery
```

---

## 环境变量

### 完整列表

| 变量 | 必需 | 描述 | 示例 |
|------|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | 站点 URL | `https://gallery.yyc3.top` |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry DSN | `https://...` |
| `NEXT_PUBLIC_IMAGE_OPTIMIZATION` | ❌ | 启用图片优化 | `true` |

### 本地开发

```bash
# .env.local（不提交到 Git）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
```

---

## 自定义域名

### GitHub Pages + CNAME

`public/CNAME` 文件已包含：

```
gallery.yyc3.top
```

DNS 配置（在域名服务商处设置）：

| 类型 | 名称 | 值 |
|------|------|------|
| `CNAME` | `www` | `yyc3.github.io` |
| `A` | `@` | `185.199.108.153`（GitHub Pages IP） |

> 完整 IP 列表见 [GitHub 文档](https://docs.github.com/en/pages/configuring-a-custom-domain-with-github-pages/verifying-your-custom-domain-for-github-pages)

---

<div align="center">
  <a href="./README.md">← 返回文档首页</a>
</div>
