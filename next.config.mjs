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

  // 严格类型门禁：构建时必须通过 TypeScript 检查
  typescript: {
    ignoreBuildErrors: false,
  },

  // Turbopack 配置
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
