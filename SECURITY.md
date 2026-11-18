---
file: SECURITY.md
title: 安全政策
description: YYC³ Infinite Gallery 安全漏洞报告渠道、响应承诺与处理流程
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-18
updated: 2026-11-18
status: stable
tags: [security, policy, vulnerability]
category: policy
language: zh-CN
audience: developers,users
complexity: basic
---

# 安全政策

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 支持版本

仅最新 `main` 线与最近一个发布版本接收安全修复。

## 报告漏洞

⚠️ **请勿通过公开 Issue 报告安全漏洞。**

- 邮箱：**admin@0379.email**（主题含 `[SECURITY] <项目名>`）
- 请包含：复现步骤、影响范围、环境信息、（如可能）修复建议

## 响应承诺

| 阶段 | 时限 |
|---|---|
| 确认收到 | 48 小时内 |
| 初步评估分级 | 7 天内 |
| 修复或缓解 | 高危 30 天内，其余按排期 |
| 披露 | 修复发布后协调披露 |

## 处理流程

报告 → 确认 → 分级（CVSS）→ 修复 → 回归测试 → 发布 → 协调披露与致谢。

## 依赖安全门禁

- **CI 门禁**：`.github/workflows/deploy.yml` 的 `quality` 阶段执行 `pnpm security:check`，存在可修复漏洞时阻断构建与部署。
- **执行方式**：`pnpm security:check`（调用 `scripts/check-security.mjs`）。
- **修复策略**：直接依赖升级 + `package.json` 中 `pnpm.overrides` 定点提升传递依赖；关闭 `auto-install-peers` 避免 optional peer 引入幽灵依赖图。
- **豁免规则**：仅对上游尚未发布补丁（`patched: null`）的漏洞做白名单豁免，并注明来源与影响；补丁发布后须立即移除豁免。

### 当前豁免清单

| GHSA | 组件 | 原因 | 影响面 |
|------|------|------|--------|
| GHSA-fc5q-39xc-vjpf | picomatch <= 4.0.7 | 上游无补丁版本；来自 `@typescript-eslint → tinyglobby` 开发链 | 仅开发期，不进入生产运行时 |

## 修复记录

- **2026-11-18**：修复远程 Dependabot 全部 64 项告警（2 critical / 33 high / 22 medium / 7 low）。核心措施：升级 `next` 至 `16.4.6`、`sharp` 至 `0.35.5`；通过 overrides 修复 `node-forge`、`brace-expansion`、`js-yaml`、`minimatch`、`postcss`、`browserslist`、`fflate`、`glob`、`zod`、`ws`、`uuid`、`image-size`、`@babel/core` 等传递依赖；关闭 `auto-install-peers` 清除 expo 幽灵依赖图。审计结果由 64 项降至 2 项（均为上游无补丁的 picomatch 告警，已受控豁免）。

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.1.0 | 2026-11-18 | 新增依赖安全门禁、豁免规则与漏洞修复记录 | YYC³ Team |
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
