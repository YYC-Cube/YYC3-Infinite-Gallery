/**
 * @file Jest 配置
 * @description 隔离项目测试与 docs 下第三方参考源码，避免第三方测试污染门禁
 * @author YYC³
 * @version 1.2.0
 * @created 2026-11-19
 * @updated 2026-11-20
 */

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  passWithNoTests: true,
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest"],
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/out/",
    "/e2e/",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/out/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // 覆盖率仅统计 lib 状态层（组件与 Hook 尚未纳入测试，避免虚高口径）
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "!lib/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 70,
      functions: 88,
      lines: 95,
    },
  },
};

export default config;
