export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  collectCoverageFrom: ['index.js', 'tests/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testPathIgnorePatterns: ['node_modules/'],
}
