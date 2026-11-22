---
title: YYC³ 开源组件库复用对照矩阵
description: 10 个本地完整开源仓库的功能、模块、许可证、复用方式、风险与适配优先级矩阵
author: YYC³ Team
version: 1.0.0
status: 盘点完成 · 待架构与合规确认
created: 2026-11-19
updated: 2026-11-19
---

# YYC³ 开源组件库复用对照矩阵

## 📋 文档说明

本文承接以下规划基线：

- [YYC³ 可拆分音视频与自主组件空间设计](./YYC3-项目规划-可拆分音视频与自主组件空间设计.md)
- [YYC³ 开源影音组件检索与项目规划落地闭环](./YYC3-项目规划-开源影音组件检索与落地闭环.md)

分析对象为本地组件库中的 10 个完整开源仓库，输出逐仓库的：

1. 功能定位与关键模块；
2. 许可证与版本快照；
3. API、SDK 和数据模型入口；
4. 面向 `YYC3-Infinite-Gallery` 的复用方式；
5. 技术、许可证、运维和内容资产风险；
6. 适配优先级与落地顺序。

## 一、口径与快照

本地仓库根路径统一记为：

`ROOT=/Users/yanyu/YYC-Cube/personal/YYC3-Infinite-Gallery/docs/YYC3-MusAI-开源组件库`

检查日期：2026-11-19。全部分析为静态只读检查，未修改仓库，未运行其完整构建或测试。

| 仓库         | 本地版本 / commit               | 工作区状态                                                  | 许可证证据                                                    |
| ------------ | ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| PeerTube     | `9.0.0-rc.1`；无 `.git`         | 源码快照，无法定位 commit                                   | `ROOT/PeerTube/LICENSE`：AGPL-3.0                             |
| Funkwhale    | `2.0.14-5-gd9555aaa4`           | 干净                                                        | `ROOT/funkwhale/LICENSE`：AGPL-3.0                            |
| Jellyfin     | `07bcec2`                       | 干净                                                        | `ROOT/jellyfin/LICENSE`：GPL-2.0                              |
| jellyfin-web | `v12.0-rc7-597-gab03ade0d9`     | 干净                                                        | `ROOT/jellyfin-web/LICENSE`、`package.json`：GPL-2.0-or-later |
| Mastodon     | `fef433b`                       | 干净                                                        | `ROOT/mastodon/LICENSE`、`package.json`：AGPL-3.0-or-later    |
| MediaCMS     | 无 `.git`                       | 源码快照，无法定位 commit                                   | `ROOT/mediacms/LICENSE.txt`：AGPL-3.0                         |
| Misskey      | `2026.11.1-alpha.1` / `568cb40` | 干净                                                        | `ROOT/misskey/LICENSE`、`COPYING`：AGPL-3.0，部分组件 MIT     |
| Navidrome    | `a40f7b8-dirty`                 | 一条删除的测试夹具变更：`tests/fixtures/._02 Invisible.mp3` | `ROOT/navidrome/LICENSE`：GPL-3.0                             |
| Nuclear      | `player@1.56.0` / `1bb2d5bf0`   | 干净                                                        | `ROOT/nuclear/LICENSE`、`package.json`：AGPL-3.0-only         |
| Owncast      | `b2c4e69`                       | 干净                                                        | `ROOT/owncast/LICENSE`、`web/LICENSE`：MIT                    |

版本说明：

- 无 `.git` 的快照无法用 commit 复核来源，正式引入前必须从官方上游重新拉取并固定 tag/commit。
- Navidrome 本地快照存在未提交删除，不能作为完整上游快照直接归档；引入前应重新拉取干净副本并记录哈希。
- “许可证证据”是源码根目录层面结论，第三方依赖、字体、图片、音视频内容仍需单独审计。

### 优先级定义

| 级别 | 含义                                                       |
| ---- | ---------------------------------------------------------- |
| P0   | 许可证友好、技术栈接近，可立即进入组件移植或服务集成验证   |
| P1   | 价值明确，但需宿主服务集成、UI 重写或一定架构适配          |
| P2   | 选择性强复用：仅借播放器、UX 模式或 API 契约，不作整体移植 |
| P3   | 仅在明确需求下作为协议或产品参考，默认不引入               |

## 二、总览对照矩阵

| 仓库            | 功能定位                 | 关键可复用模块                                                      | 许可证             | 推荐复用方式                                   | 主要风险                                          | 优先级 |
| --------------- | ------------------------ | ------------------------------------------------------------------- | ------------------ | ---------------------------------------------- | ------------------------------------------------- | ------ |
| Owncast         | 自托管直播 + 实时聊天    | 直播播放器、聊天组件树、HLS/RTMP、WebSocket、嵌入页                 | MIT                | 前端组件有条件直接移植；宿主整体部署           | 单主播模型；RTMP/转码运维；第三方许可和审核       | **P0** |
| Navidrome       | 自托管音乐库与流媒体     | 音乐扫描、元数据、转码、Range、Subsonic/OpenAPI、音频播放器 UI      | GPL-3.0            | 作为独立宿主音乐服务；UI 只借鉴后重写          | UI 栈代差；GPL 源码复制风险；媒体版权             | **P1** |
| Mastodon        | 联邦社交时间线与通知     | React 19 通用组件、dnd-kit 排序、信息流、通知、撰写、REST/Streaming | AGPL-3.0-or-later  | 借鉴 React 组件与拖拽 UX；API 契约参考         | AGPL；Redux/router 耦合；后端过重                 | **P1** |
| PeerTube        | 联邦 P2P 视频平台        | 框架无关播放器壳、控制栏、节目页、评论、OpenAPI、转码与 S3          | AGPL-3.0           | 借鉴 standalone player；可选 iframe/embed      | Angular 主体不可直接复用；AGPL；P2P 网络不稳      | **P2** |
| jellyfin-web    | Jellyfin 官方 Web 客户端 | 播放器插件、字幕/libass、队列、媒体卡片、搜索筛选、上传             | GPL-2.0-or-later   | 仅做播放器/媒体 UX 设计参考或 API SDK 集成     | GPL；巨型单例；Jellyfin 服务强绑定；旧依赖        | **P2** |
| Jellyfin Server | 自托管综合媒体服务器     | 库扫描、Providers、动态转码、Range、权限、WebSocket、SyncPlay       | GPL-2.0            | 仅通过 HTTP API/SDK 作为可选宿主媒体后端       | .NET/ffmpeg 运维；API 面大；GPL；无社交流         | **P2** |
| MediaCMS        | 视频与媒体 CMS           | React 19 媒体列表、评论、筛选、Video.js 封装、DRF OpenAPI、上传转码 | AGPL-3.0           | 借 React 19 组件结构；对接 OpenAPI；可隔离部署 | AGPL；全局 store 耦合；Django/Celery/Redis 多服务 | **P2** |
| Misskey         | 高度可定制联邦社交       | Deck/Widget 体系、反应系统、Drive、misskey-js SDK、Dashboard UX     | AGPL-3.0，部分 MIT | 借小组件与反应 UX；可引入 misskey-js           | Vue→React 重写；alpha 版本；AGPL                  | **P2** |
| Nuclear         | Tauri 桌面音乐播放器     | `hifi` 音频图、PlayerBar、可排序队列、插件 SDK、主题系统            | AGPL-3.0-only      | 借音频控制、队列状态机和插件接口模式           | AGPL；Tauri 强耦合；无视频/字幕/上传              | **P2** |
| Funkwhale       | 联邦音乐与播客平台       | 队列/嵌入播放器、ActivityPub、MusicBrainz 元数据、许可管理、OpenAPI | AGPL-3.0           | 仅作联邦音乐/许可协议参考或隔离服务            | AGPL 网络开源义务；多服务栈；Vue 不兼容           | **P3** |

## 三、逐仓库详细说明

### 3.1 Owncast — 自托管直播与聊天

| 项目           | 结论                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 单主播直播服务器，兼容 OBS/Streamlabs RTMP 推流，内置 HLS 播放、实时聊天、审核、Webhook 和联邦能力。                                                                                                                                          |
| 技术栈         | Go 1.24+；前端 Next.js 16、React 18、Ant Design 6、Jotai、XState、Video.js、Storybook。                                                                                                                                                       |
| 关键前端模块   | `ROOT/owncast/web/components/video/OwncastPlayer/`、`ROOT/owncast/web/components/video/VideoJS/`、`ROOT/owncast/web/components/chat/`、`ROOT/owncast/web/components/modals/`、`ROOT/owncast/web/pages/embed/`、`ROOT/owncast/web/services/`。 |
| 关键宿主模块   | `ROOT/owncast/services/rtmp/`、`services/transcoder/`、`services/chat/`、`services/webhooks/`、`services/activitypub/`、`ROOT/owncast/webserver/handlers/hls.go`、`ROOT/owncast/openapi.yaml`。                                               |
| API / 数据入口 | OpenAPI 3.1 位于 `ROOT/owncast/openapi.yaml`；前端服务层含 `chat-service.ts`、`websocket-service.ts`、`status-service.ts`、`moderation-service.ts`。                                                                                          |
| 复用方式       | 将 `web/components/video/` 和 `web/components/chat/` 作为首批组件移植对象；把 WebSocket 断线重连模型映射到 YYC³ 宿主通知协议；宿主机独立部署 Go 服务，仅反向代理 HLS/API/WS。                                                                 |
| 技术风险       | React 18→19、Ant Design→Radix/Tailwind、Jotai/XState→YYC³ 状态层需要适配；单主播模型不适合多租户；Admin API 为 BasicAuth，禁止公网直达。                                                                                                      |
| 合规风险       | 项目本身 MIT，但 `ROOT/owncast/THIRD-PARTY-LICENSES.txt` 较大，字体、图标和媒体内容需单独审计。                                                                                                                                               |
| 适配优先级     | **P0**。许可证最宽松、Next 16 与当前静态导出配置最接近、直播和聊天链路完整。                                                                                                                                                                  |

### 3.2 Navidrome — 自托管音乐库

| 项目           | 结论                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 功能定位       | 面向个人音乐收藏的流媒体服务，提供媒体扫描、元数据、歌词、歌单、多用户、转码及 Subsonic 客户端兼容。                                                                                       |
| 技术栈         | Go 后端；Vite + React 17 + MUI 4 + react-admin 3 + Redux Saga + Workbox PWA。                                                                                                              |
| 关键前端模块   | `ROOT/navidrome/ui/src/audioplayer/Player.jsx`、`PlayerToolbar.jsx`、`SongDatagrid.jsx`、`SongSimpleList.jsx`、`Artwork.jsx`、`useScrollRestoration.jsx`、`ROOT/navidrome/ui/src/share/`。 |
| 关键宿主模块   | `ROOT/navidrome/scanner/`、`core/stream/media_streamer.go`、`core/auth/`、`core/lyrics/`、`server/subsonic/`、`server/apiv1/`、`persistence/`、`adapters/`。                               |
| 能力证据       | Range/206 使用 `http.ServeContent`，见 `core/stream/media_streamer.go:158-174`；转码见 `server/subsonic/transcode.go:236-374`；扫描见 `scanner/controller.go`、`watcher.go`。              |
| API / 数据入口 | OpenAPI v1：`ROOT/navidrome/api/openapi/openapi.yaml`、`api/bundled/openapi.yaml`；Subsonic API：`ROOT/navidrome/server/subsonic/api.go`。无独立发布版 TS SDK，建议由 OpenAPI 生成。       |
| 复用方式       | 宿主部署官方二进制/容器，YYC³ 经反向代理调用 API；扫描结果映射为 `assetId → 媒体/封面`；前端仅重写播放器控制、歌曲列表和滚动恢复交互。                                                     |
| 技术风险       | React 17/MUI 4/react-admin 与当前 React 19/Radix/Tailwind 差异大；文件权限和路径映射敏感；转码依赖 ffmpeg；上传能力以封面为主，不是通用媒体上传服务。                                      |
| 合规风险       | GPL-3.0。独立进程提供 API 的组合方式可行，但复制源码形成衍生前端会触发 GPL 义务；音乐内容版权不随软件许可证转移。                                                                          |
| 适配优先级     | **P1**。后端能力成熟且运维较轻，适合作为可选宿主音乐服务；UI 仅做设计蓝本。                                                                                                                |

### 3.3 Mastodon — 联邦社交与 React 组件

| 项目           | 结论                                                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | ActivityPub 联邦微博客，涵盖时间线、关注、转发、收藏、投票、通知、审核和媒体附件。                                                                                                                    |
| 技术栈         | 前端 React 19.3.1、Redux Toolkit、react-router 5、Vite、SCSS；后端 Rails；流式服务 Node.js。                                                                                                          |
| 关键前端模块   | `ROOT/mastodon/app/javascript/mastodon/components/`、`features/home_timeline/`、`features/notifications/`、`features/compose/`、`features/search/`、`features/account_timeline/`、`features/video/`。 |
| 拖拽与组件证据 | `ROOT/mastodon/app/javascript/mastodon/components/sortable_list/`、`carousel/index.tsx`；依赖 `@dnd-kit/core` 等。                                                                                    |
| API / 数据入口 | `ROOT/mastodon/app/javascript/mastodon/api.ts`、`api/`、`stream.js`、`api_types/`、`models/`；另有 OAuth2 + REST + Streaming WebSocket 契约。                                                         |
| 复用方式       | 对照 React 19 组件、信息流状态、通知分组、可排序列表和媒体画廊交互，在 YYC³ 中重新实现；参考 REST/Streaming 事件模型设计宿主通知。                                                                    |
| 技术风险       | 组件与 Redux、react-router 5、i18n 深度耦合；复制后需替换状态、路由和 API 层；自建 Rails/Sidekiq/FFmpeg 后端成本高。                                                                                  |
| 合规风险       | AGPL-3.0-or-later；封装代码不能直接复制到 MIT 前端。上游 dnd-kit 为 MIT，但 Mastodon 对其封装不等于 MIT。                                                                                             |
| 适配优先级     | **P1**。React 19 版本最接近，UX 模式和 dnd-kit 排序实现参考价值高；只借鉴、不复制。                                                                                                                   |

### 3.4 PeerTube — 联邦 P2P 视频平台

| 项目           | 结论                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | ActivityPub 联邦视频平台，支持点播、直播、频道、播放列表、字幕、评论、P2P 分发和分布式转码。                                                                                                                                                |
| 技术栈         | Angular 客户端；TypeScript/Express/Sequelize 服务端；独立 Vite 播放器包；pnpm monorepo。                                                                                                                                                    |
| 关键前端模块   | `ROOT/PeerTube/client/src/app/+video-watch/`、`+video-channel/`、`+video-playlist/`、`+my-account/`、`+my-library/`、`shared/shared-share-modal/`。                                                                                         |
| 播放器模块     | `ROOT/PeerTube/client/src/standalone/player/src/peertube-player.ts`、`src/shared/`（control-bar、dock、settings、hotkeys、playlist、resolutions、storyboard、upnext、mobile 等）；`ROOT/PeerTube/client/src/standalone/embed-player-api/`。 |
| 宿主能力       | `ROOT/PeerTube/server/core/helpers/ffmpeg/`、`controllers/api/videos/upload.ts`、`controllers/api/videos/transcoding.ts`、`lib/runners/job-handlers/`、`lib/uploadx-s3-storage.ts`、`lib/storyboard.ts`。                                   |
| API / 数据入口 | OpenAPI：`ROOT/PeerTube/support/doc/api/openapi.yaml`；REST 控制器：`server/core/controllers/api/`；模型：`server/core/models/`；联邦：`server/core/controllers/activitypub/`。                                                             |
| 复用方式       | 精读 standalone player 的控制栏、设置菜单、热键、清晰度、剧情缩略图和多实例组织方式，用 YYC³ 自有引擎重新实现；必要时通过 iframe 接入 embed player。                                                                                        |
| 技术风险       | Angular 主体无法直接移植；P2P/WebTorrent 在受限网络不稳定；播放器依赖 PeerTube API 元数据；完整平台运维较重。                                                                                                                               |
| 合规风险       | AGPL-3.0；播放器源码同样受约束，不应直接复制进 MIT 前端。                                                                                                                                                                                   |
| 适配优先级     | **P2**。播放器壳和节目页 UX 价值高，整体前端移植价值低。                                                                                                                                                                                    |

### 3.5 jellyfin-web — Jellyfin 官方 Web 客户端

| 项目           | 结论                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | Jellyfin 媒体服务器 Web 客户端，覆盖电影、剧集、音乐、直播、播放列表、转码、字幕和同步播放。                                                                                                    |
| 技术栈         | React 18.3、MUI 6.5、Emotion、TanStack Query 5、react-router 6；Vite/Vitest 与 Webpack 构建并存。                                                                                               |
| 播放器模块     | `ROOT/jellyfin-web/src/plugins/htmlVideoPlayer/plugin.js`（HLS、字幕轨、libass、画质与 PiP）、`src/components/playback/playbackmanager.js`、`playerSelectionMenu.js`、`playersettingsmenu.js`。 |
| 进度与队列     | `ROOT/jellyfin-web/src/components/playback/playqueuemanager.js`、`volumeosd.js`、`brightnessosd.js`、`src/components/nowPlayingBar/nowPlayingBar.js`。                                          |
| 媒体页与卡片   | `ROOT/jellyfin-web/src/components/cardbuilder/Card/`、`src/components/itemDetails/`、`src/apps/modern/routes/shows/`、`movies/`、`livetv/`、`src/components/guide/`。                           |
| 搜索与上传     | `ROOT/jellyfin-web/src/apps/legacy/features/search/`、`src/apps/modern/features/libraries/components/filter/`、`src/components/imageUploader/`、`subtitleuploader/`、`lyricsuploader/`。        |
| API / 数据入口 | `ROOT/jellyfin-web/src/apiclient.d.ts`；`src/lib/jellyfin-apiclient/utils/createApiClient.ts`；`@jellyfin/sdk/lib/generated-client` 提供 `BaseItemDto`、`PlaybackInfoResponse` 等类型。         |
| 复用方式       | 以 `next/dynamic({ssr:false})` 思路隔离播放器；仅对照字幕轨、清晰度、队列、卡片和筛选设计后自行实现；数据层可考虑 `@jellyfin/sdk`。                                                             |
| 技术风险       | `playbackmanager.js` 为巨型单例；依赖 Jellyfin 会话和服务器 API；仓库仍有 jQuery、polyfill 等旧依赖；SDK 版本标识不稳定。                                                                       |
| 合规风险       | GPL-2.0-or-later，复制前端组件会触发强 copyleft 风险。                                                                                                                                          |
| 适配优先级     | **P2**。播放控制与字幕设计参考值高，源码移植不推荐。                                                                                                                                            |

### 3.6 Jellyfin Server — 综合媒体服务后端

| 项目           | 结论                                                                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 自托管媒体服务器，管理电影、剧集、音乐、图片、元数据和转码，并提供多端客户端 API。此仓库只包含服务端。                                                                                                               |
| 技术栈         | .NET 10、C#、ASP.NET Core，依赖 ffmpeg/jellyfin-ffmpeg。                                                                                                                                                             |
| 关键宿主模块   | `ROOT/jellyfin/Emby.Server.Implementations/Library/LibraryManager.cs`、`ROOT/jellyfin/MediaBrowser.Providers/`、`ROOT/jellyfin/MediaBrowser.MediaEncoding/Transcoding/`、`ROOT/jellyfin/Jellyfin.Api/Controllers/`。 |
| 能力证据       | Range 处理见 `ROOT/jellyfin/Jellyfin.Api/Helpers/FileStreamResponseHelpers.cs:45-96`；权限见 `Jellyfin.Api/Auth/`、`UserPermissionPolicy/`；实时通知与 SyncPlay 见 `WebSocketManager.cs`、`SyncPlayController.cs`。  |
| API / 数据入口 | Swagger UI：`/api-docs/swagger/index.html`；控制器在 `ROOT/jellyfin/Jellyfin.Api/Controllers/`；DTO 在 `ROOT/jellyfin/Jellyfin.Api/Models/`、`MediaBrowser.Model/Dto/`。                                             |
| 复用方式       | 宿主机部署官方容器/二进制；YYC³ 静态包通过宿主 HTTPS 代理访问 API；以能力协商暴露媒体库和转码能力；不使用其 Web 前端。                                                                                               |
| 技术风险       | .NET 10 和 ffmpeg 运维成本高；设备、会话、权限和数据模型复杂；直播电视不等于聊天服务。                                                                                                                               |
| 合规风险       | GPL-2.0；API 调用与独立服务部署可行，源码合并不可行；内容版权独立处理。                                                                                                                                              |
| 适配优先级     | **P2**。能力最完整，但只在明确需要综合媒体库时作为 API-only 后端。                                                                                                                                                   |

### 3.7 MediaCMS — 视频与媒体 CMS

| 项目           | 结论                                                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 自托管视频/媒体门户，支持上传、转码、HLS、分类标签、搜索、播放列表、评论、点赞、嵌入、LTI/SAML。                                                                                                                             |
| 技术栈         | Django 5.2、DRF、Celery、Redis、Postgres；前端 React 19.3、webpack、Sass、axios。                                                                                                                                            |
| 关键前端模块   | `ROOT/mediacms/frontend/src/static/js/components/VideoJS/VideoJSEmbed.jsx`、`components/media-viewer/`、`item-list/`、`list-item/`、`search-filters/`、`comments/`、`playlist-page/`；页面 `MediaPage.js`、`EmbedPage.tsx`。 |
| 关键宿主模块   | `ROOT/mediacms/files/`、`cms/`、`uploader/`；上传见 `uploader/views.py`、`fineuploader.py`；字幕模型见 `files/models/subtitle.py`。                                                                                          |
| API / 数据入口 | `ROOT/mediacms/files/urls.py:55-112` 提供 media/search/categories/tags/comments/playlists 等 API；`files/serializers.py:11-83` 定义媒体字段；`cms/urls.py:32-34` 提供 Swagger/OpenAPI。                                      |
| 复用方式       | React 19 版本接近，可把媒体卡片、列表、搜索筛选、评论结构作为设计蓝本自行实现；通过 OpenAPI 生成客户端，宿主部署服务。                                                                                                       |
| 技术风险       | 组件读取全局 store 和 `window.MEDIA_DATA`，SSR 不友好；webpack 多入口不是组件包；Django/Celery/Redis/Postgres 运维较重。                                                                                                     |
| 合规风险       | AGPL-3.0；`frontend/package.json` 的 license 字段为空不能视为宽松授权；TinyMCE、gfonts、fine-uploader 等第三方资产需另审。                                                                                                   |
| 适配优先级     | **P2**。适合视频/综艺栏目内容模型与 React 19 UX 对照，不建议复制源码。                                                                                                                                                       |

### 3.8 Misskey — 联邦社交、Deck 与小组件

| 项目           | 结论                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 高度可定制联邦社交平台，突出反应系统、Deck 工作区、Widget、Drive 网盘、页面和插件生态。                                                                                                         |
| 技术栈         | Vue 3 前端；TypeScript/NestJS/TypeORM 后端；独立 `misskey-js` SDK；pnpm monorepo。                                                                                                              |
| 关键前端模块   | `ROOT/misskey/packages/frontend/src/widgets/`（时钟、RSS、备忘录、时间线、通知、幻灯片等 30+ 小组件）、`src/deck.ts`、`src/drag-and-drop.ts`、`components/MkDraggable.vue`、`MkContainer.vue`。 |
| 反应与媒体模块 | `ROOT/misskey/packages/frontend/src/components/MkReactionsViewer.vue`、`MkReactionEffect.vue`、`MkDrive.vue`、`MkMediaImage.vue`、`MkNoteMediaGrid.vue`。                                       |
| API / 数据入口 | SDK：`ROOT/misskey/packages/misskey-js/src/api.ts`、`streaming.ts`、`entities.ts`、`api.types.ts`；后端：`packages/backend/src/server/api/`、`models/`、`openapi/`。                            |
| 复用方式       | 将 Deck/Widget 组织、反应动效、迷你组件形态与拖拽逻辑提炼为产品规格后在 React 19 中实现；`misskey-js` 可在明确接入 Misskey 时作为可选 SDK。                                                     |
| 技术风险       | Vue 3→React 需重写；本地版本为 `2026.11.1-alpha.1`，API 稳定性有限；后端模型数量多。                                                                                                            |
| 合规风险       | AGPL-3.0，部分组件 MIT；不能将主体组件源码直接复制到 MIT 前端。                                                                                                                                 |
| 适配优先级     | **P2**。小组件与反应 UX 与“自主组件空间”高度相关，但只复用设计思想。                                                                                                                            |

### 3.9 Nuclear — Tauri 桌面音乐播放器

| 项目           | 结论                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 跨平台桌面音乐播放器，支持在线音乐搜索、歌单导入导出、历史统计、歌词、主题、插件市场和 MCP 控制。                                                                                                                                                 |
| 技术栈         | pnpm + Turborepo；React 18.3、Vite 8、TanStack Router/Query、Zustand、Tailwind 4、Tauri 2、Rust。                                                                                                                                                 |
| 关键前端模块   | `ROOT/nuclear/packages/ui/src/components/PlayerBar/`、`QueuePanel/`、`Lyrics/`、`Card/`、`CardGrid/`；`ROOT/nuclear/packages/player/src/views/Album/`、`Artist/`、`PlaylistDetail/`、`Search/`、`Lyrics/`。                                       |
| 音频与插件模块 | `ROOT/nuclear/packages/hifi/src/Sound.tsx`、`CrossfadeSound.tsx`、`plugins/Volume.tsx`、`hooks/useAudioSeek.ts`；`ROOT/nuclear/packages/plugin-sdk/src/api/index.ts`、`types/playback.ts`、`types/queue.ts`；`ROOT/nuclear/packages/model/`。     |
| API / 数据入口 | `NuclearAPI` 暴露 Queue、Playback、Playlists、Metadata、Streaming、Favorites、Lyrics、Views、Settings 等能力；`PlaybackHost` 定义 `play/pause/seekTo/getVolume/setVolume/setRepeatMode`；`QueueHost` 定义 `addNext/reorder/goToIndex/subscribe`。 |
| 复用方式       | 借鉴 `hifi` 音频图、PlayerBar 和 QueuePanel 的受控接口，映射到 YYC³ `MediaSessionManager`；参考 plugin-sdk 设计播放器扩展点，不引入 Tauri 主程序。                                                                                                |
| 技术风险       | `packages/player` 强依赖 `@tauri-apps/api` 与生成的 Rust binding；React 18 peer 在 React 19 下需回归；无视频字幕、全屏/PiP、上传和评论。                                                                                                          |
| 合规风险       | AGPL-3.0-only；直接复制 UI/Hifi 代码会触发网络服务场景下的强开源义务。                                                                                                                                                                            |
| 适配优先级     | **P2**。状态和插件接口设计价值高，源码直接复用价值低。                                                                                                                                                                                            |

### 3.10 Funkwhale — 联邦音乐与播客

| 项目           | 结论                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 功能定位       | 去中心化音乐和播客平台，支持联邦分享、关注、Privacy 分享、播客 RSS、MusicBrainz 元数据、Subsonic 兼容及 Scrobbling。                                                                            |
| 技术栈         | Django、Celery、Postgres、Redis、Typesense；Vue 3、Pinia/Vue Router、Vite 8、PWA。                                                                                                              |
| 关键前端模块   | `ROOT/funkwhale/front/src/components/Queue.vue`、`QueueItem.vue`、`components/audio/`、`embeddable-player/`、`components/federation/`、`sharelink/`、`channels/`、`notifications/`、`upload/`。 |
| 关键宿主模块   | `ROOT/funkwhale/api/funkwhale_api/music/`、`federation/`、`users/`、`playlists/`、`radios/`、`subsonic/`、`moderation/`、`activity/`。                                                          |
| 能力证据       | 转码见 `api/funkwhale_api/music/views.py:647-743`；文件服务见 `music/views.py:606-761`，依赖 `X-Accel-Redirect/X-Sendfile`；联邦 inbox/outbox 见 `federation/routes.py:14-16,36-177`。          |
| API / 数据入口 | OpenAPI 3.0.3：`ROOT/funkwhale/api/funkwhale_api/common/schema.yml`；TS 类型由 `openapi-typescript` 生成；另有 Subsonic 兼容 API。                                                              |
| 复用方式       | 仅提取联邦分享、许可元数据、队列和上传流程作为产品参考；如确有联邦音乐需求，在宿主机以 Compose 隔离部署并通过代理访问。                                                                         |
| 技术风险       | Django/Celery/Postgres/Redis/Typesense 多服务运维；Vue 3 前端不可直接复用；Range 行为依赖反向代理；联邦密钥、签名和审核复杂。                                                                   |
| 合规风险       | AGPL-3.0，网络 copyleft 最强；`music/licenses.py` 管理的是许可元数据，不代表媒体内容已获授权。                                                                                                  |
| 适配优先级     | **P3**。默认不引入，仅作为协议与产品参考。                                                                                                                                                      |

## 四、能力横向矩阵

| 能力维度             | 最值得参考的仓库                                          | 结论                                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 独立音视频会话与队列 | Nuclear、jellyfin-web、Funkwhale                          | Nuclear 的接口边界最清晰；jellyfin-web 播放总控过重；Funkwhale 为 Vue 实现      |
| 字幕、清晰度、画中画 | jellyfin-web、PeerTube                                    | jellyfin-web 的 libass/字幕栈完整；PeerTube 壳框架无关，但均不可直接复制        |
| 视频节目页与媒体卡片 | PeerTube、MediaCMS、jellyfin-web                          | PeerTube 适合长视频节目页；MediaCMS 适合栏目/专题；Jellyfin 适合剧集/电影资料库 |
| 直播与实时聊天       | Owncast                                                   | MIT、HLS + WebSocket Chat 完整，是唯一建议进入 P0 移植的对象                    |
| 社交时间线与通知     | Mastodon、Misskey                                         | Mastodon 与 React 19 最接近；Misskey 的反应系统设计最丰富                       |
| 小组件与拖拽空间     | Misskey、Mastodon                                         | Misskey Deck/Widget 是产品蓝本；Mastodon sortable_list 是 React/dnd-kit 参考    |
| 音乐宿主服务         | Navidrome、Funkwhale、Jellyfin                            | Navidrome 运维最轻；Funkwhale 联邦最强；Jellyfin 综合最全                       |
| 视频宿主服务         | Jellyfin、PeerTube、MediaCMS                              | Jellyfin 能力最全；PeerTube 联邦/P2P；MediaCMS 门户与 CMS 轻量                  |
| 元数据与内容模型     | Jellyfin、Navidrome、MediaCMS                             | 剧集/分季、音乐标签、栏目分类分别参考三个项目                                   |
| 网络 copyleft 风险   | Funkwhale、Mastodon、Misskey、PeerTube、MediaCMS、Nuclear | 只借 UX/API，独立服务部署，避免源码复制形成衍生作品                             |

## 五、面向 YYC³ 的分层落地建议

### 5.1 可进入前端仓库的内容

| 来源                             | 允许方式                 | 前置条件                                                                      |
| -------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Owncast 的播放器、聊天、嵌入组件 | 有条件移植改造           | 复核 `THIRD-PARTY-LICENSES.txt`、字体与图标；React 18→19、AntD→Radix/Tailwind |
| Mastodon 的组件和拖拽交互        | 仅提炼设计规格后自行实现 | 不复制 AGPL 源码；替换 Redux/router/API                                       |
| Misskey 的 Deck/Widget/反应      | 仅产品交互蓝本           | 不复制 Vue/AGPL 源码；alpha 能力先验证                                        |
| 其他 AGPL/GPL 项目               | 默认禁止源码复制         | 如确需复制，先完成法务、copyleft 和衍生作品认定                               |

### 5.2 可作为独立宿主服务的内容

| 服务      | 适用条件                                | 接入边界                                      |
| --------- | --------------------------------------- | --------------------------------------------- |
| Owncast   | 综艺直播、活动直播、聊天互动            | HLS/API/WS 经 HTTPS 反向代理；RTMP 不公网暴露 |
| Navidrome | 个人音乐库、歌单、歌词、Subsonic 客户端 | 挂载宿主媒体目录；YYC³ 用 OpenAPI 生成客户端  |
| Jellyfin  | 综合电影/剧集/音乐库和转码              | API-only；不托管其 GPL Web 前端               |
| PeerTube  | 联邦视频社区或 P2P 分发                 | iframe/embed 优先；完整平台需评估运维         |
| MediaCMS  | 视频门户、栏目、专题和播放列表          | 通过 DRF OpenAPI；隔离部署                    |
| Funkwhale | 明确需要联邦音乐与许可元数据            | 最后评估；多服务与 AGPL 成本最高              |

### 5.3 与规划文档的对应关系

- **播放实例与视图分离**：参考 Nuclear 的 `PlaybackHost/QueueHost`、PeerTube standalone player 的事件边界；由 YYC³ 自行实现 session。
- **组件工作区与迷你形态**：参考 Misskey Deck/Widget 和 Mastodon sortable_list；布局引擎仍用 React Grid Layout v2 + dnd kit。
- **独立空间与视听效果**：参考 Owncast 的直播播放器、Funkwhale 的队列和许可选择流程、Misskey 的反应动效；统一纳入 reduced-motion 和低频性能治理。
- **宿主存储与网络**：Navidrome/Jellyfin/Funkwhale/PeerTube/MediaCMS 均只作为宿主侧服务，前端不得直接持有其令牌或密钥。
- **PWA/离线**：只借鉴 Navidrome/Funkwhale 的 PWA 思路，不复制其 Service Worker；YYC³ 仍需按自身缓存和 Range 规范实现。

## 六、合规决策顺序

引入任一仓库能力前按以下顺序判断：

1. **是否复制源码**：复制 AGPL/GPL 源码进入当前 MIT 前端前必须停止，默认改为自行实现。
2. **是否修改并对外提供网络服务**：AGPL 项目修改后对外提供网络访问，可能触发更广泛的源码开放义务。
3. **是否仅独立部署 + API 调用**：作为独立进程并通过标准 API 集成通常风险较低，但仍需核验部署、商标和数据处理合规。
4. **是否包含第三方资产**：字体、图标、截图、音乐、视频、封面和文档内容单独清点，软件许可证不覆盖这些内容。
5. **是否固定来源**：无 `.git` 的 PeerTube/MediaCMS 与 dirty 的 Navidrome 必须重新获取干净上游快照。
6. **是否形成可分发 SBOM**：记录上游 URL、tag/commit、许可证、修改文件和补丁，纳入发布产物。

## 七、建议执行顺序

1. **M0 — Owncast 验证**：固定 commit 和第三方许可；移植直播播放器与聊天组件；宿主以独立服务部署。
2. **M1 — Navidrome 验证**：重新拉取干净源码；部署 OpenAPI 服务；完成音乐库到 YYC³ `assetId` 的映射。
3. **M2 — 工作区 UX 对照**：按 Mastodon 拖拽组件与 Misskey Deck/Widget 编写产品规格，使用 React Grid Layout v2 + dnd kit 自行实现。
4. **M3 — 视频节目与播放器对照**：精读 PeerTube standalone player、MediaCMS VideoJS 封装和 jellyfin-web 字幕栈，只形成设计结论，不复制代码。
5. **M4 — 可选媒体平台集成**：按业务需求择一部署 Jellyfin/PeerTube/MediaCMS；Funkwhale 仅在联邦音乐明确成为需求后评估。

## 八、结论

- 10 个仓库源码完整，但只有 Owncast 的许可证适合有限度地直接移植前端组件。
- Navidrome 是音乐宿主服务的首选；Jellyfin 是综合媒体库 API 的可选方案。
- Mastodon 与 Misskey 对小组件工作区最有启发，但只能参考交互、不能复制 AGPL 源码。
- PeerTube 的独立播放器壳值得精读；MediaCMS 的内容模型适合综艺/专题栏目；jellyfin-web 的字幕和播放控制值得做设计对照。
- Nuclear 的 `hifi`、队列和插件接口边界适合作为 YYC³ 播放核心的状态模型参考。
- Funkwhale 默认不进入实施范围，仅保留为联邦音乐协议与许可元数据参考。

---

**最后更新**: 2026-11-19  
**维护者**: YYC³ Team

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
