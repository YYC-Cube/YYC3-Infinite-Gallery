---
file: README.md
title: 04-YYC3-开发与运维指南 目录索引
description: 开发流程、API 参考、PWA、部署与运维（回滚/CSP/资产治理）与第三方组件台账
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-23
updated: 2026-11-23
status: stable
tags: [development, operations, deployment, pwa]
category: documentation
language: zh-CN
audience: developers,devops
complexity: intermediate
---

# 04-YYC3-开发与运维指南 目录索引

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 📋 本目录定位

面向「跑起来、改得动、发得出去、出故障能处置」。所有命令与门禁与仓库 `package.json`、`.github/workflows/deploy.yml` 保持同步。

---

## 📚 文档索引

| 序号 | 文档 | 内容 | 状态 |
| :---: | ---- | ---- | ---- |
| 001 | [开发指南](./001-YYC3-开发指南.md) | 环境准备、目录约定、开发流程、常用命令 | ✅ 可用 |
| 002 | [API 参考](./002-YYC3-API-参考.md) | 组件 Props、store 接口、类型定义 | ✅ 可用 |
| 003 | [PWA 指南](./003-YYC3-PWA-指南.md) | manifest、Service Worker、离线与更新策略 | ✅ 可用 |
| 004 | [部署与运维指南](./004-YYC3-部署与运维指南.md) | 多环境部署、CI 四 Job 门禁、回滚手册、资产预算、CSP 响应头、故障处置 | ✅ 可用 |
| 005 | [第三方组件治理台账](./005-YYC3-第三方组件治理台账.md) | 依赖许可证实测、组件基座台账、准入清单、外部项目合规边界 | ✅ 有效 |

---

## ⚡ 高频命令速查

```bash
pnpm dev            # 本地开发（端口 3033）
pnpm dev:lan        # 局域网调试（含 allowedDevOrigins 说明见 .env.example）
pnpm typecheck && pnpm lint && pnpm test:coverage
pnpm docs:check && pnpm assets:check && pnpm security:check
pnpm build && pnpm test:e2e
pnpm assets:plan    # 生成媒体外迁清单（CDN/对象存储）
```

---

## 变更历史

| 版本 | 日期 | 变更 |
| ---- | ---- | ---- |
| v1.0.0 | 2026-11-23 | 新建目录（`04-`），将根目录 api / development / pwa / deployment 与治理台账迁入并统一三位序号 |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
