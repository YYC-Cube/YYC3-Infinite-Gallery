/**
 * @file RootLayout 布局组件
 * @description 应用程序根布局组件，配置全局字体、元数据和HTML结构
 * @author YYC³
 * @version 1.0.0
 * @created 2025-09-15
 */
import type { Metadata } from 'next';
import { Geist_Mono, Cormorant_Garamond } from 'next/font/google';
import "./globals.css"

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	weight: ['300', '400', '500'],
});

const cormorant = Cormorant_Garamond({
	variable: '--font-cormorant',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	style: ['italic'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'YYC3 Infinite Gallery',
	description: '基于 Next.js 和 Three.js 构建的高性能 3D 无限滚动画廊展示系统 | High-performance 3D Infinite Scroll Gallery',
	keywords: ['YYC3', 'Gallery', 'Photography', '3D', 'Infinite Scroll', 'Next.js', 'Three.js'],
	authors: [{ name: 'YYC³' }],
	creator: 'YYC³',
	publisher: 'YYC³',
    generator: 'Next.js 16',
	icons: {
		icon: [
			{ url: '/favicon.ico', type: 'image/x-icon' },
		],
		apple: [
			{ url: '/D-icons/icon-192.png', sizes: '192x192', type: 'image/png' },
		],
	},
	manifest: '/manifest.json',
    openGraph: {
        title: 'YYC3 Gallery Photography Template',
        description: '温润艺术风 · 3D无限滚动画廊系统',
        url: 'https://gallery.yyc3.top',
        siteName: 'YYC3 Gallery',
        locale: 'zh_CN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'YYC3 Gallery Photography Template',
        description: '温润艺术风 · 3D无限滚动画廊系统',
    },
    alternates: {
        canonical: 'https://gallery.yyc3.top',
    }
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<body
		className={`${geistMono.variable} ${cormorant.variable} antialiased`}
	>
				{children}
			</body>
		</html>
	);
}
