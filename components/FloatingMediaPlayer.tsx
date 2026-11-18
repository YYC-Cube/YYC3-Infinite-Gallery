/**
 * @file 悬浮音视频播放器
 * @description 页面边界悬浮媒体中心：可收起、拖拽、拉伸、缩小；支持本地上传、歌单编辑与内置音乐/影像
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-18
 * @updated 2026-11-18
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
	ChangeEvent,
	DragEvent,
	PointerEvent as ReactPointerEvent,
	SyntheticEvent,
} from 'react';
import {
	Disc3,
	GripVertical,
	ListMusic,
	Maximize2,
	Minimize2,
	Minus,
	Music2,
	Pause,
	Pencil,
	Play,
	Plus,
	Repeat,
	Shuffle,
	SkipBack,
	SkipForward,
	Trash2,
	Upload,
	Video,
	Volume2,
	VolumeX,
} from 'lucide-react';
import {
	BUILTIN_TRACKS,
	DEFAULT_LAYOUT,
	loadPlayerLayout,
	savePlayerLayout,
} from '@/lib/media-store';
import type { MediaTrack, PlayerLayout } from '@/lib/media-store';
import {
	loadMediaFiles,
	removeMediaFile,
	storeMediaFile,
} from '@/lib/media-db';

type MediaKind = 'audio' | 'video';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 260;
const COMPACT_HEIGHT = 208;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const minutes = Math.floor(seconds / 60);
	const rest = Math.floor(seconds % 60);
	return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export default function FloatingMediaPlayer() {
	const [layout, setLayout] = useState<PlayerLayout>(DEFAULT_LAYOUT);
	const [tracks, setTracks] = useState<MediaTrack[]>(BUILTIN_TRACKS);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [activeTab, setActiveTab] = useState<'player' | 'playlist'>('player');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState('');
	const [dragOver, setDragOver] = useState(false);
	const [ready, setReady] = useState(false);

	const audioRef = useRef<HTMLAudioElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const loadedSrcRef = useRef<{ audio: string; video: string }>({
		audio: '',
		video: '',
	});
	const objectUrlsRef = useRef<string[]>([]);
	const tracksRef = useRef(tracks);
	const currentIndexRef = useRef(currentIndex);
	const dragRef = useRef<{
		sx: number;
		sy: number;
		ox: number;
		oy: number;
	} | null>(null);
	const miniDragRef = useRef<{
		sx: number;
		sy: number;
		ox: number;
		oy: number;
		moved: boolean;
	} | null>(null);
	const resizeRef = useRef<{
		sx: number;
		sy: number;
		ow: number;
		oh: number;
	} | null>(null);
	const listDragIndexRef = useRef<number | null>(null);

	tracksRef.current = tracks;
	currentIndexRef.current = currentIndex;

	const currentTrack = tracks[currentIndex];

	/* ========================================
	   初始化：恢复布局与上传曲目
	   ======================================== */
	useEffect(() => {
		const saved = loadPlayerLayout();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const width = clamp(
			saved.w || DEFAULT_LAYOUT.w,
			MIN_WIDTH,
			Math.min(760, viewportWidth - 24)
		);
		const height = clamp(
			saved.h || DEFAULT_LAYOUT.h,
			MIN_HEIGHT,
			Math.min(900, viewportHeight - 24)
		);

		setLayout({
			...saved,
			w: width,
			h: height,
			x: clamp(saved.x || 20, 8, Math.max(8, viewportWidth - width - 8)),
			y:
				saved.y > 0
					? clamp(saved.y, 8, Math.max(8, viewportHeight - 64))
					: Math.max(8, viewportHeight - 104),
		});

		let cancelled = false;
		void loadMediaFiles().then((files) => {
			if (cancelled) return;
			if (files.length > 0) {
				const restored: MediaTrack[] = files.map(({ id, file }) => {
					const isVideo = file.type.startsWith('video/');
					const url = URL.createObjectURL(file);
					objectUrlsRef.current.push(url);
					return {
						id,
						title: file.name.replace(/\.[^.]+$/, ''),
						artist: '本地上传',
						album: isVideo ? '我的影像' : '我的收藏',
						cover:
							BUILTIN_TRACKS[isVideo ? 15 : 0]?.cover ?? '',
						src: url,
						kind: isVideo ? 'video' : 'audio',
						isLocal: true,
					};
				});
				setTracks((previous) => [...previous, ...restored]);
			}
			setReady(true);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(
		() => () => {
			objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
		},
		[]
	);

	useEffect(() => {
		if (ready) savePlayerLayout(layout);
	}, [layout, ready]);

	/* ========================================
	   播放引擎（原生 HTMLMediaElement）
	   ======================================== */
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = layout.volume;
			audioRef.current.muted = layout.muted;
		}
		if (videoRef.current) {
			videoRef.current.volume = layout.volume;
			videoRef.current.muted = layout.muted;
		}
	}, [layout.volume, layout.muted]);

	useEffect(() => {
		const track = tracks[currentIndex];
		if (!track) return;

		const active =
			track.kind === 'video' ? videoRef.current : audioRef.current;
		const inactive =
			track.kind === 'video' ? audioRef.current : videoRef.current;
		inactive?.pause();

		if (!active) return;
		if (loadedSrcRef.current[track.kind] !== track.src) {
			active.src = track.src;
			active.load();
			loadedSrcRef.current[track.kind] = track.src;
			setCurrentTime(0);
			setDuration(0);
		}

		if (isPlaying) {
			void active.play().catch(() => setIsPlaying(false));
		} else {
			active.pause();
		}
	}, [currentIndex, tracks, isPlaying]);

	const goTo = useCallback((index: number, autoPlay = true) => {
		const list = tracksRef.current;
		if (list.length === 0) return;
		const next = ((index % list.length) + list.length) % list.length;

		if (next === currentIndexRef.current) {
			const track = list[next];
			const element =
				track?.kind === 'video' ? videoRef.current : audioRef.current;
			if (element) {
				element.currentTime = 0;
				if (autoPlay) void element.play().catch(() => undefined);
			}
			setIsPlaying(autoPlay);
			return;
		}

		setCurrentIndex(next);
		setIsPlaying(autoPlay);
	}, []);

	const togglePlay = useCallback(() => {
		const track = tracksRef.current[currentIndexRef.current];
		if (!track) return;
		const element =
			track.kind === 'video' ? videoRef.current : audioRef.current;
		if (!element) return;

		if (element.paused) {
			void element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
		} else {
			element.pause();
			setIsPlaying(false);
		}
	}, []);

	const handleEnded = useCallback(() => {
		const list = tracksRef.current;
		if (list.length === 0) return;
		const index = currentIndexRef.current;

		if (layout.repeat === 'one') {
			const track = list[index];
			const element =
				track?.kind === 'video' ? videoRef.current : audioRef.current;
			if (element) {
				element.currentTime = 0;
				void element.play().catch(() => undefined);
			}
			return;
		}

		let next = index + 1;
		if (next >= list.length) {
			if (layout.repeat === 'off') {
				setIsPlaying(false);
				return;
			}
			next = 0;
		}
		if (layout.shuffle && list.length > 1) {
			next = Math.floor(Math.random() * list.length);
		}
		goTo(next);
	}, [layout.repeat, layout.shuffle, goTo]);

	const mediaEventHandler = (kind: MediaKind) => ({
		onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => {
			if (tracksRef.current[currentIndexRef.current]?.kind !== kind) return;
			setCurrentTime(event.currentTarget.currentTime);
		},
		onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => {
			if (tracksRef.current[currentIndexRef.current]?.kind !== kind) return;
			if (Number.isFinite(event.currentTarget.duration)) {
				setDuration(event.currentTarget.duration);
			}
		},
		onPlay: () => {
			if (tracksRef.current[currentIndexRef.current]?.kind === kind) {
				setIsPlaying(true);
			}
		},
		onPause: () => {
			if (tracksRef.current[currentIndexRef.current]?.kind === kind) {
				setIsPlaying(false);
			}
		},
		onEnded: handleEnded,
	});

	const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
		const time = Number(event.target.value);
		const element =
			currentTrack?.kind === 'video' ? videoRef.current : audioRef.current;
		if (element) {
			element.currentTime = time;
			setCurrentTime(time);
		}
	};

	/* ========================================
	   本地上传与歌单编辑
	   ======================================== */
	const handleFiles = useCallback(async (files: FileList | File[]) => {
		const usable = Array.from(files).filter(
			(file) =>
				file.type.startsWith('audio/') || file.type.startsWith('video/')
		);
		if (usable.length === 0) return;

		const startIndex = tracksRef.current.length;
		const added: MediaTrack[] = [];
		for (const file of usable) {
			const isVideo = file.type.startsWith('video/');
			const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const url = URL.createObjectURL(file);
			objectUrlsRef.current.push(url);
			await storeMediaFile(id, file);
			added.push({
				id,
				title: file.name.replace(/\.[^.]+$/, ''),
				artist: '本地上传',
				album: isVideo ? '我的影像' : '我的收藏',
				cover: BUILTIN_TRACKS[isVideo ? 15 : 0]?.cover ?? '',
				src: url,
				kind: isVideo ? 'video' : 'audio',
				isLocal: true,
			});
		}

		setTracks((previous) => [...previous, ...added]);
		setCurrentIndex(startIndex);
		setIsPlaying(true);
		setActiveTab('player');
	}, []);

	const handleRemoveTrack = useCallback(async (id: string) => {
		const index = tracksRef.current.findIndex((track) => track.id === id);
		const target = tracksRef.current[index];
		if (!target) return;

		if (target.isLocal) {
			await removeMediaFile(id);
			URL.revokeObjectURL(target.src);
			objectUrlsRef.current = objectUrlsRef.current.filter(
				(url) => url !== target.src
			);
		}

		const remaining = tracksRef.current.filter((track) => track.id !== id);
		setTracks(remaining);
		if (index === currentIndexRef.current) {
			setCurrentIndex(Math.min(index, Math.max(0, remaining.length - 1)));
			setIsPlaying(false);
		} else if (index < currentIndexRef.current) {
			setCurrentIndex((value) => value - 1);
		}
	}, []);

	const commitEdit = useCallback(() => {
		if (!editingId) return;
		const title = editValue.trim();
		if (title) {
			setTracks((previous) =>
				previous.map((track) =>
					track.id === editingId ? { ...track, title } : track
				)
			);
		}
		setEditingId(null);
	}, [editingId, editValue]);

	const handleListDrop = (event: DragEvent<HTMLDivElement>, target: number) => {
		event.preventDefault();
		const from = listDragIndexRef.current;
		listDragIndexRef.current = null;
		if (from === null || from === target) return;

		setTracks((previous) => {
			const next = [...previous];
			const [moved] = next.splice(from, 1);
			if (!moved) return previous;
			next.splice(target, 0, moved);
			return next;
		});
		setCurrentIndex((index) => {
			if (index === from) return target;
			if (from < index && index <= target) return index - 1;
			if (target < index && index <= from) return index + 1;
			return index;
		});
	};

	/* ========================================
	   拖拽 / 拉伸 / 收起 / 缩小
	   ======================================== */
	const openPanel = useCallback(() => {
		setLayout((previous) => {
			const width = Math.min(previous.w, window.innerWidth - 16);
			const height = Math.min(
				previous.compact ? COMPACT_HEIGHT : previous.h,
				window.innerHeight - 16
			);
			return {
				...previous,
				mode: 'panel',
				x: clamp(previous.x, 8, Math.max(8, window.innerWidth - width - 8)),
				y: clamp(previous.y, 8, Math.max(8, window.innerHeight - height - 8)),
			};
		});
	}, []);

	const collapsePanel = useCallback(() => {
		setLayout((previous) => ({
			...previous,
			mode: 'collapsed',
			x: clamp(previous.x, 8, Math.max(8, window.innerWidth - 64)),
			y: clamp(previous.y, 8, Math.max(8, window.innerHeight - 64)),
		}));
	}, []);

	const onHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if ((event.target as HTMLElement).closest('button')) return;
		dragRef.current = {
			sx: event.clientX,
			sy: event.clientY,
			ox: layout.x,
			oy: layout.y,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag) return;
		const width = layout.w;
		const height = layout.compact ? COMPACT_HEIGHT : layout.h;
		setLayout((previous) => ({
			...previous,
			x: clamp(
				drag.ox + event.clientX - drag.sx,
				4,
				Math.max(4, window.innerWidth - width - 4)
			),
			y: clamp(
				drag.oy + event.clientY - drag.sy,
				4,
				Math.max(4, window.innerHeight - height - 4)
			),
		}));
	};

	const onHeaderPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		dragRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const onMiniPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
		miniDragRef.current = {
			sx: event.clientX,
			sy: event.clientY,
			ox: layout.x,
			oy: layout.y,
			moved: false,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onMiniPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
		const drag = miniDragRef.current;
		if (!drag) return;
		const dx = event.clientX - drag.sx;
		const dy = event.clientY - drag.sy;
		if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
		if (!drag.moved) return;
		setLayout((previous) => ({
			...previous,
			x: clamp(drag.ox + dx, 4, Math.max(4, window.innerWidth - 60)),
			y: clamp(drag.oy + dy, 4, Math.max(4, window.innerHeight - 60)),
		}));
	};

	const onMiniPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
		const drag = miniDragRef.current;
		miniDragRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		if (drag && !drag.moved) openPanel();
	};

	const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.stopPropagation();
		resizeRef.current = {
			sx: event.clientX,
			sy: event.clientY,
			ow: layout.w,
			oh: layout.h,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const resize = resizeRef.current;
		if (!resize) return;
		setLayout((previous) => ({
			...previous,
			w: clamp(
				resize.ow + event.clientX - resize.sx,
				MIN_WIDTH,
				Math.min(760, window.innerWidth - previous.x - 8)
			),
			h: clamp(
				resize.oh + event.clientY - resize.sy,
				MIN_HEIGHT,
				Math.min(900, window.innerHeight - previous.y - 8)
			),
		}));
	};

	const onResizePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		resizeRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	if (!ready) return null;

	const audioEvents = mediaEventHandler('audio');
	const videoEvents = mediaEventHandler('video');
	const repeatActive = layout.repeat !== 'off';

	return (
		<>
			{/* 收起态：边界悬浮入口（与设置键同一交互层级） */}
			{layout.mode === 'collapsed' && (
				<button
					type="button"
					onClick={(event) => event.preventDefault()}
					onPointerDown={onMiniPointerDown}
					onPointerMove={onMiniPointerMove}
					onPointerUp={onMiniPointerUp}
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') openPanel();
					}}
					className="fixed z-[9000] w-14 h-14 rounded-full glass-effect
					           flex items-center justify-center group select-none
					           touch-none cursor-grab active:cursor-grabbing
					           transition-transform duration-300 hover:scale-110
					           animate-pulse-glow"
					style={{ left: layout.x, top: layout.y }}
					aria-label="打开音乐影像播放器"
					title="D·Music · 音乐 / 影像"
				>
					{currentTrack?.cover && (
						<img
							src={currentTrack.cover}
							alt=""
							draggable={false}
							className="absolute inset-0 w-full h-full rounded-full object-cover opacity-40 pointer-events-none"
						/>
					)}
					<span className="relative text-white/80 group-hover:text-white">
						{isPlaying ? <Pause size={18} /> : <Music2 size={20} />}
					</span>
				</button>
			)}

			{/* 展开态：可拖拽、可拉伸的悬浮面板 */}
			<div
				className="fixed z-[9000] flex flex-col overflow-hidden rounded-2xl
				           glass-effect shadow-2xl touch-none"
				style={{
					left: layout.x,
					top: layout.y,
					width: layout.w,
					height: layout.compact ? COMPACT_HEIGHT : layout.h,
					opacity: layout.mode === 'panel' ? 1 : 0,
					visibility: layout.mode === 'panel' ? 'visible' : 'hidden',
					pointerEvents: layout.mode === 'panel' ? 'auto' : 'none',
					}}
				onDragOver={(event) => {
					if (!event.dataTransfer.types.includes('Files')) return;
					event.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
						setDragOver(false);
					}
				}}
				onDrop={(event) => {
					event.preventDefault();
					setDragOver(false);
					void handleFiles(event.dataTransfer.files);
				}}
			>
				{/* 拖拽手柄 / 标题栏 */}
				<div
					onPointerDown={onHeaderPointerDown}
					onPointerMove={onHeaderPointerMove}
					onPointerUp={onHeaderPointerUp}
					onPointerCancel={onHeaderPointerUp}
					className="flex items-center gap-2 px-3 py-2 shrink-0
					           border-b border-warm/15 cursor-grab active:cursor-grabbing"
				>
					<GripVertical size={14} className="text-warm-primary/50 shrink-0" />
					<Disc3
						size={15}
						className={`shrink-0 text-warm-primary ${isPlaying ? 'animate-spin' : ''}`}
						style={{ animationDuration: '4s' }}
					/>
					<span className="flex-1 min-w-0 text-[11px] font-mono tracking-[0.22em] text-white/60 truncate">
						D·MUSIC
					</span>
					<button
						type="button"
						onClick={() =>
							setLayout((previous) => ({ ...previous, compact: !previous.compact }))
						}
						className="w-6 h-6 rounded-md flex items-center justify-center text-white/45 hover:text-white transition-colors"
						aria-label={layout.compact ? '展开播放器' : '缩小播放器'}
						title={layout.compact ? '展开' : '缩小'}
					>
						{layout.compact ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
					</button>
					<button
						type="button"
						onClick={collapsePanel}
						className="w-6 h-6 rounded-md flex items-center justify-center text-white/45 hover:text-white transition-colors"
						aria-label="收起播放器"
						title="收起"
					>
						<Minus size={15} />
					</button>
				</div>

				{/* 标签栏 */}
				{!layout.compact && (
					<div className="flex items-center gap-1 px-3 pt-2 shrink-0">
						<button
							type="button"
							onClick={() => setActiveTab('player')}
							className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
								activeTab === 'player'
									? 'bg-warm/15 text-warm-primary'
									: 'text-white/40 hover:text-white/70'
							}`}
						>
							<Music2 size={12} /> 播放
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('playlist')}
							className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
								activeTab === 'playlist'
									? 'bg-warm/15 text-warm-primary'
									: 'text-white/40 hover:text-white/70'
							}`}
						>
							<ListMusic size={12} /> 歌单 {tracks.length}
						</button>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/45 hover:text-warm-primary transition-colors"
							title="上传本地音乐 / 影像"
						>
							<Upload size={12} /> 上传
						</button>
					</div>
				)}

				{/* 拖拽上传遮罩 */}
				{dragOver && (
					<div className="absolute inset-0 z-20 m-1 rounded-xl border-2 border-dashed border-warm/50 bg-[#0a0908]/85 flex items-center justify-center pointer-events-none">
						<span className="text-xs tracking-widest text-warm-primary">
							松开以导入本地音乐 / 影像
						</span>
					</div>
				)}

				<div className="relative flex-1 min-h-0">
					{/* 紧凑模式 */}
					{layout.compact && (
						<div className="absolute inset-0 flex items-center gap-3 px-3 overflow-hidden">
							{currentTrack?.cover && (
								<img
									src={currentTrack.cover}
									alt=""
									className="w-14 h-14 rounded-lg object-cover opacity-80 shrink-0"
								/>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-xs text-white/85 truncate">
									{currentTrack?.title ?? '暂无曲目'}
								</p>
								<p className="text-[9px] font-mono text-white/35 mt-0.5">
									{formatTime(currentTime)} / {formatTime(duration)}
								</p>
								<input
									type="range"
									min={0}
									max={duration || 0}
									step={0.1}
									value={Math.min(currentTime, duration || 0)}
									onChange={handleSeek}
									className="media-slider w-full mt-1.5"
									aria-label="播放进度"
								/>
							</div>
							<button
								type="button"
								onClick={togglePlay}
								className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-warm-primary/20 border border-warm/35 text-warm-primary hover:bg-warm-primary/30 transition-colors"
								aria-label={isPlaying ? '暂停' : '播放'}
							>
								{isPlaying ? <Pause size={15} /> : <Play size={15} />}
							</button>
							<button
								type="button"
								onClick={() => goTo(currentIndex + 1)}
								className="text-white/45 hover:text-white transition-colors shrink-0"
								aria-label="下一首"
							>
								<SkipForward size={16} />
							</button>
						</div>
					)}

					{/* 完整播放视图（常驻挂载，切换视图/收起时播放不中断） */}
					<div
						className={`absolute inset-0 flex flex-col items-center px-4 py-3 gap-2.5 overflow-hidden ${
							layout.compact || activeTab !== 'player'
								? 'invisible pointer-events-none'
								: ''
						}`}
					>
						<div className="relative w-full flex-1 min-h-0 max-h-[44%] rounded-xl overflow-hidden bg-black/30 border border-warm/10 flex items-center justify-center">
							<audio ref={audioRef} preload="metadata" {...audioEvents} />
							<video
								ref={videoRef}
								preload="metadata"
								playsInline
								{...videoEvents}
								className={
									currentTrack?.kind === 'video'
										? 'w-full h-full object-contain'
										: 'hidden'
								}
							/>
							{currentTrack?.kind !== 'video' && currentTrack?.cover && (
								<img
									src={currentTrack.cover}
									alt={currentTrack.title}
									className="absolute inset-0 w-full h-full object-cover opacity-85"
								/>
							)}
						</div>

						<div className="w-full text-center shrink-0">
							<p className="text-sm text-white/85 truncate">
								{currentTrack?.title ?? '暂无曲目'}
							</p>
							<p className="text-[10px] font-mono tracking-wider text-white/35 mt-0.5 truncate">
								{currentTrack?.artist} · {currentTrack?.album}
							</p>
						</div>

						<div className="w-full shrink-0 space-y-1">
							<input
								type="range"
								min={0}
								max={duration || 0}
								step={0.1}
								value={Math.min(currentTime, duration || 0)}
								onChange={handleSeek}
								className="media-slider w-full"
								aria-label="播放进度"
							/>
							<div className="flex justify-between text-[9px] font-mono text-white/30">
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(duration)}</span>
							</div>
						</div>

						<div className="flex items-center justify-center gap-3 shrink-0">
							<button
								type="button"
								onClick={() =>
									setLayout((previous) => ({ ...previous, shuffle: !previous.shuffle }))
								}
								className={layout.shuffle ? 'text-warm-primary' : 'text-white/35 hover:text-white'}
								aria-label="随机播放"
							>
								<Shuffle size={14} />
							</button>
							<button
								type="button"
								onClick={() => goTo(currentIndex - 1)}
								className="text-white/60 hover:text-white transition-colors"
								aria-label="上一首"
							>
								<SkipBack size={17} />
							</button>
							<button
								type="button"
								onClick={togglePlay}
								className="w-10 h-10 rounded-full flex items-center justify-center bg-warm-primary/20 border border-warm/40 text-warm-primary hover:bg-warm-primary/30 transition-colors"
								aria-label={isPlaying ? '暂停' : '播放'}
							>
								{isPlaying ? <Pause size={18} /> : <Play size={18} />}
							</button>
							<button
								type="button"
								onClick={() => goTo(currentIndex + 1)}
								className="text-white/60 hover:text-white transition-colors"
								aria-label="下一首"
							>
								<SkipForward size={17} />
							</button>
							<button
								type="button"
								onClick={() =>
									setLayout((previous) => ({
										...previous,
										repeat:
											previous.repeat === 'off'
												? 'all'
												: previous.repeat === 'all'
													? 'one'
													: 'off',
									}))
								}
								className={repeatActive ? 'text-warm-primary' : 'text-white/35 hover:text-white'}
								aria-label="循环模式"
								title={layout.repeat}
							>
								<Repeat size={14} />
							</button>
						</div>

						<div className="flex items-center gap-2 w-full shrink-0">
							<button
								type="button"
								onClick={() =>
									setLayout((previous) => ({ ...previous, muted: !previous.muted }))
								}
								className="text-white/45 hover:text-white transition-colors"
								aria-label={layout.muted ? '取消静音' : '静音'}
							>
								{layout.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
							</button>
							<input
								type="range"
								min={0}
								max={1}
								step={0.01}
								value={layout.volume}
								onChange={(event) =>
									setLayout((previous) => ({
										...previous,
										volume: Number(event.target.value),
										muted: false,
									}))
								}
								className="media-slider flex-1"
								aria-label="音量"
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex items-center gap-1 text-[10px] text-white/45 hover:text-warm-primary transition-colors"
							>
								<Plus size={12} /> 本地添加
							</button>
						</div>
					</div>

					{/* 歌单编辑视图 */}
					{!layout.compact && activeTab === 'playlist' && (
						<div className="absolute inset-0 overflow-y-auto touch-pan-y px-2 py-2 space-y-1">
							{tracks.map((track, index) => (
								<div
									key={track.id}
									draggable
									onDragStart={(event) => {
										listDragIndexRef.current = index;
										event.dataTransfer.effectAllowed = 'move';
									}}
									onDragOver={(event) => event.preventDefault()}
									onDrop={(event) => handleListDrop(event, index)}
									onClick={() => goTo(index)}
									className={`group flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
										index === currentIndex
											? 'bg-warm/15 border-warm/25'
											: 'border-transparent hover:bg-white/5'
									}`}
								>
									<GripVertical size={12} className="text-white/20 shrink-0" />
									{track.cover ? (
										<img
											src={track.cover}
											alt=""
											draggable={false}
											className="w-8 h-8 rounded object-cover opacity-80 shrink-0"
										/>
									) : null}
									<div className="min-w-0 flex-1">
										{editingId === track.id ? (
											<input
												autoFocus
												value={editValue}
												onChange={(event) => setEditValue(event.target.value)}
												onBlur={commitEdit}
												onKeyDown={(event) => {
													if (event.key === 'Enter') commitEdit();
													if (event.key === 'Escape') setEditingId(null);
												}}
												onClick={(event) => event.stopPropagation()}
												className="w-full bg-transparent border-b border-warm/40 text-xs text-white outline-none"
												aria-label="编辑曲目名称"
											/>
										) : (
											<p className="text-xs text-white/80 truncate">{track.title}</p>
										)}
										<p className="flex items-center gap-1 text-[9px] text-white/30 truncate mt-0.5">
											{track.kind === 'video' ? (
												<Video size={9} />
											) : (
												<Music2 size={9} />
											)}
											{track.artist}
										</p>
									</div>
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											setEditingId(track.id);
											setEditValue(track.title);
										}}
										className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-warm-primary transition-all"
										aria-label="编辑名称"
									>
										<Pencil size={12} />
									</button>
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											void handleRemoveTrack(track.id);
										}}
										className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all"
										aria-label="移除曲目"
									>
										<Trash2 size={12} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* 拉伸手柄 */}
				{!layout.compact && (
					<div
						onPointerDown={onResizePointerDown}
						onPointerMove={onResizePointerMove}
						onPointerUp={onResizePointerUp}
						onPointerCancel={onResizePointerUp}
						className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1"
						title="拖拽拉伸"
					>
						<span className="text-[10px] leading-none text-warm-primary/50 select-none">
							◢
						</span>
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept="audio/*,video/*"
					multiple
					className="hidden"
					onChange={(event) => {
						if (event.target.files) void handleFiles(event.target.files);
						event.target.value = '';
					}}
				/>
			</div>
		</>
	);
}
