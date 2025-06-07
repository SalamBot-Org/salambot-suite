module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: false
    }]
  },
  testTimeout: 10000,
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(.{1,2}/.*)\.js$': '$1'
  }
};