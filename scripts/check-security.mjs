/**
 * @file 依赖安全审计脚本
 * @description 对有补丁的安全漏洞执行硬门禁；对上游无补丁的已知漏洞执行受控豁免并追踪
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-11-18
 * @updated 2026-11-18
 */

import { spawnSync } from 'node:child_process';

const REGISTRY = 'https://registry.npmjs.org';

/** 上游尚未发布补丁的漏洞白名单：仅允许由这些 GHSA 触发的告警 */
const UPSTREAM_WAIVERS = new Map([
	[
		'GHSA-fc5q-39xc-vjpf',
		'picomatch <=4.0.7 ReDoS — 上游无补丁版本（patched: null），来自 tinyglobby/@typescript-eslint 开发链，不进入生产运行时',
	],
]);

const result = spawnSync(
	'pnpm',
	['audit', '--registry', REGISTRY, '--json'],
	{ encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
);

let audit;
try {
	audit = JSON.parse(result.stdout);
} catch {
	console.error('无法解析 pnpm audit 输出：', result.stderr || result.stdout);
	process.exit(1);
}

const counts = audit.metadata?.vulnerabilities ?? {};
const { critical = 0, high = 0, moderate = 0, low = 0 } = counts;
const total = critical + high + moderate + low;

if (total === 0) {
	console.log('依赖安全审计通过：0 项漏洞');
	process.exit(0);
}

const detail = spawnSync(
	'pnpm',
	['audit', '--registry', REGISTRY],
	{ encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
);
const text = `${detail.stdout ?? ''}${detail.stderr ?? ''}`;

const advisoryIds = [...text.matchAll(/GHSA-[a-z0-9-]+/gi)].map((m) => m[0].toUpperCase());
const uniqueIds = [...new Set(advisoryIds)];
const waivedIds = [...UPSTREAM_WAIVERS.keys()].map((id) => id.toUpperCase());
const nonWaived = uniqueIds.filter((id) => !waivedIds.includes(id));

console.log(`依赖安全审计：critical=${critical} high=${high} moderate=${moderate} low=${low}`);
for (const id of uniqueIds) {
	const waiver = [...UPSTREAM_WAIVERS.entries()].find(
		([key]) => key.toUpperCase() === id
	);
	if (waiver) {
		console.warn(`  [豁免] ${id}: ${waiver[1]}`);
	} else {
		console.error(`  [阻断] ${id}: 存在可用修复，必须升级依赖`);
	}
}

if (nonWaived.length > 0) {
	console.error(`发现 ${nonWaived.length} 项可修复漏洞，审计失败`);
	process.exit(1);
}

for (const id of waivedIds) {
	if (!uniqueIds.includes(id)) {
		console.log(`  [已解除] ${id}: 上游补丁已发布或依赖已移除，可删除该豁免`);
	}
}
console.log('依赖安全审计通过：剩余告警均为上游无补丁漏洞，已受控豁免');
