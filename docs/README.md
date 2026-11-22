---
file: README.md
title: YYC³ Infinite Gallery 文档中心
description: YYC³ Infinite Gallery 文档导航：架构总览、规划、团队标规、开发运维、智能演进与治理台账
author: YYC³ Team <admin@0379.email>
version: v3.0.0
created: 2026-11-18
updated: 2026-11-23
status: stable
tags: [docs, index, navigation]
category: documentation
language: zh-CN
audience: developers,devops,users
complexity: basic
---

# YYC³ Infinite Gallery 文档中心

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 📋 说明

本目录是项目唯一文档中心，**已纳入版本库**（约 600KB 纯文本），CI 的 `pnpm docs:check` 会对全部文档做标规校验（front matter、品牌写法、标头标尾、相对链接）。仅 `/docs/YYC3-MusAI-开源组件库/` 等第三方源码快照与 `docs/**/*.zip` 被忽略。

> **目录重构（2026-11-23）**：根目录散落文档已全部迁入数字前缀目录；`YYC3-项目规划-组件选型` → `01-`，团队标规与开发指南 → `02-`/`03-`，新增 `04-开发与运维指南`，评估与演进类文档统一收敛到 `11-`。

---

## 🗂️ 目录结构

| 目录 | 定位 | 入口 |
| ---- | ---- | ---- |
| [00-YYC3-架构总览-现状全貌.md](./00-YYC3-架构总览-现状全貌.md) | **先读这篇**：技术栈、模块、状态层、数据流、门禁与边界的完整现状 | 单文件 |
| [01-YYC3-项目规划-组件选型](./01-YYC3-项目规划-组件选型/README.md) | 媒体空间设计、开源选型调研、复用对照矩阵、实施记录、动效设计 | 5 篇 |
| [02-YYC3-团队通用-标规文档](./02-YYC3-团队通用-标规文档/README.md) | 五维驱动、开发标准、命名规范、标头标尾、文档闭环（严格标规校验） | 6 篇 |
| [03-YYC3-团队通用-开发指南](./03-YYC3-团队通用-开发指南/README.md) | 快速入门、架构总纲、编码/测试/部署/安全/多端/插件（严格标规校验） | 8 篇 |
| [04-YYC3-开发与运维指南](./04-YYC3-开发与运维指南/README.md) | 开发流程、API 参考、PWA、部署与运维（含回滚/CSP/资产治理）、第三方组件台账 | 5 篇 |
| [11-YYC3-智能演进-优化阶段](./11-YYC3-智能演进-优化阶段/README.md) | 阶段总结、全维评估、闭环记录、文档对齐台账、主题系统规格 | 8 篇 |

---

## 🚀 按读者路径

| 你是 | 建议顺序 |
| ---- | ---- |
| 第一次接触项目 | [架构总览](./00-YYC3-架构总览-现状全貌.md) → [开发指南](./04-YYC3-开发与运维指南/001-YYC3-开发指南.md) → [部署运维](./04-YYC3-开发与运维指南/004-YYC3-部署与运维指南.md) |
| 要改代码 | [架构总览](./00-YYC3-架构总览-现状全貌.md) → [编码规范](./03-YYC3-团队通用-开发指南/YYC3-开发者-编码规范.md) → [测试策略](./03-YYC3-团队通用-开发指南/YYC3-开发者-测试策略.md) |
| 要发布/排障 | [部署与运维指南](./04-YYC3-开发与运维指南/004-YYC3-部署与运维指南.md)（含回滚手册、故障处置表） |
| 要做设计/主题 | [自定义主题系统规格](./11-YYC3-智能演进-优化阶段/008-YYC3-自定义主题系统规格.md) → [动效首页](./01-YYC3-项目规划-组件选型/005-YYC3-规划设计-动效首页.md) |
| 要了解进度与债务 | [文档对齐评估（含 G/C 台账）](./11-YYC3-智能演进-优化阶段/004-YYC3-文档设计对齐评估报告.md) → [第七批闭环总结](./11-YYC3-智能演进-优化阶段/005-YYC3-第七批闭环总结与运维基线.md) |
| 要引入第三方 | [第三方组件治理台账](./04-YYC3-开发与运维指南/005-YYC3-第三方组件治理台账.md)（准入清单 + 许可证实测） |

---

## 🎯 命名与标规不变量

1. 目录：`{序号}-YYC3-{主题}`，序号 2 位（00–99）
2. 文档：`{序号}-YYC3-{功能}-{描述}.md`，序号 3 位（001–999）
3. 正文品牌写作 `YYC³`，文件名、路径、代码标识使用 ASCII `YYC3`
4. `02-`/`03-` 为严格标规目录：必须有完整 front matter（字段顺序固定）、品牌标语五行、`## 变更历史`、唯一 `<p align="center">` 页脚
5. 其余目录校验品牌写法与相对链接，不强制 front matter
6. 历史快照文档保留原文，仅在顶部加「历史快照」声明，不回改数据
7. 台账类文档（G/C 编号）闭环后必须回写状态与日期，禁止无痕删除

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v3.0.0 | 2026-11-23 | 目录数字前缀重构：根目录文档全部迁入 01/04/11；新建 00 架构总览与各目录 README；docs 纳入版本库后 CI 覆盖全部文档 | YYC³ Team |
| v2.0.0 | 2026-11-21 | 迁入 03/11 阶段文档、归档旧规划、清理 MusAI、重建索引 | YYC³ Team |
| v1.0.0 | 2026-11-18 | 新建文档中心索引 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
