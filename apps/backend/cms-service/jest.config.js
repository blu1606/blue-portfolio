// jest.config.js
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/coverage/'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/setup.js']
};
