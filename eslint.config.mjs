/**
 * @file ESLint 9 Flat Config
 * @description YYC³ Infinite Gallery 代码质量门禁配置，使用 Next.js 16 原生 Flat Config
 * @author YYC³ Team
 * @version 2.0.0
 * @created 2026-11-18
 * @updated 2026-11-21
 */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
	{
		ignores: [
			'.next/**',
			'node_modules/**',
			'out/**',
			'coverage/**',
			'docs/**',
			'next-env.d.ts',
		],
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@next/next/no-img-element': 'off',
		},
	},
	{
		// shadcn/ui 模板按上游实现维护，不对其内部 effect/ref 写法施加项目级 Compiler 规则
		files: ['components/ui/**/*.{ts,tsx}'],
		rules: {
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/purity': 'off',
			'react-hooks/immutability': 'off',
			'react-hooks/refs': 'off',
		},
	},
];

export default config;
