module.exports = {
  testEnvironment: 'jsdom',
  
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  testMatch: [
    '**/test/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  moduleFileExtensions: ['js', 'json'],
  
  clearMocks: true,
  restoreMocks: true,
  
  testTimeout: 10000,
  
  verbose: true,
  
  maxWorkers: 1
};
