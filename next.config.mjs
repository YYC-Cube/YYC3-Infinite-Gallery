/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages 静态导出配置
  output: 'export',
  // 使用自定义域名时，basePath 为空
  basePath: '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,

  // 跳过 TypeScript 类型检查（构建时忽略类型错误）
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack 配置
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
