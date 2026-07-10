import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 100000,
    hookTimeout: 100000,
    globals: true,
    watch: false,
    retry: 3,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['index.js', 'app/**/*.js'],
      reportsDirectory: './coverage',
    },
    // Force exit after tests complete to ensure browser cleanup
    forceExit: true,
    // Run tests sequentially to avoid browser conflicts
    // Use threads pool instead of forks for better cleanup
    pool: 'threads',
    isolate: true,
    minThreads: 1,
    maxThreads: 1,
    // Ensure all async operations complete before exit
    teardownTimeout: 10000,
  },
});