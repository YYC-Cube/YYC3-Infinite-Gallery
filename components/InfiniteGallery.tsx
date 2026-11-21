/**
 * @file InfiniteGallery 组件
 * @description 3D无限滚动画廊组件，使用React Three Fiber实现沉浸式图片展示效果
 * @author YYC³
 * @version 2.0.0
 * @created 2025-09-15
 * @updated 2026-11-21
 */
'use client';

import type React from 'react';
import {
	Suspense,
	useRef,
	useMemo,
	useCallback,
	useState,
	useEffect,
	useSyncExternalStore,
} from 'react';

/*
 * R3F 的 useFrame 需要逐帧命令式修改 ref、mesh 与材质 uniform，
 * 这是渲染循环而非 React 渲染，显式关闭 Compiler 的不可变性检查。
 */
/* eslint-disable react-hooks/immutability */
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
	/** Fade in range as percentage of depth range (0-1) */
	fadeIn: {
		start: number;
		end: number;
	};
	/** Fade out range as percentage of depth range (0-1) */
	fadeOut: {
		start: number;
		end: number;
	};
}

interface BlurSettings {
	/** Blur in range as percentage of depth range (0-1) */
	blurIn: {
		start: number;
		end: number;
	};
	/** Blur out range as percentage of depth range (0-1) */
	blurOut: {
		start: number;
		end: number;
	};
	/** Maximum blur amount (0-10, higher values = more blur) */
	maxBlur: number;
}

interface InfiniteGalleryProps {
	images: ImageItem[];
	/** Speed multiplier applied to scroll delta (default: 1) */
	speed?: number;
	/** Spacing between images along Z in world units (default: 2.5) */
	zSpacing?: number;
	/** Number of visible planes (default: clamp to images.length, min 8) */
	visibleCount?: number;
	/** Near/far distances for opacity/blur easing (default: { near: 0.5, far: 12 }) */
	falloff?: { near: number; far: number };
	/** Fade in/out settings with ranges based on depth range percentage (default: { fadeIn: { start: 0.05, end: 0.15 }, fadeOut: { start: 0.85, end: 0.95 } }) */
	fadeSettings?: FadeSettings;
	/** Blur in/out settings with ranges based on depth range percentage (default: { blurIn: { start: 0.0, end: 0.1 }, blurOut: { start: 0.9, end: 1.0 }, maxBlur: 3.0 }) */
	blurSettings?: BlurSettings;
	/** Optional className for outer container */
	className?: string;
	/** Optional style for outer container */
	style?: React.CSSProperties;
	/** 当前最靠近镜头的图片索引变化时回调（用于行为采集/推荐） */
	onFocusImage?: (imageIndex: number) => void;
}

interface PlaneData {
	index: number;
	z: number;
	imageIndex: number;
	x: number;
	y: number;
}

interface MutableRef<T> {
	current: T;
}

interface GalleryControls {
	velocity: MutableRef<number>;
	autoPlay: MutableRef<boolean>;
	lastInteraction: MutableRef<number>;
	hovered: MutableRef<Set<number>>;
}

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;
const MAX_VELOCITY = 40;

/** 客户端挂载标记：服务端与首次水合为 false，避免读浏览器能力造成不一致 */
const subscribeMounted = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

// Custom shader material for blur, opacity, and cloth folding effects
const createClothMaterial = () => {
	return new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			map: { value: null },
			opacity: { value: 1.0 },
			blurAmount: { value: 0.0 },
			scrollForce: { value: 0.0 },
			time: { value: 0.0 },
			isHovered: { value: 0.0 },
		},
		vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        
        // Create smooth curving based on scroll force
        float curveIntensity = scrollForce * 0.3;
        
        // Base curve across the plane based on distance from center
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        
        // Add gentle cloth-like ripples
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        
        // Flag waving effect when hovered
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          // Create flag-like wave from left to right
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          // Damping effect - stronger wave on the right side (free edge)
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;
          
          // Add secondary smaller waves for more realistic flag motion
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }
        
        // Apply Z displacement for curving effect (inverted) with cloth ripples and flag wave
        pos.z -= (curve + clothEffect + flagWave);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        // Simple blur approximation
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        // Add subtle lighting effect based on curving
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
	});
};

function buildSpatialPositions(count: number): { x: number; y: number }[] {
	const positions: { x: number; y: number }[] = [];
	for (let i = 0; i < count; i++) {
		// Create varied distribution patterns for both axes
		const horizontalAngle = (i * 2.618) % (Math.PI * 2); // Golden angle for natural distribution
		const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2); // Offset angle for vertical

		const horizontalRadius = (i % 3) * 1.2; // Vary the distance from center
		const verticalRadius = ((i + 1) % 4) * 0.8; // Different pattern for vertical

		const x =
			(Math.sin(horizontalAngle) * horizontalRadius * MAX_HORIZONTAL_OFFSET) / 3;
		const y =
			(Math.cos(verticalAngle) * verticalRadius * MAX_VERTICAL_OFFSET) / 4;

		positions.push({ x, y });
	}
	return positions;
}

function createPlanes(
	visibleCount: number,
	totalImages: number,
	positions: { x: number; y: number }[],
): PlaneData[] {
	return Array.from({ length: visibleCount }, (_, i) => ({
		index: i,
		z: visibleCount > 0 ? ((DEFAULT_DEPTH_RANGE / visibleCount) * i) % DEFAULT_DEPTH_RANGE : 0,
		imageIndex: totalImages > 0 ? i % totalImages : 0,
		x: positions[i]?.x ?? 0,
		y: positions[i]?.y ?? 0,
	}));
}

function getTextureAspect(texture: THREE.Texture): number {
	const image = texture.image as { width?: number; height?: number } | undefined;
	if (
		typeof image?.width === 'number' &&
		typeof image?.height === 'number' &&
		image.width > 0 &&
		image.height > 0
	) {
		return image.width / image.height;
	}
	return 1;
}

function GalleryScene({
	images,
	visibleCount = 8,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.15 },
		fadeOut: { start: 0.85, end: 0.95 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.9, end: 1.0 },
		maxBlur: 3.0,
	},
	onFocusImage,
	controls,
}: Omit<InfiniteGalleryProps, 'className' | 'style'> & {
	controls: GalleryControls;
}) {
	const lastFocusedIndex = useRef<number>(-1);
	const meshesRef = useRef<Array<THREE.Mesh | null>>([]);

	// Normalize images to objects
	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	// Load textures (suspends until ready)
	const textures = useTexture(normalizedImages.map((img) => img.src));
	const texturesRef = useRef(textures);

	useEffect(() => {
		texturesRef.current = textures;
	}, [textures]);

	// Create materials pool
	const materials = useMemo(
		() => Array.from({ length: visibleCount }, () => createClothMaterial()),
		[visibleCount]
	);

	// 释放 GPU 资源：材质随 visibleCount 变化回收，纹理在组件卸载时回收
	useEffect(() => {
		return () => {
			materials.forEach((material) => material.dispose());
		};
	}, [materials]);

	useEffect(() => {
		return () => {
			texturesRef.current.forEach((texture) => texture.dispose());
		};
	}, []);

	const spatialPositions = useMemo(
		() => buildSpatialPositions(visibleCount),
		[visibleCount]
	);

	const totalImages = normalizedImages.length;

	// 初始化平面数据；仅在尺寸/图源变化时重建
	const planesData = useRef<PlaneData[]>(
		createPlanes(visibleCount, totalImages, spatialPositions)
	);

	useEffect(() => {
		planesData.current = createPlanes(
			visibleCount,
			totalImages,
			spatialPositions
		);
	}, [spatialPositions, totalImages, visibleCount]);

	useFrame((state, delta) => {
		const dt = Math.min(delta, 0.1);

		// Apply auto-play + damping (frame-rate independent)
		if (controls.autoPlay.current) {
			controls.velocity.current += 0.3 * dt;
		}
		controls.velocity.current *= Math.pow(0.95, dt * 60);
		controls.velocity.current = THREE.MathUtils.clamp(
			controls.velocity.current,
			-MAX_VELOCITY,
			MAX_VELOCITY
		);

		const scrollVelocity = controls.velocity.current;
		const time = state.clock.getElapsedTime();
		const totalRange = DEFAULT_DEPTH_RANGE;
		const imageAdvance =
			totalImages > 0 ? visibleCount % totalImages || totalImages : 0;

		let closestImageIndex = -1;
		let closestDistance = Number.POSITIVE_INFINITY;

		planesData.current.forEach((plane, i) => {
			let newZ = plane.z + scrollVelocity * dt * 10;
			let wrapsForward = 0;
			let wrapsBackward = 0;

			if (newZ >= totalRange) {
				wrapsForward = Math.floor(newZ / totalRange);
				newZ -= totalRange * wrapsForward;
			} else if (newZ < 0) {
				wrapsBackward = Math.ceil(-newZ / totalRange);
				newZ += totalRange * wrapsBackward;
			}

			if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
				plane.imageIndex =
					(plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
			}

			if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
				const step = plane.imageIndex - wrapsBackward * imageAdvance;
				plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
			}

			plane.z = ((newZ % totalRange) + totalRange) % totalRange;
			plane.x = spatialPositions[i]?.x ?? 0;
			plane.y = spatialPositions[i]?.y ?? 0;

			const normalizedPosition = plane.z / totalRange; // 0 to 1
			let opacity = 1;

			if (
				normalizedPosition >= fadeSettings.fadeIn.start &&
				normalizedPosition <= fadeSettings.fadeIn.end
			) {
				const fadeInProgress =
					(normalizedPosition - fadeSettings.fadeIn.start) /
					(fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
				opacity = fadeInProgress;
			} else if (normalizedPosition < fadeSettings.fadeIn.start) {
				opacity = 0;
			} else if (
				normalizedPosition >= fadeSettings.fadeOut.start &&
				normalizedPosition <= fadeSettings.fadeOut.end
			) {
				const fadeOutProgress =
					(normalizedPosition - fadeSettings.fadeOut.start) /
					(fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
				opacity = 1 - fadeOutProgress;
			} else if (normalizedPosition > fadeSettings.fadeOut.end) {
				opacity = 0;
			}

			opacity = Math.max(0, Math.min(1, opacity));

			// 追踪最靠近镜头的图片（worldZ 接近 0）
			const worldZ = plane.z - totalRange / 2;
			const distanceToCamera = Math.abs(worldZ);
			if (opacity > 0.3 && distanceToCamera < closestDistance) {
				closestDistance = distanceToCamera;
				closestImageIndex = plane.imageIndex;
			}

			let blur = 0;

			if (
				normalizedPosition >= blurSettings.blurIn.start &&
				normalizedPosition <= blurSettings.blurIn.end
			) {
				const blurInProgress =
					(normalizedPosition - blurSettings.blurIn.start) /
					(blurSettings.blurIn.end - blurSettings.blurIn.start);
				blur = blurSettings.maxBlur * (1 - blurInProgress);
			} else if (normalizedPosition < blurSettings.blurIn.start) {
				blur = blurSettings.maxBlur;
			} else if (
				normalizedPosition >= blurSettings.blurOut.start &&
				normalizedPosition <= blurSettings.blurOut.end
			) {
				const blurOutProgress =
					(normalizedPosition - blurSettings.blurOut.start) /
					(blurSettings.blurOut.end - blurSettings.blurOut.start);
				blur = blurSettings.maxBlur * blurOutProgress;
			} else if (normalizedPosition > blurSettings.blurOut.end) {
				blur = blurSettings.maxBlur;
			}

			blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

			const mesh = meshesRef.current[i];
			const material = materials[i];
			const texture = textures[plane.imageIndex];

			if (!mesh || !material || !texture) {
				if (mesh) mesh.visible = false;
				return;
			}

			if (material.uniforms.map!.value !== texture) {
				material.uniforms.map!.value = texture;
			}
			const aspect = getTextureAspect(texture);
			if (aspect > 1) {
				mesh.scale.set(2 * aspect, 2, 1);
			} else {
				mesh.scale.set(2, 2 / aspect, 1);
			}
			mesh.position.set(plane.x, plane.y, worldZ);
			mesh.visible = opacity > 0.01;

			material.uniforms.opacity!.value = opacity;
			material.uniforms.blurAmount!.value = blur;
			material.uniforms.time!.value = time;
			material.uniforms.scrollForce!.value = scrollVelocity;
			material.uniforms.isHovered!.value = controls.hovered.current.has(i)
				? 1.0
				: 0.0;
		});

		// 焦点变化回调（用于行为采集）：仅当最靠近镜头的图片索引改变时触发
		if (
			onFocusImage &&
			closestImageIndex >= 0 &&
			closestImageIndex !== lastFocusedIndex.current
		) {
			lastFocusedIndex.current = closestImageIndex;
			onFocusImage(closestImageIndex);
		}
	});

	if (normalizedImages.length === 0) return null;

	return (
		<>
			{Array.from({ length: visibleCount }).map((_, i) => (
				<mesh
					key={i}
					ref={(mesh) => {
						meshesRef.current[i] = mesh;
					}}
					visible={false}
					material={materials[i]}
					onPointerEnter={() => controls.hovered.current.add(i)}
					onPointerLeave={() => controls.hovered.current.delete(i)}
				>
					<planeGeometry args={[1, 1, 32, 32]} />
				</mesh>
			))}
		</>
	);
}

// Fallback component for when WebGL is not available
function FallbackGallery({ images }: { images: ImageItem[] }) {
	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	return (
		<div className="flex h-full flex-col items-center justify-center overflow-y-auto bg-gray-100 p-4">
			<p className="mb-4 text-gray-600">
				您的浏览器不支持WebGL。以下是图片列表：
			</p>
			<div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
				{normalizedImages.map((img, i) => (
					<img
						key={i}
						src={img.src || '/placeholder.svg'}
						alt={img.alt || `作品 ${i + 1}`}
						loading="lazy"
						decoding="async"
						className="h-32 w-full rounded object-cover"
					/>
				))}
			</div>
		</div>
	);
}

export default function InfiniteGallery({
	images,
	speed = 1,
	visibleCount = 8,
	className = 'h-96 w-full',
	style,
	onFocusImage,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.25 },
		fadeOut: { start: 0.4, end: 0.43 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.4, end: 0.43 },
		maxBlur: 8.0,
	},
}: InfiniteGalleryProps) {
	const mounted = useSyncExternalStore(
		subscribeMounted,
		getMounted,
		getServerMounted
	);
	const [webglSupported, setWebglSupported] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const pointerRef = useRef<{ id: number; y: number } | null>(null);

	// 共享控制引用：输入事件与渲染循环读写同一份状态，避免逐帧触发 React 更新
	const velocity = useRef(0);
	const autoPlay = useRef(true);
	const lastInteraction = useRef(0);
	const hovered = useRef<Set<number>>(new Set());
	const controls = useMemo<GalleryControls>(
		() => ({ velocity, autoPlay, lastInteraction, hovered }),
		[]
	);

	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	const markInteraction = useCallback(() => {
		autoPlay.current = false;
		lastInteraction.current = Date.now();
	}, []);

	const pushVelocity = useCallback(
		(delta: number) => {
			velocity.current = THREE.MathUtils.clamp(
				velocity.current + delta,
				-MAX_VELOCITY,
				MAX_VELOCITY
			);
			markInteraction();
		},
		[markInteraction]
	);

	useEffect(() => {
		try {
			const canvas = document.createElement('canvas');
			const gl =
				canvas.getContext('webgl') ||
				canvas.getContext('experimental-webgl');
			if (!gl) {
				// eslint-disable-next-line react-hooks/set-state-in-effect -- 仅在挂载后探测一次 WebGL 能力
				setWebglSupported(false);
			}
		} catch {
			setWebglSupported(false);
		}
	}, []);

	// 滚轮：绑定在画廊容器而非全局 canvas，避免多 canvas 场景误绑
	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			pushVelocity(event.deltaY * 0.01 * speed);
		};
		element.addEventListener('wheel', onWheel, { passive: false });
		return () => element.removeEventListener('wheel', onWheel);
	}, [pushVelocity, speed]);

	// 键盘：忽略输入控件内的方向键
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.isContentEditable ||
					/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
			) {
				return;
			}
			if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
				event.preventDefault();
				pushVelocity(-2 * speed);
			} else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
				event.preventDefault();
				pushVelocity(2 * speed);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [pushVelocity, speed]);

	// 自动播放恢复：3s 无交互后继续
	useEffect(() => {
		const timer = window.setInterval(() => {
			if (Date.now() - lastInteraction.current > 3000) {
				autoPlay.current = true;
			}
		}, 1000);
		return () => window.clearInterval(timer);
	}, []);

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (event.pointerType === 'mouse') return;
			pointerRef.current = { id: event.pointerId, y: event.clientY };
			event.currentTarget.setPointerCapture?.(event.pointerId);
			markInteraction();
		},
		[markInteraction]
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const pointer = pointerRef.current;
			if (!pointer || pointer.id !== event.pointerId) return;
			const dy = event.clientY - pointer.y;
			if (Math.abs(dy) < 2) return;
			pointer.y = event.clientY;
			pushVelocity(dy * 0.08 * speed);
		},
		[pushVelocity, speed]
	);

	const endPointer = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (pointerRef.current?.id !== event.pointerId) return;
			pointerRef.current = null;
			if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}
		},
		[]
	);

	return (
		<div
			ref={containerRef}
			className={`${className} touch-none`}
			style={style}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={endPointer}
			onPointerCancel={endPointer}
		>
			{/* 服务端与首帧可索引内容：保证导出 HTML 有作品文本与首图 */}
			<ul className="sr-only" aria-label="作品列表">
				{normalizedImages.map((img, index) => (
					<li key={`${img.src}-${index}`}>
						{img.alt || `音乐影像作品 ${index + 1}`}
					</li>
				))}
			</ul>

			{!mounted && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0a0908]">
					{normalizedImages[0] && (
						<img
							src={normalizedImages[0].src}
							alt={normalizedImages[0].alt || '作品首图'}
							className="absolute inset-0 h-full w-full object-cover opacity-40"
						/>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
					<p className="relative font-mono text-[10px] tracking-[0.3em] text-white/40">
						作品载入中
					</p>
				</div>
			)}

			{mounted && webglSupported && normalizedImages.length > 0 && (
				<Canvas
					camera={{ position: [0, 0, 0], fov: 55 }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
					}}
					dpr={[1, 2]}
				>
					<Suspense fallback={null}>
						<GalleryScene
							images={images}
							speed={speed}
							visibleCount={visibleCount}
							fadeSettings={fadeSettings}
							blurSettings={blurSettings}
							onFocusImage={onFocusImage}
							controls={controls}
						/>
					</Suspense>
				</Canvas>
			)}

			{mounted && !webglSupported && (
				<FallbackGallery images={images} />
			)}
		</div>
	);
}
