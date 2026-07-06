# 📘 API 参考

本文档提供 YYC3 Infinite Gallery 完整 API 参考。

---

## 目录

1. [核心组件](#核心组件)
2. [类型定义](#类型定义)
3. [Hook API](#hook-api)
4. [API Routes](#api-routes)

---

## 核心组件

### `<InfiniteGallery />`

3D 无限滚动画廊主组件。

```tsx
import InfiniteGallery from '@/components/InfiniteGallery'

<InfiniteGallery
  images={images}
  options={{ layout: 'spiral', enableAutoPlay: true }}
  onImageClick={(img) => console.log(img)}
/>
```

#### Props

| Prop | 类型 | 默认值 | 描述 |
|-------|------|--------|------|
| `images` | `GalleryImage[]` | **必填** | 图片数据数组 |
| `options` | `GalleryOptions` | `{}` | 配置选项 |
| `onImageClick` | `(img: GalleryImage) => void` | — | 图片点击回调 |
| `onImageLoad` | `(img: GalleryImage) => void` | — | 图片加载完成回调 |
| `onScroll` | `(pos: ScrollPosition) => void` | — | 滚动位置变化回调 |

---

## 类型定义

### `GalleryImage`

```typescript
interface GalleryImage {
  id: string                    // 唯一标识
  src: string                   // 图片 URL
  alt: string                   // 无障碍替代文本
  title?: string                // 标题
  description?: string          // 描述
  width?: number                // 原始宽度（用于宽高比计算）
  height?: number               // 原始高度
  thumbnail?: string            // 缩略图 URL（懒加载用）
  blurDataURL?: string          // 模糊占位图（Base64）
  metadata?: ImageMetadata      // 扩展元数据
}

interface ImageMetadata {
  camera?: string              // 相机型号
  lens?: string                // 镜头
  aperture?: string            // 光圈
  shutterSpeed?: string        // 快门速度
  iso?: string                // ISO
  focalLength?: string        // 焦距
  date?: string                // 拍摄日期
  location?: string            // 拍摄地点
}
```

### `GalleryOptions`

```typescript
interface GalleryOptions {
  // ── 布局 ──────────────────────────────────
  layout?: 'grid' | 'random' | 'spiral' | 'masonry'
  imageSize?: number           // 默认 300，图片基础尺寸
  spacing?: number             // 默认 50，图片间距（px）
  depth?: number               // 默认 10，3D 纵深强度

  // ── 缩放 ──────────────────────────────────
  initialZoom?: number         // 默认 1
  minZoom?: number             // 默认 0.5
  maxZoom?: number             // 默认 3
  zoomSensitivity?: number     // 默认 0.1

  // ── 滚动 ──────────────────────────────────
  scrollSensitivity?: number   // 默认 1
  scrollDeceleration?: number  // 默认 0.95（0~1，越大减速越慢）
  rotationSensitivity?: number // 默认 0.01

  // ── 自动播放 ──────────────────────────────
  enableAutoPlay?: boolean     // 默认 false
  autoPlaySpeed?: number       // 默认 1（秒）
  autoPlayInterval?: number    // 默认 3000（ms）

  // ── 交互 ──────────────────────────────────
  enableKeyboard?: boolean     // 默认 true
  enableTouch?: boolean        // 默认 true
  enableMouseWheel?: boolean   // 默认 true
  enableDrag?: boolean         // 默认 true

  // ── 视觉 ──────────────────────────────────
  backgroundColor?: string     // 默认 '#000000'
  shadows?: boolean            // 默认 true
  reflection?: boolean         // 默认 false
  ambientLight?: number        // 默认 0.5
  directionalLight?: number    // 默认 1

  // ── 性能 ──────────────────────────────────
  lazyLoad?: boolean           // 默认 true
  lazyLoadThreshold?: number   // 默认 0.5（视口比例）
  maxImagesPerFrame?: number   // 默认 10
  enableCulling?: boolean      // 默认 true（视锥体剔除）
}
```

### `ScrollPosition`

```typescript
interface ScrollPosition {
  x: number
  y: number
  z: number
  zoom: number
}
```

---

## Hook API

### `useGalleryState()`

管理画廊状态的自定义 Hook。

```typescript
import { useGalleryState } from '@/hooks/useGalleryState'

const {
  images,           // GalleryImage[]
  loading,          // boolean
  error,            // Error | null
  loadMore,         // () => Promise<void>
  scrollPosition,   // ScrollPosition
  zoom,             // number
  setZoom,          // (z: number) => void
} = useGalleryState({
  initialImages: [],
  pageSize: 20,
  fetchFn: async (page) => {
    const res = await fetch(`/api/images?page=${page}`)
    return res.json()
  },
})
```

### `useKeyboardControls()`

键盘快捷键 Hook。

```typescript
import { useKeyboardControls } from '@/hooks/useKeyboardControls'

useKeyboardControls({
  onZoomIn: () => console.log('zoom in'),
  onZoomOut: () => console.log('zoom out'),
  onResetZoom: () => console.log('reset'),
  onTogglePlay: () => console.log('toggle'),
  onFullscreen: () => console.log('fullscreen'),
})
```

---

## API Routes

### `GET /api/images`

获取图片分页列表。

**Query Parameters**

| 参数 | 类型 | 默认 | 描述 |
|------|------|------|------|
| `page` | `number` | `1` | 页码 |
| `limit` | `number` | `20` | 每页数量 |
| `sort` | `string` | `date` | 排序字段 |
| `order` | `asc` / `desc` | `desc` | 排序方向 |

**Response**

```json
{
  "images": [
    {
      "id": "1",
      "src": "/photos/photo1.webp",
      "alt": "雪山日出",
      "title": "雪山日出",
      "thumbnail": "/thumbnails/photo1.webp",
      "metadata": { "camera": "Sony A7R V", "iso": "100" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### `GET /api/health`

健康检查。

**Response**

```json
{ "status": "ok", "timestamp": "2026-07-06T06:00:00.000Z", "version": "2.0.0" }
```

---

<div align="center">
  <a href="./README.md">← 返回文档首页</a>
</div>
