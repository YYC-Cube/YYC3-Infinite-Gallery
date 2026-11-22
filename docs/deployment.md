---
file: deployment.md
title: 部署指南
description: YYC³ Infinite Gallery 多环境部署、发布门禁、资产治理与安全响应头运维指南
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-18
updated: 2026-11-22
status: stable
tags: [deployment, guide, github-pages, operations, assets, csp]
category: documentation
language: zh-CN
audience: developers,devops
complexity: intermediate
---

# 部署指南

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

本文档提供 YYC³ Infinite Gallery 的部署、发布门禁、回滚、资产治理与安全响应头运维指南。

---

## 目录

1. [GitHub Pages](#github-pages)（已配置 ✅）
2. [Vercel](#vercel)
3. [Netlify](#netlify)
4. [自托管（Docker）](#自托管docker)
5. [环境变量](#环境变量)
6. [自定义域名](#自定义域名)
7. [CI/CD 流水线与发布门禁](#cicd-流水线与发布门禁)
8. [发布回滚手册](#发布回滚手册)
9. [静态资产治理](#静态资产治理)
10. [安全响应头与 CSP](#安全响应头与-csp)
11. [监控与故障处置](#监控与故障处置)

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

## CI/CD 流水线与发布门禁

工作流文件：`.github/workflows/deploy.yml`（名称：YYC³ Quality Gate & Deploy）。触发条件：main push、指向 main 的 PR、手动 `workflow_dispatch`。

### 四个 Job 与依赖顺序

| 顺序 | Job | 内容 | 失败影响 |
| ---- | ---- | ---- | ---- |
| 1 | Quality Gate | 安装依赖 → typecheck → lint → test:coverage → docs:check → **assets:check** → security:check | 阻断后续全部 Job |
| 2 | Build | `pnpm build` 静态导出 → 产物文件名安全守卫 → 上传 `static-out` 制品（供 E2E 复用）+ Pages 制品 | 阻断 E2E 与部署 |
| 3 | E2E | 下载构建产物 → Playwright Chromium 关键路径（7 条） | 阻断部署 |
| 4 | Deploy | 仅 main push 触发，`actions/deploy-pages` 发布 | — |

### 关键约束

- **并发控制**：`concurrency.group = pages`，`cancel-in-progress: false`，避免 Pages 部署竞态。
- **权限最小化**：`contents: read` / `pages: write` / `id-token: write`。
- **构建制品复用**：E2E 不重复构建，直接下载 `static-out`，缩短流水线约 1 分钟。
- **产物文件名守卫**：构建后扫描 `out/`，出现冒号、尖括号、竖线等字符立即失败（这类文件名会导致 `upload-artifact` 校验失败且不兼容 NTFS）。
- **PR 只验证不部署**：PR 运行前三 Job，Deploy 因 `if` 条件跳过。
- **Node/pnpm 版本**：Node 22、pnpm 9.15.0，由 workflow 顶层 `env` 统一管理。

### 本地对齐命令

```bash
pnpm typecheck && pnpm lint && pnpm test:coverage \
  && pnpm docs:check && pnpm assets:check && pnpm security:check \
  && pnpm build && pnpm test:e2e
```

---

## 发布回滚手册

### 回滚方式（按影响面从小到大）

| 场景 | 操作 | 恢复时间 |
| ---- | ---- | ---- |
| 单个功能异常 | `git revert <commit>` 后 push main，等待流水线重建部署 | 一个流水线周期 |
| 整批发布异常 | `git revert <batch-range>`（保留历史，不 force push） | 一个流水线周期 |
| Pages 部署失败但构建成功 | Actions → 重跑失败 Job（`gh run rerun <run-id>`） | 分钟级 |
| 自定义域名/DNS 异常 | 核对 `public/CNAME` 与 DNS 记录后重跑 Deploy | 分钟级 |

### 回滚纪律

1. 禁止 `git push --force` 到 main，禁止跳过 CI 门禁（`--no-verify`）。
2. 回滚必须走 revert 提交，保留事故可追溯性。
3. Service Worker 不会在播放中强制刷新；若回滚涉及 SW 缓存策略，需同步更新 `sw.js` 版本占位符（`generate-sw-assets.mjs` 自动写入哈希）。
4. 回滚后必须验证：站点 200、关键静态资源 200、E2E 关键路径通过。

---

## 静态资产治理

### 预算门禁（`pnpm assets:check`）

脚本：`scripts/check-assets-budget.mjs`；已接入 CI Quality Gate，超标即阻断合并。

| 维度 | 预算 | 2026-11-22 实测 | 余量 |
| ---- | ---- | ---- | ---- |
| public 总量 | 120MB | 108.6MB（90%） | 11.4MB |
| 音频总量 | 75MB | 67.7MB（90%） | 7.3MB |
| 视频总量 | 28MB | 26.2MB（94%） | 1.8MB |
| 图片总量 | 16MB | 14.6MB（91%） | 1.4MB |
| 单文件 | 8MB | 7.55MB（mp3 最长曲目） | 0.45MB |
| 文件名 | 禁止 `: < > \| " * ?` | 通过 | — |

> 预算按实测基线上浮约 10% 设定，目的是**防止继续增长**，不是压制既有资产。

### 资产体积结论（C-03 实测）

- 视频于 2026-11-21 已从 HEVC 转码为 H.264 CRF 24（全浏览器可解码），总量 26.2MB。
- 2026-11-22 评估二次压缩至 CRF 26：仅减少约 2MB（-8%），且引入二次编码画质损失，**判定不替换**，保留 CRF 24 版本。
- 音频为约 175kbps VBR 高品质（产品定位「音乐典藏」），**不做降码率处理**；如需缩减体积应交给 CDN 分发而非牺牲音质。
- 结论：仓库内继续承载现有资产，增量治理走预算门禁；**大体积新增媒体必须走外部托管**。

### 大媒体迁移路径（按推荐顺序）

| 方案 | 适用 | 操作要点 |
| ---- | ---- | ---- |
| 对象存储 + CDN（推荐） | 新增音频/视频/大图 | 上传至 S3/R2/OSS，`public/` 只保留元数据与封面；`lib/media-store.ts` 中的 `src` 改为 CDN 绝对 URL 或环境变量前缀 `NEXT_PUBLIC_MEDIA_BASE_URL` |
| Git LFS | 必须留在仓库的少量大文件 | `git lfs install` → `git lfs track "public/mp3/**" "public/mv-*/**"` → 提交 `.gitattributes`；注意 GitHub Pages 仍需在构建时拉取 LFS 对象 |
| 构建期外链 | 临时方案 | 构建前脚本从对象存储同步至 `public/`，产物不随仓库体积增长，但 CI 需配置访问凭证（仅存 Secrets） |

迁移前必须：核对媒体内容授权（代码许可证不覆盖音频/视频内容）、更新 SW 预缓存范围（`scripts/generate-sw-assets.mjs`）、跑 `pnpm assets:check` 与 E2E。

---

## 安全响应头与 CSP

### 平台限制

GitHub Pages 不支持自定义响应头，因此**响应头形式的 CSP/HSTS/X-Frame-Options 无法在源站设置**。`meta` 形式 CSP 在该站点需保留 `'unsafe-inline'`（Next 静态导出的内联脚本与样式），防护收益有限，不能替代响应头。

### 推荐方案：边缘层注入响应头

将域名托管到 Cloudflare（或其他支持 `_headers` 的边缘平台），在边缘层追加响应头，源站仍为 GitHub Pages：

```text
# Cloudflare Transform Rules → Modify Response Header（或 Pages Functions）
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: https:; connect-src 'self' https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Netlify 或 Cloudflare Pages 部署则使用仓库根 `_headers` 文件，内容同上。

### 落地检查

1. 用 `curl -I https://<域名>/` 确认响应头返回，且 `content-security-policy` 存在。
2. 浏览器控制台无 CSP 违规报错；媒体播放、PWA 安装、Service Worker 注册正常。
3. 若采用 `media-src` 限制，必须显式允许 CDN 域（`https:` 通配仅作过渡）。
4. `frame-ancestors 'none'` 与 `X-Frame-Options: DENY` 同时存在时，前者优先生效。

---

## 监控与故障处置

### 内置可观测能力

| 能力 | 位置 | 说明 |
| ---- | ---- | ---- |
| Web Vitals | `lib/performance-monitor.ts` | LCP/CLS/INP/FCP/TTFB 本地持久化，支持宿主上报（默认关闭） |
| 错误边界 | `app/error.tsx` | 渲染异常展示可恢复界面，不白屏 |
| 宿主健康 | `lib/host-bridge.ts` | 能力协商 + 离线状态提示 |
| SW 更新 | `components/PWAProvider.tsx` | 检测 waiting/updatefound 并提示 |

### 常见故障处置表

| 现象 | 首查 | 处置 |
| ---- | ---- | ---- |
| 页面白屏 | Actions 最近一次 Build/Deploy 状态；`out/index.html` 是否有正文 | 回滚最近提交；确认产物文件名守卫通过 |
| 视频「加载或解码失败」 | 源文件编码是否 H.264 | 用 `ffprobe` 复检；重新转码（`-c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart`） |
| 音频/视频 404 | 资源路径大小写与目录名 | 目录统一 `3x4/4x3` 命名，禁止冒号 |
| 更新后仍是旧页面 | Service Worker 缓存 | 提示用户刷新或等待 SW 自动接管；必要时提升 SW 版本哈希 |
| 设置/媒体状态丢失 | localStorage 配额或隐私模式 | 检查控制台 storage 异常；背景图已迁移 IndexedDB（assetId） |
| CI 卡在制品上传 | 产物内文件名非法 | 运行 `pnpm assets:check` 与构建守卫，重命名违规文件 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.1.0 | 2026-11-22 | 增补 CI/CD 门禁与依赖顺序、发布回滚手册、静态资产治理（预算门禁与实测基线、CDN/LFS 迁移路径）、安全响应头与 CSP 边缘模板、监控与故障处置表 | YYC³ Team |
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
