/**
 * @file ESLint 9 Flat Config
 * @description YYC³ Infinite Gallery 代码质量门禁配置，兼容 Next.js 15 eslint-config
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-11-18
 * @updated 2026-11-18
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
	baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
	{
		ignores: [
			'.next/**',
			'node_modules/**',
			'out/**',
			'docs/**',
			'next-env.d.ts',
		],
	},
	...compat.extends('next/core-web-vitals'),
	...compat.extends('next/typescript'),
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@next/next/no-img-element': 'off',
		},
	},
];

export default config;
