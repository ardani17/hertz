import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': `${rootDir}frontend/src`,
      '@shared': `${rootDir}shared`,
      'next/headers': `${rootDir}tests/mocks/next-headers.ts`,
    },
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'frontend/src/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.next', 'frontend/.next'],
    testTimeout: 10000,
  },
});
