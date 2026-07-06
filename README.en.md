# 🎨 YYC3 Infinite Gallery

<p align="center">
  <img src="public/D-1998.png" alt="YYC3 3D Gallery Preview" width="100%" />
</p>

<p align="center">
  <strong>High-Performance 3D Infinite Scroll Gallery Built with Next.js and Three.js</strong>
</p>

<p align="center">
  <a href="https://gallery.yyc3.top" target="_blank">🌐 Live Demo</a> ·
  <a href="#-quick-start">🚀 Quick Start</a> ·
  <a href="#-core-features">✨ Core Features</a> ·
  <a href="docs/api.md">📖 API Docs</a> ·
  <a href="#-contributing">🤝 Contributing</a>
</p>

---

## 📊 Project Status

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-Infinite-Gallery/deploy.yml?branch=main&style=for-the-badge" />
  <img src="https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge&logo=pwa" />
  <img src="https://img.shields.io/badge/lighthouse-100-brightgreen?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/codefactor/grade/github/YYC-Cube/YYC3-Infinite-Gallery?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.0-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/React-19.2.7-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Three.js-0.185.1-000000?style=for-the-badge&logo=three.js" />
</p>

---

## 📦 Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| [Next.js](https://nextjs.org/) | 16.2.10 | React App Framework (Turbopack) |
| [React](https://react.dev/) | 19.2.7 | UI Library |
| [TypeScript](https://www.typescriptlang.org/) | 5.7.0 | Type Safety |
| [Three.js](https://threejs.org/) | 0.185.1 | 3D Graphics Engine |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 9.6.1 | React 3D Renderer |
| [Drei](https://github.com/pmndrs/drei) | 10.7.7 | 3D Helper Components |
| [Tailwind CSS](https://tailwindcss.com/) | 4.0.0 | Atomic CSS Framework |

---

## ✨ Core Features

### 🎯 3D Infinite Scroll
- **WebGL High-Performance Rendering** — Built on Three.js + React Three Fiber, 60fps smooth experience
- **Infinite Content Loading** — Auto-load more content when scrolling to bottom
- **Smart Layout Algorithm** — Grid / Random / Spiral layout modes with auto-optimization

### 📱 Full Device Support
- **Responsive Design** — Perfect adaptation for desktop, tablet, and mobile
- **Touch Optimized** — Touch interactions carefully tuned for mobile devices
- **PWA Installable** — Installable as desktop / home screen app with offline access

### 🎨 Visual Effects
- **Immersive 3D** — Dynamic lighting, smart shadows, smooth transition animations
- **Reflection Effect** — Optional ground reflection for enhanced visual depth
- **Post-Processing** — Bloom, depth of field and other post-processing effects (optional)

### ⚡ Performance Optimization
- **Turbopack Build** — Lightning-fast dev / production builds
- **Lazy Loading** — On-demand loading of images and resources
- **Code Splitting** — Automatic route-level code splitting
- **WebGL Fallback** — Auto-detect and fallback to 2D mode
- **Image Optimization** — WebP/AVIF support, responsive images

---

## 🚀 Quick Start

### Requirements

| Dependency | Minimum Version |
|------------|-----------------|
| Node.js | ≥ 18.0.0 |
| pnpm | ≥ 8.0.0 (recommended) |

### Install & Start

```bash
# Clone the project
git clone https://github.com/YYC-Cube/YYC3-Infinite-Gallery.git
cd yyc3-infinite-gallery

# Install dependencies (pnpm recommended)
pnpm install

# Start development server (Turbopack)
pnpm dev
# → http://localhost:3000
```

### Available Scripts

```bash
pnpm dev           # Start dev server (Turbopack)
pnpm build         # Build for production (static export)
pnpm start         # Preview production build locally
pnpm lint          # ESLint code check
pnpm lint:fix      # Auto-fix Lint issues
pnpm typecheck     # TypeScript type check
pnpm test          # Run tests
pnpm test:watch    # Run tests in watch mode
pnpm format        # Format code (Prettier)
pnpm analyze       # Bundle size analysis
pnpm audit         # Dependency security audit
pnpm update-deps   # Interactive dependency update
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/api.md) | Component Props, type definitions, Hook interfaces |
| [Development Guide](docs/development.md) | Environment setup, code standards, debugging tips |
| [Deployment Guide](docs/deployment.md) | GitHub Pages / Vercel / Docker deployment |
| [PWA Guide](docs/pwa.md) | Manifest / Service Worker / offline support |
| [Contributing](CONTRIBUTING.md) | Fork workflow, Commit conventions, PR template |

> 📘 **中文文档**: [查看中文文档](README.md)

---

## 🎮 Usage Guide

### Basic Usage

```tsx
import InfiniteGallery from '@/components/InfiniteGallery';

export default function Home() {
  const images = [
    { id: '1', src: '/photos/1.webp', alt: 'Photo 1', title: 'Work 1' },
    { id: '2', src: '/photos/2.webp', alt: 'Photo 2', title: 'Work 2' },
    // ... more images
  ];

  return (
    <InfiniteGallery 
      images={images}
      options={{
        initialZoom: 1,
        autoPlay: false,
        enableKeyboard: true,
        enableTouch: true,
      }}
      onImageClick={(image) => console.log('Clicked:', image)}
    />
  );
}
```

### Configuration Options

```typescript
interface GalleryOptions {
  // Zoom configuration
  initialZoom?: number;              // Initial zoom level (default: 1)
  zoomSensitivity?: number;          // Zoom sensitivity (default: 0.1)
  
  // Scroll configuration
  scrollSensitivity?: number;        // Scroll sensitivity (default: 1)
  rotationSensitivity?: number;      // Rotation sensitivity (default: 0.01)
  
  // Auto play
  autoPlay?: boolean;               // Auto play (default: false)
  autoPlaySpeed?: number;            // Auto play speed (default: 1)
  
  // Interaction control
  enableKeyboard?: boolean;          // Enable keyboard control (default: true)
  enableTouch?: boolean;             // Enable touch control (default: true)
  enableMouseWheel?: boolean;        // Enable mouse wheel (default: true)
  
  // Visual configuration
  backgroundColor?: string;          // Background color (default: '#000000')
  imageSize?: number;                // Initial image size (default: 300)
  spacing?: number;                  // Image spacing (default: 50)
  layout?: 'grid' | 'random' | 'spiral'; // Layout mode (default: 'grid')
  depth?: number;                    // 3D depth effect (default: 10)
  shadows?: boolean;                // Enable shadows (default: true)
  reflection?: boolean;              // Enable reflection (default: false)
}
```

### Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `↑` `↓` `←` `→` | Scroll / Navigate |
| `+` / `=` | Zoom In |
| `-` / `_` | Zoom Out |
| `0` | Reset Zoom |
| `Space` | Pause / Play auto carousel |
| `F` | Toggle Fullscreen |
| `Escape` | Exit Fullscreen |

---

## 📱 PWA Features

### Install as App

1. **Desktop**: Click "Install" icon in browser address bar
2. **Mobile**: Select "Add to Home Screen" in browser menu
3. **Offline Use**: Support offline access to cached content after installation

### PWA Features

- ✅ **Offline Support** — Service Worker caching strategy
- ✅ **App Shell** — Fast-loading app shell architecture
- ✅ **Background Sync** — Auto-sync after network recovery
- ✅ **Fullscreen Mode** — Immersive fullscreen experience
- ✅ **Auto Update** — New version detection and update prompt

---

## ⚡ Performance

### Best Practices

1. **Image Optimization**
   - Use WebP/AVIF formats
   - Implement responsive images (`sizes` + `srcset`)
   - Enable lazy loading (Intersection Observer)

2. **Code Optimization**
   - Use `React.memo` to avoid unnecessary re-renders
   - Implement code splitting (dynamic `import()`)
   - Optimize bundle size (Tree Shaking)

3. **Rendering Optimization**
   - Use DOM overlays outside Canvas
   - Implement frustum culling
   - Optimize 3D model complexity (LOD)

### Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Lighthouse Performance | > 90 | ✅ 95+ |
| First Contentful Paint | < 1.5s | ✅ ~1.2s |
| Time to Interactive | < 3.5s | ✅ ~2.8s |
| Core Web Vitals | Good | ✅ Good |

---

## 🌍 Deployment

### GitHub Pages (Configured 🟢)

Auto-deploy via GitHub Actions on push to `main`:

```bash
git push origin main
# → Wait ~2 minutes
# → Visit https://gallery.yyc3.top
```

### Vercel (Recommended for Dynamic API)

```bash
pnpm add -D vercel
vercel deploy
```

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://gallery.yyc3.top
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX     # Optional: Google Analytics
NEXT_PUBLIC_SENTRY_DSN=https://...  # Optional: Error monitoring
```

---

## 🤝 Contributing

We welcome any form of contribution! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# 1. Fork the project
# 2. Create feature branch
git checkout -b feat/your-feature

# 3. Commit (follow Conventional Commits)
git commit -m "feat: add spiral layout"

# 4. Push and create PR
git push origin feat/your-feature
```

### Code Standards

- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Code Style**: ESLint + Prettier (auto-format)
- **Type Safety**: TypeScript strict mode, complete type definitions

---

## 🐛 Issue Reporting

### Report Bugs

Please use [GitHub Issues](https://github.com/YYC-Cube/YYC3-Infinite-Gallery/issues):

1. **Describe the problem** — Clear description of the issue
2. **Reproduction steps** — Detailed steps to reproduce
3. **Expected behavior** — Describe the expected correct behavior
4. **Screenshots** — If possible, provide screenshots or recordings
5. **Environment info** — Browser, OS, device information

### Feature Requests

We welcome new feature suggestions! Please use the "Feature Request" label in Issues.

---

## 📄 License

[MIT License](LICENSE) — Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — React App Framework
- [Three.js](https://threejs.org/) — 3D Graphics Engine
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React 3D Renderer
- [Tailwind CSS](https://tailwindcss.com/) — Atomic CSS Framework
- [Vercel](https://vercel.com/) — Deployment Platform

---

## 📧 Contact

- **Author**: YYC³
- **Website**: [https://yyc3.top](https://yyc3.top)
- **Demo**: [https://gallery.yyc3.top](https://gallery.yyc3.top)
- **GitHub**: [@yyc3](https://github.com/yyc3)
- **Email**: contact@yyc3.top

---

## 📊 Project Statistics

<p align="center">
  <img src="https://img.shields.io/github/stars/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/forks/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/watchers/YYC-Cube/YYC3-Infinite-Gallery?style=social" />
  <img src="https://img.shields.io/github/contributors/YYC-Cube/YYC3-Infinite-Gallery" />
  <img src="https://img.shields.io/github/last-commit/YYC-Cube/YYC3-Infinite-Gallery" />
</p>

---

<p align="center">
  <strong>🌹 Thank You for Using YYC3 Infinite Gallery!</strong>
</p>

<p align="center">
  We are committed to providing the best 3D content display experience.
</p>

<p align="center">
  Built with ❤️ by <a href="https://yyc3.top">YYC³</a> ·
  <a href="https://github.com/YYC-Cube/YYC3-Infinite-Gallery">GitHub</a> ·
  <a href="https://gallery.yyc3.top">Live Demo</a>
</p>
