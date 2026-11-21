/**
 * @file 媒体空间状态单元测试
 * @description 覆盖会话窗口、播放控制、队列、持久化恢复与实例上限
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-21
 */

jest.mock("../host-bridge", () => ({
  hostStorageSet: jest.fn().mockResolvedValue(undefined),
}));

type StoreModule = typeof import("../media-space/store");

const AUDIO_ID = "audio-main";
const VIDEO_ID = "video-main";
const STORAGE_KEY = "yyc3-media-space-v1";

let store: StoreModule;

async function loadStore(): Promise<StoreModule> {
  jest.resetModules();
  return import("../media-space/store");
}

beforeEach(async () => {
  jest.useFakeTimers();
  window.localStorage.clear();
  store = await loadStore();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("media-space store 默认状态", () => {
  test("应包含音频与视频主会话且默认拆分打开", () => {
    const state = store.getMediaSpaceSnapshot();
    expect(state.version).toBe(1);
    expect(state.isOpen).toBe(true);
    expect(state.mode).toBe("split");
    expect(state.order).toEqual([AUDIO_ID, VIDEO_ID]);
    expect(state.sessions[AUDIO_ID]?.kind).toBe("audio");
    expect(state.sessions[VIDEO_ID]?.kind).toBe("video");
    expect(state.activeSessionId).toBe(VIDEO_ID);
  });

  test("getSessionTrack 应返回当前曲目", () => {
    const session = store.getMediaSpaceSnapshot().sessions[VIDEO_ID]!;
    expect(store.getSessionTrack(session)?.id).toBe(session.currentTrackId);
  });
});

describe("空间开关与布局", () => {
  test("setSpaceOpen 应切换打开状态", () => {
    store.setSpaceOpen(false);
    expect(store.getMediaSpaceSnapshot().isOpen).toBe(false);
    store.setSpaceOpen(true);
    expect(store.getMediaSpaceSnapshot().isOpen).toBe(true);
  });

  test("setSpaceMode 拆分时应按桌面宽度排布窗口", () => {
    store.setSpaceMode("unified");
    expect(store.getMediaSpaceSnapshot().mode).toBe("unified");

    store.setSpaceMode("split");
    const state = store.getMediaSpaceSnapshot();
    expect(state.mode).toBe("split");
    expect(state.sessions[AUDIO_ID]?.frame.x).toBe(20);
    expect(state.sessions[AUDIO_ID]?.frame.h).toBeGreaterThan(0);
    expect(state.sessions[VIDEO_ID]?.frame.x).toBeGreaterThan(300);
  });

  test("移动端宽度下拆分模式不应重排窗口", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      value: 500,
      configurable: true,
    });
    try {
      const before = store.getMediaSpaceSnapshot().sessions[VIDEO_ID]!.frame;
      store.setSpaceMode("split");
      const after = store.getMediaSpaceSnapshot().sessions[VIDEO_ID]!.frame;
      expect(after).toEqual(before);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        value: originalWidth,
        configurable: true,
      });
    }
  });

  test("syncSpaceMode 应同步布局但不强制打开空间", () => {
    store.setSpaceOpen(false);
    const before = store.getMediaSpaceSnapshot();
    store.syncSpaceMode("split");
    // 模式未变化时不产生新快照
    expect(store.getMediaSpaceSnapshot()).toBe(before);

    store.syncSpaceMode("unified");
    const unified = store.getMediaSpaceSnapshot();
    expect(unified.mode).toBe("unified");
    expect(unified.isOpen).toBe(false);

    store.syncSpaceMode("split");
    const split = store.getMediaSpaceSnapshot();
    expect(split.mode).toBe("split");
    expect(split.sessions[AUDIO_ID]?.frame.x).toBe(20);
  });

  test("focusSession 应提升层级并设为活动会话", () => {
    const before = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.frame.z;
    store.focusSession(AUDIO_ID);
    const state = store.getMediaSpaceSnapshot();
    expect(state.activeSessionId).toBe(AUDIO_ID);
    expect(state.sessions[AUDIO_ID]?.frame.z).toBeGreaterThan(before);
  });
});

describe("会话控制", () => {
  test("播放状态、帧、音量与静音应同步", () => {
    store.toggleSessionPlaying(AUDIO_ID);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.isPlaying).toBe(true);
    store.setSessionPlaying(AUDIO_ID, false);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.isPlaying).toBe(false);

    store.setSessionFrame(AUDIO_ID, { x: 120, y: 88, w: 320, h: 400 });
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.frame.x).toBe(120);

    store.setSessionVolume(AUDIO_ID, 2);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.volume).toBe(1);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.muted).toBe(false);

    store.setSessionMuted(AUDIO_ID, true);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.muted).toBe(true);

    store.setSessionSkin(AUDIO_ID, "minimal");
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.skin).toBe("minimal");
  });

  test("setSessionTime 应更新进度并接受可选时长", () => {
    store.setSessionTime(AUDIO_ID, 12.5, 180);
    const session = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!;
    expect(session.currentTime).toBe(12.5);
    expect(session.duration).toBe(180);

    store.setSessionTime(AUDIO_ID, Number.NaN);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.currentTime).toBe(0);
  });

  test("setSessionVideoMetrics 应根据宽高判断方向并忽略非法值", () => {
    store.setSessionVideoMetrics(VIDEO_ID, 720, 1280);
    expect(
      store.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.orientation,
    ).toBe("portrait");

    store.setSessionVideoMetrics(VIDEO_ID, 1920, 1080);
    expect(
      store.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.orientation,
    ).toBe("landscape");

    store.setSessionVideoMetrics(VIDEO_ID, 0, 0);
    expect(
      store.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.orientation,
    ).toBe("landscape");
  });

  test("setSessionWindow 应统一切换窗口状态且跨容器独立", () => {
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.windowState).toBe(
      "normal",
    );

    store.setSessionWindow(AUDIO_ID, "minimized");
    store.setSessionWindow(VIDEO_ID, "maximized");
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.windowState).toBe(
      "minimized",
    );
    expect(store.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.windowState).toBe(
      "maximized",
    );

    store.setSessionWindow(VIDEO_ID, "normal");
    expect(store.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.windowState).toBe(
      "normal",
    );
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.windowState).toBe(
      "minimized",
    );
  });

  test("restoreAllWindows 应一次性还原所有最小化与最大化容器", () => {
    store.setSessionWindow(AUDIO_ID, "minimized");
    store.setSessionWindow(VIDEO_ID, "maximized");

    store.restoreAllWindows();

    const state = store.getMediaSpaceSnapshot();
    expect(state.sessions[AUDIO_ID]?.windowState).toBe("normal");
    expect(state.sessions[VIDEO_ID]?.windowState).toBe("normal");
  });

  test("窗口状态应随持久化恢复且非法值回落为 normal", async () => {
    store.setSessionWindow(AUDIO_ID, "minimized");
    await jest.advanceTimersByTimeAsync(1000);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).sessions[AUDIO_ID].windowState).toBe(
      "minimized",
    );

    const persisted = JSON.parse(raw as string);
    persisted.sessions[VIDEO_ID].windowState = "bogus";
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const reloaded = await loadStore();
    expect(reloaded.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.windowState).toBe(
      "minimized",
    );
    expect(reloaded.getMediaSpaceSnapshot().sessions[VIDEO_ID]?.windowState).toBe(
      "normal",
    );
  });
});

describe("队列与播放模式", () => {
  test("selectTrack 应切换曲目并从零开始", () => {
    store.selectTrack(AUDIO_ID, "builtin-audio-2", false);
    const session = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!;
    expect(session.currentTrackId).toBe("builtin-audio-2");
    expect(session.currentTime).toBe(0);
    expect(session.isPlaying).toBe(false);
  });

  test("stepTrack 应前后循环切换", () => {
    const queue = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.queue;
    store.selectTrack(AUDIO_ID, queue[0]!.id, false);
    store.stepTrack(AUDIO_ID, -1, false);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.currentTrackId).toBe(
      queue[queue.length - 1]?.id,
    );
    store.stepTrack(AUDIO_ID, 1, false);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.currentTrackId).toBe(
      queue[0]?.id,
    );
  });

  test("随机播放应选择不同曲目", () => {
    store.toggleShuffle(AUDIO_ID);
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);
    try {
      store.stepTrack(AUDIO_ID, 1, false);
      const session = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!;
      expect(session.currentTrackId).not.toBe("builtin-audio-0");
    } finally {
      randomSpy.mockRestore();
    }
  });

  test("循环模式应按 off → all → one 轮转", () => {
    const read = () => store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.repeat;
    expect(read()).toBe("all");
    store.cycleRepeat(AUDIO_ID);
    expect(read()).toBe("one");
    store.cycleRepeat(AUDIO_ID);
    expect(read()).toBe("off");
    store.cycleRepeat(AUDIO_ID);
    expect(read()).toBe("all");
  });

  test("单曲循环结束时回到起点并继续播放", () => {
    store.cycleRepeat(AUDIO_ID); // all -> one
    store.setSessionPlaying(AUDIO_ID, true);
    store.setSessionTime(AUDIO_ID, 30);
    store.handleSessionEnded(AUDIO_ID);
    const session = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!;
    expect(session.currentTime).toBe(0);
    expect(session.isPlaying).toBe(true);
  });

  test("列表循环结束时切到下一首", () => {
    const queue = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.queue;
    store.selectTrack(AUDIO_ID, queue[queue.length - 1]!.id, true);
    store.handleSessionEnded(AUDIO_ID);
    const session = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!;
    expect(session.currentTrackId).toBe(queue[0]?.id);
    expect(session.isPlaying).toBe(true);
  });

  test("不循环时最后一首结束应停止播放", () => {
    const queue = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.queue;
    store.cycleRepeat(AUDIO_ID); // all -> one
    store.cycleRepeat(AUDIO_ID); // one -> off
    store.selectTrack(AUDIO_ID, queue[queue.length - 1]!.id, true);
    store.handleSessionEnded(AUDIO_ID);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]?.isPlaying).toBe(false);
  });

  test("appendTracks 与 ensureLocalTrack 应去重追加", () => {
    const localTrack = {
      id: "local-a",
      title: "本地",
      artist: "我",
      album: "本地",
      cover: "",
      src: "blob:local-a",
      kind: "audio" as const,
      isLocal: true,
    };
    store.ensureLocalTrack(AUDIO_ID, localTrack);
    store.ensureLocalTrack(AUDIO_ID, localTrack);
    const queue = store.getMediaSpaceSnapshot().sessions[AUDIO_ID]!.queue;
    expect(queue.filter((track) => track.id === "local-a")).toHaveLength(1);

    store.appendTracks(AUDIO_ID, [{ ...localTrack, id: "local-b" }], false);
    expect(
      store
        .getMediaSpaceSnapshot()
        .sessions[AUDIO_ID]!.queue.some((track) => track.id === "local-b"),
    ).toBe(true);
  });
});

describe("多视频实例", () => {
  test("最多允许 4 个视频实例且可移除", () => {
    const created = [
      store.addVideoSession(),
      store.addVideoSession(),
      store.addVideoSession(),
    ];
    expect(created.every((id) => typeof id === "string")).toBe(true);
    expect(store.addVideoSession()).toBeNull();

    const state = store.getMediaSpaceSnapshot();
    const videoCount = state.order.filter(
      (id) => state.sessions[id]?.kind === "video",
    ).length;
    expect(videoCount).toBe(4);

    store.removeSession(VIDEO_ID);
    expect(store.getMediaSpaceSnapshot().sessions[VIDEO_ID]).toBeUndefined();
  });

  test("不允许移除最后一个视频实例或音频主会话", () => {
    expect(store.addVideoSession()).not.toBeNull();
    // 先移除初始视频，保留新增视频
    const created = store.getMediaSpaceSnapshot().order.find(
      (id) => id.startsWith("video-") && id !== VIDEO_ID,
    )!;
    store.removeSession(VIDEO_ID);
    store.removeSession(created);
    expect(store.getMediaSpaceSnapshot().sessions[VIDEO_ID]).toBeUndefined();

    const remainingVideo = store
      .getMediaSpaceSnapshot()
      .order.find((id) => store.getMediaSpaceSnapshot().sessions[id]?.kind === "video")!;
    store.removeSession(remainingVideo);
    expect(store.getMediaSpaceSnapshot().sessions[remainingVideo]).toBeDefined();

    store.removeSession(AUDIO_ID);
    expect(store.getMediaSpaceSnapshot().sessions[AUDIO_ID]).toBeDefined();
  });
});

describe("持久化与恢复", () => {
  test("状态变更应在防抖后写入 localStorage 并过滤本地曲目", () => {
    store.setSpaceOpen(false);
    jest.advanceTimersByTime(900);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      isOpen: boolean;
      sessions: Record<string, { isPlaying: boolean; queue: unknown[] }>;
    };
    expect(parsed.isOpen).toBe(false);
    expect(parsed.sessions[AUDIO_ID]?.isPlaying).toBe(false);
  });

  test("应从持久化数据恢复并做边界校验", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        isOpen: false,
        mode: "unified",
        sessions: {
          [AUDIO_ID]: {
            id: AUDIO_ID,
            kind: "audio",
            label: "恢复音频",
            queue: [
              {
                id: "restored-audio",
                title: "恢复曲目",
                artist: "A",
                album: "B",
                cover: "",
                src: "/restored.mp3",
                kind: "audio",
              },
              {
                id: "local-restored",
                title: "本地",
                artist: "A",
                album: "B",
                cover: "",
                src: "blob:local",
                kind: "audio",
                isLocal: true,
              },
            ],
            currentTrackId: "restored-audio",
            currentTime: 12,
            duration: 200,
            isPlaying: true,
            volume: 3,
            muted: false,
            repeat: "off",
            shuffle: true,
            skin: "minimal",
            orientation: "portrait",
            frame: { x: 12, y: 34, w: 120, h: 90, z: 9 },
          },
          "invalid-session": {
            id: "invalid-session",
            kind: "image",
          },
        },
        order: [AUDIO_ID, "invalid-session"],
        activeSessionId: AUDIO_ID,
      }),
    );

    store = await loadStore();
    const state = store.getMediaSpaceSnapshot();
    const audio = state.sessions[AUDIO_ID]!;
    expect(state.isOpen).toBe(false);
    expect(state.mode).toBe("unified");
    expect(state.sessions["invalid-session"]).toBeUndefined();
    expect(audio.volume).toBe(1);
    expect(audio.frame.w).toBe(260);
    expect(audio.frame.h).toBe(180);
    expect(audio.queue).toHaveLength(1);
    expect(audio.isPlaying).toBe(false);
    expect(state.activeSessionId).toBe(AUDIO_ID);
  });
});
