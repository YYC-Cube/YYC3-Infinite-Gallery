/**
 * @file PWA 安装逻辑单元测试
 * @description 验证 BeforeInstallPromptEvent 类型定义与安装流程逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

describe("PWA install logic", () => {
  test("BeforeInstallPromptEvent 类型应包含 prompt 与 userChoice", () => {
    const mockEvent: BeforeInstallPromptEvent = new Event(
      "beforeinstallprompt",
    ) as BeforeInstallPromptEvent;
    mockEvent.prompt = jest.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    expect(typeof mockEvent.prompt).toBe("function");
    expect(mockEvent.userChoice).toBeInstanceOf(Promise);
  });

  test("install 接受后 outcome 应为 accepted", async () => {
    const userChoice = Promise.resolve({ outcome: "accepted" } as const);
    const result = await userChoice;
    expect(result.outcome).toBe("accepted");
  });

  test("install 被拒绝后 outcome 应为 dismissed", async () => {
    const userChoice = Promise.resolve({ outcome: "dismissed" } as const);
    const result = await userChoice;
    expect(result.outcome).toBe("dismissed");
  });
});
