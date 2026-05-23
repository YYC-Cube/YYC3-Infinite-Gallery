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
	title: 'YYC3 Gallery Photography Template',
	description: '温润艺术风 · 3D无限滚动画廊系统 | Warm Art Style · 3D Infinite Scroll Gallery System',
	keywords: ['YYC3', 'Gallery', 'Photography', '3D', 'Template', 'Infinite Scroll', 'Art'],
	authors: [{ name: 'YYC³' }],
	creator: 'YYC³',
	publisher: 'YYC³',
    generator: 'Next.js 15',
	icons: {
		icon: [
			{ url: '/yyc3-icons/Web App/favicon-16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/yyc3-icons/Web App/favicon-32.png', sizes: '32x32', type: 'image/png' },
		],
		apple: [
			{ url: '/yyc3-icons/Web App/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
		],
	},
	manifest: '/yyc3-icons/manifest.json',
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
