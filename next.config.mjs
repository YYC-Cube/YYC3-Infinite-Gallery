/**
 * 局域网/隧道调试白名单：Next.js 16 默认只允许 localhost 请求开发资源。
 * 通过局域网 IP 访问时，需在 .env.local 设置 NEXT_DEV_ORIGINS（逗号分隔主机名，不含协议与端口）。
 * 例：NEXT_DEV_ORIGINS=192.168.3.48,my-mac.local
 */
const devOrigins = (process.env.NEXT_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 仅开发环境生效；生产构建忽略
  allowedDevOrigins: devOrigins,
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
