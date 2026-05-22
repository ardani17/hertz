import '@testing-library/jest-dom/vitest';

if (typeof document !== 'undefined') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });
}
