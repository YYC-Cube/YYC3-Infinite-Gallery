---
file: README.md
title: 01-YYC3-项目规划-组件选型 目录索引
description: 媒体空间设计、开源组件选型调研、复用对照矩阵、实施记录与动效首页设计
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-23
updated: 2026-11-23
status: stable
tags: [planning, selection, media-space, design]
category: documentation
language: zh-CN
audience: developers,designers
complexity: intermediate
---

# 01-YYC3-项目规划-组件选型 目录索引

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 📋 本目录定位

回答「媒体空间为什么这样设计、组件为什么这样选」。包含设计基线、选型调研与实施记录，是理解 `components/media-space/` 与 `lib/media-space/` 的前置阅读。

---

## 📚 文档索引

| 序号 | 文档 | 内容 | 状态 |
| :---: | ---- | ---- | ---- |
| 001 | [可拆分音视频与自主组件空间设计](./001-YYC3-项目规划-可拆分音视频与自主组件空间设计.md) | 五层架构、会话四类状态、拆分合并流程、横竖屏、多开预算、宿主边界 | ✅ 设计基线 |
| 002 | [开源影音组件检索与落地闭环](./002-YYC3-项目规划-开源影音组件检索与落地闭环.md) | 播放器/流媒体/布局组件选型、许可证与接入边界、M0–M4 落地阶段 | ✅ 调研 |
| 003 | [开源组件库复用对照矩阵](./003-YYC3-项目规划-开源组件库复用对照矩阵.md) | 10 个完整开源仓库的能力、许可证、复用方式与风险矩阵 | 📦 参考 |
| 004 | [自主媒体空间落地说明](./004-YYC3-项目实施-自主媒体空间落地说明.md) | 需求落地矩阵、ADR-001（ArtPlayer）、验证数据、剩余边界与增补批次 | ✅ 实施记录 |
| 005 | [动效首页设计](./005-YYC3-规划设计-动效首页.md) | 首页视觉动效规划：光效、入场、呼吸与降级策略 | ✅ 设计 |

---

## 🔗 与其他目录的关系

- 实际实现：`components/media-space/`、`lib/media-space/store.ts`、`lib/media-store.ts`、`lib/media-url.ts`
- 当前架构全貌：[00-YYC3-架构总览-现状全貌](../00-YYC3-架构总览-现状全貌.md)
- 组件准入与许可证：[第三方组件治理台账](../04-YYC3-开发与运维指南/005-YYC3-第三方组件治理台账.md)

---

## 变更历史

| 版本 | 日期 | 变更 |
| ---- | ---- | ---- |
| v1.0.0 | 2026-11-23 | 目录加数字前缀 `01-`，内部文档统一三位序号；新建索引；迁入动效首页设计 |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
