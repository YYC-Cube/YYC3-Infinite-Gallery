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
	title: '3D 画廊摄影模板',
	description: '现代化3D画廊摄影展示模板',
    generator: 'v0.app',
    alternates: {
        canonical: 'https://example.com',
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
