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

  // Turbopack 配置
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
