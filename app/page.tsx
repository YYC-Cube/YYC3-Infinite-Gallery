/**
 * @file 主页组件 - 温润艺术风全功能版
 * @description 集成自定义配置系统的3D画廊主页
 * @author YYC³
 * @version 3.0.0 (温润艺术风 + 自定义系统)
 * @created 2025-09-15
 * @updated 2025-09-22
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteGallery from '@/components/InfiniteGallery';
import ConfigPanel from '@/components/ConfigPanel';
import type { GalleryConfig } from '@/lib/config-store';
import {
	DEFAULT_CONFIG,
	loadConfig,
	applyConfigToDOM,
} from '@/lib/config-store';

export default function Home() {
	const [config, setConfig] = useState<GalleryConfig>(DEFAULT_CONFIG);
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
		const savedConfig = loadConfig();
		setConfig(savedConfig);
		applyConfigToDOM(savedConfig);
	}, []);

	const handleConfigChange = useCallback((newConfig: GalleryConfig) => {
		setConfig(newConfig);
	}, []);

	const sampleImages = [
		{ src: '/1.webp', alt: '摄影作品 1' },
		{ src: '/2.webp', alt: '摄影作品 2' },
		{ src: '/3.webp', alt: '摄影作品 3' },
		{ src: '/4.webp', alt: '摄影作品 4' },
		{ src: '/5.webp', alt: '摄影作品 5' },
		{ src: '/6.webp', alt: '摄影作品 6' },
		{ src: '/7.webp', alt: '摄影作品 7' },
		{ src: '/8.webp', alt: '摄影作品 8' },
	];

	if (!isClient) return null;

	return (
		<main className="min-h-screen relative">
			{/* 自定义背景层 */}
			{config.backgroundImage && (
				<div
					className="fixed inset-0 z-0 pointer-events-none"
					style={{
						backgroundImage: `url(${config.backgroundImage})`,
						backgroundSize: 'cover',
						backgroundPosition: config.backgroundPosition,
						backgroundRepeat: 'no-repeat',
						opacity: config.backgroundOpacity,
						filter: `blur(${config.backgroundBlur}px)`,
					}}
				/>
			)}

			<InfiniteGallery
				images={sampleImages}
				speed={1.2}
				zSpacing={3}
				visibleCount={12}
				falloff={{ near: 0.8, far: 14 }}
				className="h-screen w-full rounded-lg overflow-hidden relative z-10"
			/>

			{/* ========================================
			    高级感页脚系统 (完全可配置)
			   ======================================== */}
			<div
				className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
				style={{
					paddingBottom: `${config.footerPaddingY * 4}px`,
				}}
			>
				{/* 背景渐变遮罩 */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

				{/* 光晕效果 - 可开关 */}
				{config.enableGlowEffect && (
					<div
						className="absolute top-0 left-1/2 -translate-x-1/2 
                                   w-96 h-32 bg-gradient-radial 
                                   from-white/10 via-white/5 to-transparent 
                                   rounded-full blur-2xl animate-aura"
						style={{ animationDelay: '0.5s' }}
					/>
				)}

				{/* SVG 分隔线 */}
				<div className="relative flex justify-center pt-6">
					<svg
						className="h-px opacity-40 animate-draw"
						viewBox="0 0 200 1"
						preserveAspectRatio="none"
						style={{
							width: `${config.separatorWidth * 4}px`,
							animationDelay: '1s',
						}}
					>
						<defs>
							<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="transparent" />
								<stop offset="50%" stopColor={`rgba(212, 165, 116, ${config.textOpacity})`} />
								<stop offset="100%" stopColor="transparent" />
							</linearGradient>
						</defs>
						<line
							x1="0"
							y1="0"
							x2="200"
							y2="0"
							stroke="url(#lineGradient)"
							strokeWidth="1"
						/>
					</svg>
				</div>

				{/* 主标语区域 - 完全可配置 */}
				<div className="relative px-4 pt-4 sm:pt-6">
					<p
						className="
							font-[family-name:var(--font-cormorant)]
							font-light italic
							text-center
							animate-reveal
							text-shadow-elegant
							gpu-accelerated
						"
						style={{
							fontSize:
								config.fontSize === 'xs'
									? '0.75rem'
									: config.fontSize === 'sm'
									? '0.875rem'
									: config.fontSize === 'base'
									? '1rem'
									: config.fontSize === 'lg'
									? '1.125rem'
									: '1.25rem',
							fontWeight:
								config.fontWeight === 'light'
									? 300
									: config.fontWeight === 'normal'
									? 400
									: 500,
							letterSpacing: `${config.letterSpacing}em`,
							color: `rgba(245, 240, 232, ${config.textOpacity})`,
							lineHeight: config.lineHeight,
							animationDelay: `${config.revealDelay}s`,
						}}
					>
						<span className="inline-block animate-float">言启象限</span>
						<span
							className="mx-2 sm:mx-3 md:mx-4 font-light"
							style={{
								color: `rgba(245, 240, 232, ${config.textOpacity * 0.37})`,
								opacity: 0.5,
							}}
						>
							|
						</span>
						<span
							className="inline-block animate-float"
							style={{ animationDelay: '0.5s' }}
						>
							语枢未来
						</span>
					</p>

					{/* 移动端操作提示 - 可开关 */}
					{config.showMobileHint && (
						<div className="md:hidden mt-6 flex justify-center items-center gap-2 text-white/30">
							<svg
								className="w-4 h-4 animate-bounce"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M19 14l-7 7m0 0l-7-7m7 7V3"
								/>
							</svg>
							<span className="text-[10px] tracking-widest uppercase font-mono">
								Scroll to Explore
							</span>
						</div>
					)}
				</div>
			</div>

			{/* ========================================
			    配置面板触发按钮 (悬浮)
			   ======================================== */}
			<button
				onClick={() => setIsPanelOpen(true)}
				className="
					fixed bottom-24 right-6 z-[9997]
					w-12 h-12 rounded-full
					glass-effect
					flex items-center justify-center
					text-white/70 hover:text-white
					transition-all duration-300
					hover:scale-110 hover:shadow-lg
					group
					animate-pulse-glow
				"
				aria-label="打开设计配置面板"
				title="Design Studio · 设计工作室"
			>
				<span className="text-xl group-hover:rotate-90 transition-transform duration-500">
					⚙
				</span>
			</button>

			{/* 配置面板 */}
			<ConfigPanel
				config={config}
				onConfigChange={handleConfigChange}
				isOpen={isPanelOpen}
				onToggle={() => setIsPanelOpen(false)}
			/>
		</main>
	);
}
