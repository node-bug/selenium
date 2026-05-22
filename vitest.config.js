import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 100000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['index.js', 'app/**/*.js'],
      reportsDirectory: './coverage',
    },
    // Force exit after tests complete to ensure browser cleanup
    forceExit: true,
    // Run tests sequentially to avoid browser conflicts
    pool: 'forks',
    isolate: true,
  },
});