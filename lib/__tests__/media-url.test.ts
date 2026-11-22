/**
 * @file 媒体地址解析单元测试
 * @description 覆盖基址配置、绝对地址透传、路径归一化与 SSR 默认值
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-22
 */

type MediaUrlModule = typeof import("../media-url");

async function loadWithBase(base?: string): Promise<MediaUrlModule> {
  jest.resetModules();
  if (base === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = base;
  return import("../media-url");
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
});

describe("mediaUrl", () => {
  test("未配置基址时应返回站内绝对路径", async () => {
    const { mediaUrl, getMediaBaseUrl } = await loadWithBase();
    expect(getMediaBaseUrl()).toBe("");
    expect(mediaUrl("/artist-3x4/0.webp")).toBe("/artist-3x4/0.webp");
    expect(mediaUrl("mp3/a.mp3")).toBe("/mp3/a.mp3");
  });

  test("配置基址后应前缀并去除尾部斜杠", async () => {
    const { mediaUrl, getMediaBaseUrl } = await loadWithBase(
      "https://media.yyc3.top///",
    );
    expect(getMediaBaseUrl()).toBe("https://media.yyc3.top");
    expect(mediaUrl("/mv-3x4/Music-1990.mp4")).toBe(
      "https://media.yyc3.top/mv-3x4/Music-1990.mp4",
    );
  });

  test("绝对地址、data 与 blob 地址应原样返回", async () => {
    const { mediaUrl } = await loadWithBase("https://cdn.example.com");
    expect(mediaUrl("https://other.example.com/a.mp4")).toBe(
      "https://other.example.com/a.mp4",
    );
    expect(mediaUrl("//cdn.example.com/a.mp4")).toBe(
      "//cdn.example.com/a.mp4",
    );
    expect(mediaUrl("data:image/png;base64,AAA")).toBe(
      "data:image/png;base64,AAA",
    );
    expect(mediaUrl("blob:https://x/123")).toBe("blob:https://x/123");
  });

  test("空路径应原样返回", async () => {
    const { mediaUrl } = await loadWithBase("https://cdn.example.com");
    expect(mediaUrl("")).toBe("");
  });

  test("基址为空白字符串时按未配置处理", async () => {
    const { mediaUrl, getMediaBaseUrl } = await loadWithBase("   ");
    expect(getMediaBaseUrl()).toBe("");
    expect(mediaUrl("/mp3/a.mp3")).toBe("/mp3/a.mp3");
  });
});
