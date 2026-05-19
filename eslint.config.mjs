import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const frontendFiles = ['frontend/**/*.{js,jsx,ts,tsx}'];
const scopedNextVitals = nextVitals.map((config) => ({
  ...config,
  files: config.files ?? frontendFiles,
}));

export default defineConfig([
  ...scopedNextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: ['frontend/', '.'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['frontend/src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/app/**', '@/app/**'],
          message: 'features/ must not import from app/.',
        }],
      }],
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'frontend/.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'bot/dist/**',
    'coverage/**',
    'data/**',
    'docs/tools/**',
    'storybook-static/**',
    'node_modules/**',
    'frontend/node_modules/**',
    'frontend/next-env.d.ts',
    'frontend/tsconfig.tsbuildinfo',
  ]),
]);
