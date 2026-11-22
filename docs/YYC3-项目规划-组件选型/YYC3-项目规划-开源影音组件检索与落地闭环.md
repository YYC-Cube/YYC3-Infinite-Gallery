---
title: YYC³ 开源影音组件检索与项目规划落地闭环
description: 本地音乐组件盘点、音乐/社交/媒体/视频/综艺开源项目筛选及分阶段落地计划
author: YYC³ Team
version: 1.1.0
status: 已进入实施 · Web/PWA 基线完成
created: 2026-11-18
updated: 2026-11-19
---

# YYC³ 开源影音组件检索与项目规划落地闭环

## 📋 文档说明

本文服务于 `YYC3-Infinite-Gallery` 的可拆分音视频、自主组件空间和多端宿主架构，包含：

1. 本地 `yyc3-music-monorepo` 组件包盘点与可复用项分级。
2. 音乐、社交、媒体、视频、综艺/直播及全局 UI/UX 开源项目与完整源码组件包筛选。
3. 官方源码、拉取或下载路径、功能定位、推荐理由、许可证及接入边界。
4. 从概念验证、开发、测试、发布到运营回滚的项目落地闭环。

关联设计：[YYC³ 可拆分音视频与自主组件空间设计](./YYC3-项目规划-可拆分音视频与自主组件空间设计.md)。

### 调研方法与口径

- 调研日期：2026-11-18。
- 本地盘点：静态只读检查 3 个 apps、17 个 packages，未修改源仓库，未运行其构建或测试。
- 在线检索：多组实时网页检索，并通过 GitHub 官方 API 批量核验 24 个候选仓库；对 Video.js、hls.js、Vidstack 等继续读取上游 README/LICENSE。
- “完整源码”指官方上游提供可检查的完整项目或组件源码，不等于已通过本项目兼容性、安全或生产验收。
- 许可证和活跃度具有时效性；实际拉取时必须固定 commit/tag，重新核验许可证、依赖和 SBOM。
- 本文只提供路径与规划，未执行外部项目下载、安装或部署。

## 一、决策摘要

### 1.1 推荐技术组合

| 层级            | 首选                                                   | 使用边界                                                           |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| 播放器框架      | ArtPlayer 5.4（当前实施）；Video.js 10（升级候选）     | 当前多实例采用 ArtPlayer；原生事件驱动独立会话，控制 UI 由项目自建 |
| 自定义控制 UI   | Media Chrome                                           | 仅在需要完全自定义控制条时采用，不与 Video.js 10 控制体系重复叠加  |
| 流媒体          | hls.js；DASH/DRM 场景再评估 Shaka Player               | 按需加载，不在首版同时打包全部引擎                                 |
| 音频波形        | wavesurfer.js                                          | 波形、剪辑、精确 seek；不创建第二套隐式播放时钟                    |
| 停靠网格        | React Grid Layout v2                                   | 响应式网格、拖拽、缩放、碰撞和受控布局                             |
| 列表/跨容器拖拽 | dnd kit                                                | 歌单排序、组件目录拖入，不替代自由浮窗管理器                       |
| 全局 UI         | 复用现有 Radix/shadcn 风格组件                         | 不重复建设第二套基础 UI                                            |
| 动效            | 现有 CSS + 按需 Motion                                 | 统一 reduced-motion、后台暂停和低端降级                            |
| 本地复用        | design tokens、精选 UI、播放器受控 UI、AudioVisualizer | 拆取并改造边界，不整体照搬 monorepo                                |

### 1.2 关键选型变化

截至 2026-11-18，Vidstack 官方声明进入仅安全修复维护，1.x 安全维护计划至 2028 年 1 月，相关团队转向 Video.js 10；Plyr 也不再作为新增项目首选。因此：

- 新项目评估以 **Video.js 10** 为主，不再以 Vidstack 为新基线。
- 当前实施阶段采用 **ArtPlayer 5.4** 满足多实例和自定义控制；Video.js 10 保留为适配层升级候选。
- Vidstack/Plyr 只用于存量项目迁移参考，不进入首版依赖。
- 实施记录见 [自主媒体空间实施落地说明](./YYC3-项目实施-自主媒体空间落地说明.md)。

### 1.3 总体判断

本地 monorepo 最适合作为“内部组件供应库”和交互蓝本；外部成熟组件负责通用播放、流媒体和布局底座；Navidrome、Mastodon、PeerTube 等大型项目用于完整产品 UX、API 和宿主集成参考，不直接复制进当前前端。

## 二、本地 monorepo 组件包盘点

本地根路径：

`/Users/yanyu/Downloads/YYC3-Music/yyc3-music-monorepo`

### 2.1 Workspace 全景

| Workspace / 包                       | 完整度                            | 定位与处理建议                                                                   |
| ------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------- |
| `apps/yyc3-music` / `@yyc3/d-music`  | 应用源码、dist、少量 smoke 测试   | 抽取 PlaylistPanel、Starfield、OfflineIndicator 等；App.tsx 业务耦合，不整体复用 |
| `apps/m98-web` / `@yyc3/m98-web`     | React/CRA 源码和构建              | 参考资源映射与动效；旧 CRA/动画栈不新增引入                                      |
| `apps/m98-admin` / `@yyc3/m98-admin` | Vue 后台源码                      | 仅参考后台布局与 HTTP 分层                                                       |
| `packages/music-design-tokens`       | 源码、dist、主题测试              | P0：颜色、排版、间距、圆角、阴影、动画、断点、层级和主题                         |
| `packages/music-ui`                  | 约 48 个基础组件源码、dist        | P0：精选 DPanel、Resizable、ImageWithFallback 和 Radix 基件                      |
| `packages/music-hooks`               | 源码、dist，测试有限              | P1：参考 useAudioEngine、useHaptics、useVirtualList；PWA 重写                    |
| `packages/music-player`              | 播放器 UI 源码、dist              | P1：PlayerControls、MobilePlayer、MediaDisplay、AudioVisualizer                  |
| `packages/music-lyrics`              | 源码、dist                        | P1/P2：歌词和 EmotionRipple；按实际歌词需求引入                                  |
| `packages/music-utils`               | 源码、dist、部分测试              | 仅抽 preferences、crypto、性能工具；禁止整包根导入建立外部服务单例               |
| `packages/music-data`                | 类型、演示数据、测试              | 只抽通用媒体类型；不引入全部商业、AI、社区模型                                   |
| `packages/music-community`           | 社交组件源码、dist                | P2/P3：CommunityFeed、评论、分享、上传 UI；API 必须适配器化                      |
| `packages/music-testing`             | 自研测试工具、部分 Vitest         | 当前项目优先采用标准 Vitest/Playwright，不迁移 legacy                            |
| `packages/music-audio`               | 混合源码、dist，无测试            | 暂缓：公开导出失效、依赖混杂，修复后再评估 Web Audio 工具                        |
| `packages/music-emotion`             | 源码、dist、少量测试              | 仅映射工具可复用；角色和 voice 默认导出存在入口问题                              |
| `packages/music-voice`               | 语音引擎和 UI 源码                | P3：浏览器差异、权限和测试验证后再考虑                                           |
| `packages/music-ai`                  | AI 创作组件源码                   | 非 Gallery 核心，按需独立页面使用                                                |
| `packages/music-commerce`            | 商城、版权组件源码                | 业务耦合，暂不进入底座                                                           |
| `packages/music-growth`              | 成就、榜单、商城组件源码          | 业务耦合，仅可抽展示卡片                                                         |
| `packages/music-server`              | Deno/Hono/Supabase 源码，无 dist  | 仅参考 schema；上传鉴权与分片会话不可原样上线                                    |
| `packages/m98-server`                | Express/PostgreSQL 源码和少量测试 | 仅参考 repository 分层，不复用艺人/粉丝业务 API                                  |

### 2.2 优先可复用项与目标映射

| 优先级 | 本地源码路径                                                   | 可用项                                       | 推荐理由                                 | 接入前改造                                                            |
| ------ | -------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| P0     | `packages/music-design-tokens/src`                             | 主题、Token、断点、Z_INDEX、WCAG             | 与“宁静致远/活力空间”及统一层级直接匹配  | 改为 Gallery 命名空间；支持容器级主题和 SSR guard                     |
| P0     | `packages/music-ui/src/dmusic/DPanel.tsx`                      | 通用面板                                     | 可作为播放器和 Widget 容器蓝本           | 解除音乐业务命名，统一主题变量                                        |
| P0     | `packages/music-ui/src/ui/resizable.tsx`                       | ResizablePanelGroup/Panel/Handle             | 适合统一界面的停靠分栏                   | 与当前项目已有实现去重，自由浮窗仍需另建                              |
| P0     | `packages/music-ui/src/figma/ImageWithFallback.tsx`            | 图片回退                                     | 背景、封面和海报共用容错                 | 核验公共导出后迁移，统一错误与加载状态                                |
| P1     | `packages/music-player/src/components/AudioVisualizer.tsx`     | circular/bars Canvas 频谱                    | 依赖较少，最适合独立实例视听增强         | 每实例独立生命周期；后台暂停；reduced-motion                          |
| P1     | `packages/music-player/src/components/PlayerControls.tsx`      | 受控播放、进度、音量、上下曲 UI              | 外部 props 控制，适合对接新媒体会话      | 移除点赞、情绪、AI、榜单等专有 props，公开类型                        |
| P1     | `packages/music-player/src/components/MobilePlayer.tsx`        | 移动全屏、safe-area、歌词与可视化布局        | 可缩短移动端交互设计周期                 | 与新手势、媒体会话和 Video.js 10 对接                                 |
| P1     | `packages/music-hooks/src/useAudioEngine.ts`                   | 播放、seek、音量、Analyser、Gain、Compressor | 可作为音频运行时和频谱参考               | 不直接照搬；补 error/buffering/muted/rate，高频帧数据移出 React state |
| P1     | `apps/yyc3-music/src/app/components/PlaylistPanel.tsx`         | 受控队列、文件/URL 添加、增量列表            | 可复用面板交互思路                       | 队列状态迁入独立 store；补 Blob URL 回收                              |
| P1     | `packages/music-lyrics/src/components/EmotionRipple.tsx`       | 音频能量波纹、低频节拍、ResizeObserver       | 适合“活力空间”专有动效                   | 情绪模型改为通用 palette；增加性能和动效开关                          |
| P1     | `apps/yyc3-music/src/app/components/Starfield.tsx`             | 音频驱动星空                                 | 可作为沉浸背景预设                       | 手动抽包；后台暂停；不进入默认宁静预设                                |
| P2     | `packages/music-community/src/components/CommunityFeed.tsx`    | 受控社区信息流、刷新、加载状态               | 社区包中最易复用的展示组件               | 数据源由宿主 repository 注入，补审核和隐私边界                        |
| P2     | `packages/music-community/src/components/TimelineComments.tsx` | 时间锚点评论/弹幕车道算法                    | 对综艺、MV 和播客互动有参考价值          | 算法抽纯函数；移除固定 API；明确内容审核                              |
| P2     | `packages/music-community/src/components/UploadPanel.tsx`      | 批量上传、元数据、封面、进度 UI              | 上传队列交互完整                         | 拆成 Dropzone/Queue/Form/Adapter；后端不复用                          |
| P2     | `apps/m98-web/src/config/assets.js`                            | ASSETS、resolveCover、resolvePoster          | “清单 + 解析器 + 映射”适合背景和封面上传 | 不复制艺人品牌内容；改为 assetId 和宿主资源仓库                       |
| P2     | `packages/music-hooks/src/useHaptics.ts`                       | 移动端振动与节流                             | 小型、明确的移动增强能力                 | 特性检测、用户开关、无支持时静默无操作                                |
| P2     | `packages/music-hooks/src/useVirtualList.ts`                   | IntersectionObserver 增量渲染                | 长歌单可按需参考                         | 它不是真虚拟列表；大数据量改用成熟虚拟化方案                          |

### 2.3 明确缺口和禁止直接复用项

- 本地仓库没有 HLS.js、M3U8、MSE 分片、DASH 或 Shaka 适配层。
- 没有独立队列包；随机、循环和当前曲目仍位于应用 `App.tsx`，应新建 queue reducer/store。
- 没有 dnd kit、React Grid Layout 或真正的歌单拖拽排序；文件拖放不等于布局系统。
- `MediaDisplay` 中独立视频元素不能与音频引擎共用时钟，不可作为统一音视频核心。
- `usePWA` 使用动态 Blob manifest/Service Worker、固定 D-Music 标识且 SSR 不友好，应重写，不迁移。
- `useSwipeGesture` 绑定 document，多实例会互相干扰，应改为元素级 handlers/ref。
- 上传服务信任客户端 userId、存在匿名上传和进程内分片会话，禁止原样用于生产。
- `music-audio`、`music-emotion` 的默认导出与 `export *` 入口不匹配，修复并测试前不得依赖。
- 本地包多采用 React 18 生态，而当前项目为 React 19/Next.js 16，必须做 peer dependency 和运行时验证。

### 2.4 本地许可证门禁

本地 16 个 `@yyc3/music-*` manifest 声明 MIT，但未找到根级或包级正式 LICENSE 文件；三个 apps 与 `m98-server` 为 private 且未统一声明许可证。

跨仓库复制或发布前必须：

1. 补齐正式 LICENSE、版权持有人和复制来源记录。
2. 保留第三方依赖许可证与 NOTICE。
3. 单独确认歌曲、MV、艺人照片、品牌图、字体和音效授权；代码许可证不自动覆盖媒体资产。
4. 对复制代码建立来源 commit、修改记录和再分发检查。

## 三、外部完整源码组件包：播放与 UI/UX

以下均为官方上游路径。包安装是获取组件的推荐方式；只有需要阅读、修改或审计源码时才 clone 整个仓库。

### 3.1 播放器、流媒体与音频

| 项目          | 拉取或下载路径                                                                                                              | 功能定位                                              | 推荐理由与接入边界                                                                            | 许可证       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------ |
| Video.js 10   | 源码：`git clone https://github.com/videojs/video.js.git`；React：`pnpm add @videojs/react`；HTML：`pnpm add @videojs/html` | 模块化、可组合的 Web/React 音视频播放器框架           | 当前上游主方向，适合作为默认播放器；HLS/DASH 等播放集成按独立适配包核验，不能套用 v8 插件方式 | Apache-2.0   |
| Media Chrome  | `git clone https://github.com/muxinc/media-chrome.git`；`pnpm add media-chrome`；React 入口 `media-chrome/react`            | 播放、进度、音量、字幕等可组合 Web Components 控制 UI | UI 与播放引擎分离，适合专有皮肤和多形态；不要与另一套完整控制栏重复叠加                       | MIT          |
| ArtPlayer     | `git clone https://github.com/zhw2590582/ArtPlayer.git`；`pnpm add artplayer`                                               | 功能完整的 HTML5 视频播放器                           | 控制、图层、设置、字幕和第三方流适配丰富，适合作为备选视频形态；需验证多实例资源释放          | MIT          |
| XGPlayer      | `git clone https://github.com/bytedance/xgplayer.git`；核心 `pnpm add xgplayer`，插件按需                                   | 插件化视频播放器与移动 Web 播放                       | 对视频、清晰度、弹幕和移动端交互有参考价值；不与默认播放器同时全量打包                        | MIT          |
| hls.js        | `git clone https://github.com/video-dev/hls.js.git`；`pnpm add hls.js`                                                      | 基于 MSE 的浏览器 HLS 播放                            | 活跃、聚焦 HLS，适合非原生 HLS 环境；Safari 优先原生 HLS，动态导入                            | Apache-2.0   |
| Shaka Player  | `git clone https://github.com/shaka-project/shaka-player.git`；`pnpm add shaka-player`                                      | DASH/HLS、MSE/EME 播放库                              | 适合后续 DASH、DRM 和复杂流媒体；首版无需求时不引入                                           | Apache-2.0   |
| wavesurfer.js | `git clone https://github.com/katspaugh/wavesurfer.js.git`；`pnpm add wavesurfer.js`                                        | 交互波形、音频播放与插件生态                          | 适合波形 seek、音频剪辑和音乐可视化；必须接入统一 session，避免双引擎同时播放                 | BSD-3-Clause |
| howler.js     | `git clone https://github.com/goldfire/howler.js.git`；`pnpm add howler`                                                    | Web Audio/HTML5 Audio 音频库                          | 可用于 UI 音效和简单多音频；与主媒体运行时职责重叠，默认不引入，确有音效需求再选              | MIT          |

### 3.2 全局 UI、布局与动效

| 项目              | 拉取或下载路径                                                                                                      | 功能定位                                 | 推荐理由与接入边界                                                                     | 许可证 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| React Grid Layout | `git clone https://github.com/react-grid-layout/react-grid-layout.git`；`pnpm add react-grid-layout`                | 可拖拽、缩放、响应式断点和碰撞的受控网格 | 与 Widget 布局需求高度匹配；v2 自带类型并改善 tree-shaking，直接用 v2，不从旧 API 起步 | MIT    |
| dnd kit           | `git clone https://github.com/clauderic/dnd-kit.git`；`pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` | 模块化拖拽、排序、触摸与键盘交互         | 适合歌单排序和组件目录拖入；与 RGL 分工，不重复承担网格缩放                            | MIT    |
| Motion            | `git clone https://github.com/motiondivision/motion.git`；`pnpm add motion`                                         | React/JS 动画与手势                      | 适合合并、拆分、迷你化和空间过渡；只包装布局状态，不触发动机重建，支持减少动态效果     | MIT    |
| shadcn/ui         | `git clone https://github.com/shadcn-ui/ui.git`；按需使用 `pnpm dlx shadcn@latest add <component>`                  | 可复制、可修改的源码组件分发体系         | 源码进入项目、便于专有化；当前已有同风格 UI，优先复用现有文件而非全量生成              | MIT    |
| Radix Primitives  | `git clone https://github.com/radix-ui/primitives.git`；按需 `pnpm add @radix-ui/react-*`                           | 无障碍、低样式 UI 原语                   | 当前项目已有大量 Radix 依赖，继续按需复用 Dialog/Slider/Tabs 等，避免重复 UI 体系      | MIT    |

## 四、完整开源项目：音乐、社交、媒体、视频与综艺

这些项目适合用于完整 UX、API、内容模型和宿主服务参考。除非明确决定部署对应服务，否则不作为浏览器依赖安装。

| 维度 / 项目               | 官方源码与下载路径                                                                                             | 功能定位                                                       | 推荐理由                                                              | 许可证与边界                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| 音乐服务 / Navidrome      | `git clone https://github.com/navidrome/navidrome.git`；发布包走官方 Releases                                  | 自托管个人音乐流服务、Web UI、Subsonic 兼容生态                | 可参考音乐库、搜索、歌单、转码及多客户端；未来可作为宿主音乐服务候选  | GPL-3.0；不以复制源码方式进入当前 MIT 前端            |
| 桌面音乐 / Nuclear        | `git clone https://github.com/nukeop/nuclear.git`                                                              | 跨平台桌面音乐、搜索、专辑/艺人、歌单、歌词、统计和主题        | 完整播放器信息架构与桌面 UX 参考，适合研究搜索到播放闭环              | AGPL-3.0；在线源使用还须遵守内容来源规则              |
| 音乐社交 / Funkwhale      | `git clone https://dev.funkwhale.audio/funkwhale/funkwhale.git`                                                | 音乐、播客、分享、发布和联邦社交                               | 同时覆盖音乐库、内容发布、关注和分享，贴合音乐社交参考                | AGPL-3.0；优先 API/UX 参考，复制代码须履行强 copyleft |
| 社交 / Mastodon           | `git clone https://github.com/mastodon/mastodon.git`                                                           | 自托管微博、关注、信息流、审核、ActivityPub                    | 成熟的社交动态、通知、审核和联邦交互参考                              | AGPL-3.0；不建议为简单评论功能部署整套平台            |
| 社交与组件页 / Misskey    | `git clone https://github.com/misskey-dev/misskey.git`                                                         | 联邦社交、反应、云盘、可定制页面与组件体验                     | 可研究信息流、反应、个人空间与丰富组件组合                            | AGPL-3.0；仅作产品/架构参考，避免过度引入社交复杂度   |
| 视频社区 / PeerTube       | `git clone https://github.com/Chocobozzz/PeerTube.git`                                                         | 视频发布、播放列表、直播、联邦分享与 P2P 分发                  | 覆盖视频上传、转码、节目页、评论和观看闭环，适合视频/综艺内容平台参考 | AGPL-3.0；部署成本高，先验证是否需要独立视频社区      |
| 媒体库 / Jellyfin + Web   | `git clone https://github.com/jellyfin/jellyfin.git`；`git clone https://github.com/jellyfin/jellyfin-web.git` | 自托管电影、剧集、音乐、图片、转码及官方 Web 客户端            | 剧集/节目分季分集、媒体详情、续播和多端客户端具有直接参考价值         | GPL-2.0；可作为独立宿主服务候选，不直接复制 UI 源码   |
| 视频与节目 CMS / MediaCMS | `git clone https://github.com/mediacms-io/mediacms.git`                                                        | Django + React 媒体门户、分类、标签、播放列表、分享和 REST API | 对综艺栏目、专题、音视频混合内容和发布工作流适配度高                  | AGPL-3.0；优先参考内容模型与 API                      |
| 直播互动 / Owncast        | `git clone https://github.com/owncast/owncast.git`                                                             | 自托管直播与内置聊天                                           | 适合综艺直播、活动空间和聊天互动参考，内容所有权清晰                  | MIT；仍需独立评估聊天审核、限流和滥用治理             |

### 4.1 大型项目的推荐使用方式

1. **仅研究 UX**：阅读页面结构、状态反馈、空态、错误态、移动适配和键盘操作，不复制品牌或资产。
2. **宿主服务集成**：如确需媒体库，优先通过宿主适配器连接 Navidrome/Jellyfin 等独立服务，而非将其代码嵌入前端。
3. **源码复制**：必须单独进行 copyleft 合规评审；AGPL/GPL 项目默认不复制到当前前端。
4. **内容来源**：开源代码不代表其中的音乐、视频、图片、字体或第三方 API 内容可自由使用。

## 五、不建议新增引入或需谨慎的候选

| 候选                             | 当前判断           | 原因                                                                        |
| -------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| Vidstack                         | 存量迁移参考       | 官方已进入 security-only maintenance，团队转向 Video.js 10                  |
| Plyr                             | 不作为新项目首选   | 上游方向已转向 Video.js 10；新增项目无需再建立旧依赖                        |
| react-beautiful-dnd              | 不采用             | 旧拖拽方案不再作为新布局基线；新需求使用 dnd kit/RGL                        |
| 各类 Spotify/网易云/视频站仿制品 | 默认不采用         | 常见问题是缺少后端、测试、维护、授权或仅有演示 UI；除非逐仓库通过完整度审查 |
| Remotion                         | 与当前需求分离评估 | 适合程序化视频生成而非通用播放器；采用前单独核验其当前许可证和商业使用条款  |
| 本地 `music-audio` 整包          | 暂缓               | 公共导出失效、依赖混杂、无有效测试                                          |
| 本地 `usePWA`                    | 不复用实现         | Blob Service Worker、硬编码、SSR 和可访问性问题                             |
| 本地上传后端                     | 不复用实现         | 鉴权、所有权、分片持久化和多实例可靠性不满足生产要求                        |

## 六、目标依赖关系与去重原则

### 6.1 播放器组合只选一条主路径

- **路径 A（默认）**：Video.js 10 + 原生媒体会话 + 按需流媒体适配。
- **路径 B（高度定制 UI）**：原生 HTMLMediaElement/hls.js + Media Chrome + 自有 PlayerEngineAdapter。
- ArtPlayer/XGPlayer 是备选引擎，不与 A/B 同时全量引入。
- wavesurfer.js 只在需要波形时加载，并复用统一会话时钟。
- howler.js 只考虑 UI 音效，不成为视频或主音乐播放的第二套全局控制器。

### 6.2 布局与 UI 分工

- React Grid Layout：停靠网格、响应式布局、碰撞、拖拽缩放。
- dnd kit：播放列表和目录排序、跨容器拖放。
- 自有 Pointer WindowManager：自由浮窗、层级、合并分组和浏览器 Popup。
- Radix/shadcn：Dialog、Sheet、Slider、Tabs 等交互原语。
- 本地 design tokens：统一颜色、间距、动效、层级和空间主题。
- Motion：只负责视觉过渡，不拥有业务状态。

## 七、项目规划落地闭环

### 阶段 M0：治理与概念验证

**输入**：本文、总体设计、本地源码和候选依赖。  
**工作**：

1. 建立第三方组件台账：上游 URL、tag/commit、许可证、NOTICE、用途、修改记录。
2. 补齐本地源码许可证与媒体资产授权清单。
3. 建立 Video.js 10 + React 19 + Next.js 16 的最小 POC。
4. 验证两个视频实例与一个音频实例的播放、音量、进度、销毁和后台行为。
5. 比较默认 Video.js 10 与 Media Chrome 定制路径，只保留一条主路径。

**交付物**：选型 ADR、POC、包体报告、许可证清单、风险清单。  
**通过门禁**：无双播放时钟；实例销毁无泄漏；无自动播放违规；明确默认引擎。  
**回退**：保留原生 HTMLMediaElement 播放路径，外部引擎可移除。

### 阶段 M1：统一媒体核心与本地模块迁移

**工作**：

1. 新建 `MediaSessionManager`、queue reducer/store、SourceAdapter 和 EngineAdapter。
2. 将音量、进度、循环、随机、倍速、错误和缓冲状态按 sessionId 隔离。
3. 抽取本地 PlayerControls/MobilePlayer 的受控 UI，移除业务专有依赖。
4. 接入 AudioVisualizer，按需改造 EmotionRipple/Starfield。
5. 建立 Blob URL 引用计数、资源回收和错误恢复。
6. 按需加入 hls.js；无 DASH/DRM 需求时不加入 Shaka。

**交付物**：播放核心、播放器形态、单元/集成测试、性能基线。  
**通过门禁**：多开互不干扰；音频视频独立音量；切歌和销毁无 Blob/AudioContext 泄漏；高频频谱不驱动整树重渲染。

### 阶段 M2：拆分合并与自主组件空间

**工作**：

1. 完成视图与媒体运行时分离，拆分合并不重建媒体元素。
2. 使用 RGL v2 实现停靠网格，使用 dnd kit 实现列表排序。
3. 实现自由浮窗、分组、撤销、冲突处理、按设备布局。
4. 接入本地 DPanel、主题 Token 和精选 UI，完成容器级主题。
5. 实现时钟、日历、天气、笔记、音乐和视频组件注册表。
6. 实现圆形、圆角方形、横/竖胶囊迷你形态。
7. 复用上传入口和 M98 资源映射模式，建立统一 AssetRepository。

**交付物**：工作区、组件目录、布局持久化、背景上传、可访问性测试。  
**通过门禁**：播放中拆分合并无进度回退；横竖屏无拉伸裁切；布局冲突不静默覆盖；reduced-motion 生效。

### 阶段 M3：宿主机、PWA 与移动端

**工作**：

1. 建立 HostBridge 能力协商、文档、Blob、网络白名单、同步和健康检查。
2. 宿主实现 SQLite 元数据、文件存储、Range/206、版本冲突和 Tombstone。
3. 客户端只保留离线缓存与持久化 outbox，断网不静默丢失操作。
4. 修复当前 PWA 注册、图标、预缓存、路由匹配和离线页；加入显式媒体离线下载。
5. 移动端采用底部抽屉、safe-area、元素级手势和严格多视频解码预算。
6. 上传后端重新实现鉴权、所有权、持久化分片、配额和幂等，不迁移本地旧服务。

**交付物**：宿主服务、三端适配、离线/恢复测试、发布与回滚手册。  
**通过门禁**：宿主离线可读缓存、写操作可恢复；Range 与离线媒体正确；升级不中断播放；Schema 可迁移可回滚。

### 阶段 M4：社交、综艺与媒体服务可选扩展

**触发条件**：核心播放器和工作区已稳定，且存在明确用户需求。  
**工作**：

1. 从本地 CommunityFeed/TimelineComments 抽取受控展示与纯算法。
2. 设计评论审核、举报、限流、权限和隐私策略。
3. 需要节目库时评估 MediaCMS/Jellyfin/Navidrome 独立宿主集成。
4. 需要视频社区时评估 PeerTube；需要直播聊天时评估 Owncast。
5. 不为简单评论、歌单或单一直播间直接部署完整联邦社交平台。

**交付物**：独立服务 ADR、API 适配器、内容治理方案、成本评估。  
**通过门禁**：业务收益明确、许可证合规、宿主资源与运维成本可接受。

## 八、测试、发布与运营闭环

### 8.1 测试矩阵

- 单元：queue、session reducer、布局冲突、资源映射、同步冲突。
- 组件：独立音量、进度、迷你形状、错误态、空态、键盘操作。
- 集成：多开、拆分合并、横竖屏、上传、后台恢复、宿主离线。
- E2E：Web/PWA/移动视口、歌单排序、布局保存、离线启动和恢复同步。
- 性能：多视频解码、Canvas 帧率、长歌单、内存、Blob URL、包体和按需加载。
- 安全：宿主鉴权、上传所有权、网络白名单、SSRF、令牌、配额和内容审核。
- 合规：许可证、NOTICE、SBOM、媒体资产授权、品牌隔离。

### 8.2 发布与回滚

1. 所有外部依赖固定版本并保留 lockfile；源码 fork 固定上游 commit。
2. 建立功能开关：播放器引擎、流媒体、动效、社交和宿主服务均可独立关闭。
3. Web/PWA 原子发布；Service Worker 不在播放中强制更新。
4. 宿主 API 保持 N/N-1 兼容；数据库迁移前备份并验证回滚。
5. 出现播放故障时回退原生引擎；布局故障时回退只读堆叠布局；宿主故障时进入离线缓存与 outbox。
6. 每次发布复查弃用通知、安全公告、许可证和包体变化，形成下一轮调研输入。

## 九、最终推荐清单

### 立即进入 POC

- Video.js 10 / `@videojs/react`
- React Grid Layout v2
- dnd kit
- 本地 `music-design-tokens`
- 本地 `AudioVisualizer`
- 本地受控 `PlayerControls` / `MobilePlayer`

### 按需进入

- Media Chrome：选择完全自定义控制 UI 路径时。
- hls.js：存在非原生 HLS 源时。
- Shaka Player：存在 DASH/DRM 需求时。
- wavesurfer.js：需要交互波形时。
- Motion：CSS 无法满足复杂空间过渡时。
- EmotionRipple/Starfield：启用“活力空间”视听预设时。

### 仅作完整产品或宿主服务参考

- Navidrome、Nuclear、Funkwhale
- Mastodon、Misskey
- PeerTube、Jellyfin、MediaCMS、Owncast

### 暂不采用

- Vidstack/Plyr 新项目依赖
- 本地 `music-audio` 整包、`usePWA`、旧上传后端
- 未经验证的仿站播放器和无完整源码/许可证的组件合集

---

**最后更新**: 2026-11-18  
**维护者**: YYC³ Team

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
