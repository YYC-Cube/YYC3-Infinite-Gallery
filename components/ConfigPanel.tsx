'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { GalleryConfig } from '@/lib/config-store';
import {
	DEFAULT_CONFIG,
	loadConfig,
	saveConfig,
	resetConfig,
	applyConfigToDOM,
} from '@/lib/config-store';

interface ConfigPanelProps {
	config: GalleryConfig;
	onConfigChange: (config: GalleryConfig) => void;
	isOpen: boolean;
	onToggle: () => void;
}

export default function ConfigPanel({
	config,
	onConfigChange,
	isOpen,
	onToggle,
}: ConfigPanelProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		applyConfigToDOM(config);
	}, [config]);

	const updateConfig = useCallback(
		(partial: Partial<GalleryConfig>) => {
			const newConfig = { ...config, ...partial };
			onConfigChange(newConfig);
			saveConfig(newConfig);
		},
		[config, onConfigChange]
	);

	const handleImageUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onloadend = () => {
					updateConfig({ backgroundImage: reader.result as string });
				};
				reader.readAsDataURL(file);
			}
		},
		[updateConfig]
	);

	const handleReset = useCallback(() => {
		const defaultConfig = resetConfig();
		onConfigChange(defaultConfig);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [onConfigChange]);

	if (!isOpen) return null;

	return (
		<>
			{/* 遮罩层 */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity"
				onClick={onToggle}
			/>

			{/* 配置面板主体 */}
			<div className="fixed right-0 top-0 bottom-0 w-full max-w-md 
                          bg-[#0a0908]/95 config-panel-backdrop z-[9999] 
                          overflow-y-auto border-l border-warm/20
                          shadow-2xl animate-fade-in-up">
				
				{/* 头部 */}
				<div className="sticky top-0 bg-[#0a0908]/90 backdrop-blur-xl 
                            p-6 border-b border-warm/10 z-10">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-[family-name:var(--font-cormorant)] 
                                     text-xl italic text-gradient font-light">
							Design Studio
						</h2>
						<button
							onClick={onToggle}
							className="w-8 h-8 rounded-full glass-effect 
                                       flex items-center justify-center
                                       text-white/60 hover:text-white transition-colors"
							aria-label="关闭面板"
						>
							✕
						</button>
					</div>
					<p className="text-xs text-white/40 tracking-wider">
						温润艺术风 · 自定义配置中心
					</p>
				</div>

				<div className="p-6 space-y-8">
					{/* ========================================
					    1. 背景素材上传
					   ======================================== */}
					<section>
						<h3 className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase">
							Background Material
						</h3>

						{/* 上传按钮 */}
						<div
							onClick={() => fileInputRef.current?.click()}
							className="border-2 border-dashed border-warm/30 rounded-xl p-8 
                                   text-center cursor-pointer hover:border-warm/50 
                                   transition-all duration-300 group
                                   bg-warm/5 hover:bg-warm/10"
						>
							{config.backgroundImage ? (
								<div className="space-y-3">
									<img
										src={config.backgroundImage}
										alt="自定义背景预览"
										className="max-h-32 mx-auto rounded-lg object-cover opacity-80"
									/>
									<p className="text-xs text-white/50 group-hover:text-white/70 
                                                 transition-colors">
										点击更换背景图
									</p>
								</div>
							) : (
								<div className="space-y-3">
									<div className="w-12 h-12 mx-auto rounded-full 
                                                bg-warm/10 flex items-center justify-center
                                                group-hover:bg-warm/20 transition-colors">
										<span className="text-2xl">📁</span>
									</div>
									<p className="text-sm text-white/60 group-hover:text-white/80 
                                                 transition-colors">
										点击上传背景素材
									</p>
									<p className="text-xs text-white/30">
										支持 JPG / PNG / WebP · 最大 5MB
									</p>
								</div>
							)}
						</div>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>

						{/* 背景参数 */}
						{config.backgroundImage && (
							<div className="mt-4 space-y-3 pl-4 border-l-2 border-warm/20">
								<SliderControl
									label="透明度"
									value={config.backgroundOpacity}
									min={0.1}
									max={1}
									step={0.1}
									onChange={(v) => updateConfig({ backgroundOpacity: v })}
								/>
								<SliderControl
									label="模糊度"
									value={config.backgroundBlur}
									min={0}
									max={20}
									step={1}
									unit="px"
									onChange={(v) => updateConfig({ backgroundBlur: v })}
								/>
								<SelectControl
									label="位置"
									value={config.backgroundPosition}
									options={[
										{ value: 'center', label: '居中' },
										{ value: 'top', label: '顶部' },
										{ value: 'bottom', label: '底部' },
									]}
									onChange={(v) =>
										updateConfig({ backgroundPosition: v })
									}
								/>
								<button
									onClick={() => updateConfig({ backgroundImage: null })}
									className="text-xs text-red-400/70 hover:text-red-400 
                                               transition-colors mt-2"
								>
									移除背景图
								</button>
							</div>
						)}
					</section>

					{/* ========================================
					    2. 视觉风格
					   ======================================== */}
					<section>
						<h3 className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase">
							Visual Style
						</h3>

						<div className="space-y-4">
							<SliderControl
								label="光效强度"
								value={config.glowIntensity}
								min={0}
								max={2}
								step={0.1}
								onChange={(v) => updateConfig({ glowIntensity: v })}
							/>

							<ColorPickerControl
								label="顶部光晕色"
								value={config.ambientTopColor}
								onChange={(v) => updateConfig({ ambientTopColor: v })}
							/>

							<ColorPickerControl
								label="左侧光晕色"
								value={config.ambientLeftColor}
								onChange={(v) => updateConfig({ ambientLeftColor: v })}
							/>

							<ColorPickerControl
								label="主色调"
								value={config.warmPrimaryColor}
								onChange={(v) => updateConfig({ warmPrimaryColor: v })}
							/>

							<ToggleControl
								label="启用光效"
								enabled={config.enableGlowEffect}
								onToggle={(v) => updateConfig({ enableGlowEffect: v })}
							/>
						</div>
					</section>

					{/* ========================================
					    3. 排版细节
					   ======================================== */}
					<section>
						<h3 className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase">
							Typography
						</h3>

						<div className="space-y-4">
							<SelectControl
								label="字号"
								value={config.fontSize}
								options={[
									{ value: 'xs', label: '超小' },
									{ value: 'sm', label: '小' },
									{ value: 'base', label: '标准' },
									{ value: 'lg', label: '大' },
									{ value: 'xl', label: '特大' },
								]}
								onChange={(v) => updateConfig({ fontSize: v })}
							/>

							<SelectControl
								label="字重"
								value={config.fontWeight}
								options={[
									{ value: 'light', label: '细体' },
									{ value: 'normal', label: '常规' },
									{ value: 'medium', label: '中等' },
								]}
								onChange={(v) => updateConfig({ fontWeight: v })}
							/>

							<SliderControl
								label="字距"
								value={config.letterSpacing}
								min={0.1}
								max={1}
								step={0.05}
								unit="em"
								onChange={(v) => updateConfig({ letterSpacing: v })}
							/>

							<SliderControl
								label="文字透明度"
								value={config.textOpacity}
								min={0.3}
								max={1}
								step={0.05}
								onChange={(v) => updateConfig({ textOpacity: v })}
							/>
						</div>
					</section>

					{/* ========================================
					    4. 动效参数
					   ======================================== */}
					<section>
						<h3 className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase">
							Animation
						</h3>

						<div className="space-y-4">
							<SliderControl
								label="显现时长"
								value={config.revealDuration}
								min={0.3}
								max={3}
								step={0.1}
								unit="s"
								onChange={(v) => updateConfig({ revealDuration: v })}
							/>

							<SliderControl
								label="显现延迟"
								value={config.revealDelay}
								min={0}
								max={3}
								step={0.1}
								unit="s"
								onChange={(v) => updateConfig({ revealDelay: v })}
							/>

							<SliderControl
								label="浮动周期"
								value={config.floatDuration}
								min={2}
								max={12}
								step={0.5}
								unit="s"
								onChange={(v) => updateConfig({ floatDuration: v })}
							/>

							<SliderControl
								label="浮动距离"
								value={Math.abs(config.floatDistance)}
								min={0}
								max={30}
								step={1}
								unit="px"
								onChange={(v) =>
									updateConfig({
										floatDistance: -v,
									})
								}
							/>

							<SliderControl
								label="呼吸周期"
								value={config.breatheDuration}
								min={2}
								max={8}
								step={0.5}
								unit="s"
								onChange={(v) => updateConfig({ breatheDuration: v })}
							/>
						</div>
					</section>

					{/* ========================================
					    5. 布局结构
					   ======================================== */}
					<section>
						<h3 className="text-sm font-mono tracking-[0.2em] 
                                     text-warm-primary mb-4 uppercase">
							Layout
						</h3>

						<div className="space-y-4">
							<SliderControl
								label="底部内边距"
								value={config.footerPaddingY}
								min={6}
								max={24}
								step={2}
								unit=""
								onChange={(v) => updateConfig({ footerPaddingY: v })}
							/>

							<SliderControl
								label="分隔线宽度"
								value={config.separatorWidth}
								min={32}
								max={96}
								step={8}
								unit=""
								onChange={(v) => updateConfig({ separatorWidth: v })}
							/>

							<ToggleControl
								label="显示移动端提示"
								enabled={config.showMobileHint}
								onToggle={(v) => updateConfig({ showMobileHint: v })}
							/>
						</div>
					</section>

					{/* 操作按钮 */}
					<div className="pt-6 border-t border-warm/10 space-y-3">
						<button
							onClick={handleReset}
							className="w-full py-3 px-4 rounded-xl glass-effect 
                                   text-sm text-white/70 hover:text-white 
                                   transition-all duration-300 
                                   hover:border-red-400/30 hover:text-red-400/80
                                   tracking-wider"
						>
							↻ 重置为默认设置
						</button>

						<p className="text-xs text-center text-white/20 pt-2">
							所有更改自动保存到本地存储
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

/* 子组件：滑块控制器 */
function SliderControl({
	label,
	value,
	min,
	max,
	step,
	unit = '',
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	unit?: string;
	onChange: (value: number) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-xs text-white/50">{label}</span>
				<span className="text-xs font-mono text-warm-primary/80 tabular-nums">
					{value.toFixed(step < 1 ? 1 : 0)}
					{unit}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(parseFloat(e.target.value))}
				className="w-full config-slider"
			/>
		</div>
	);
}

/* 子组件：颜色选择器 */
function ColorPickerControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-xs text-white/50">{label}</span>
			<div className="flex items-center gap-2">
				<input
					type="color"
					value={
						value.startsWith('rgba')
							? '#d4a574'
							: value
					}
					onChange={(e) => onChange(e.target.value)}
					className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
				/>
				<span className="text-xs font-mono text-white/30 max-w-[120px] truncate">
					{value.length > 20 ? value.slice(0, 18) + '...' : value}
				</span>
			</div>
		</div>
	);
}

/* 子组件：下拉选择器 */
function SelectControl({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: { value: string; label: string }[];
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-xs text-white/50">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="bg-transparent border border-warm/20 rounded-lg px-3 py-1.5 
                         text-xs text-white/70 focus:border-warm/40 
                         outline-none cursor-pointer transition-colors"
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value} className="bg-[#0a0908]">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

/* 子组件：开关切换器 */
function ToggleControl({
	label,
	enabled,
	onToggle,
}: {
	label: string;
	enabled: boolean;
	onToggle: (value: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-xs text-white/50">{label}</span>
			<button
				onClick={() => onToggle(!enabled)}
				className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
					enabled ? 'bg-warm-primary/60' : 'bg-white/10'
				}`}
			>
				<span
					className={`absolute top-1 left-1 w-4 h-4 rounded-full 
                             bg-white shadow-md transition-transform duration-300 ${
								enabled ? 'translate-x-5' : ''
							}`}
				/>
			</button>
		</div>
	);
}
