import type { Config } from 'jest';

const config: Config = {
  // Configuration de base
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Extensions de fichiers supportées
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transformation TypeScript
  transform: {
    '^.+.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }]
  },
  
  // Pattern de fichiers de test
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // Ignorer certains patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.integration.test.'
  ],
  
  // Configuration du coverage
  coverageDirectory: '../../coverage/apps/functions-run',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  
  // Timeout augmenté pour le CI (20 secondes)
  testTimeout: 20000,
  
  // Mapper les modules pour les mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Nettoyage automatique des mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Détection des handles ouverts et configuration CI
  detectOpenHandles: true,
  forceExit: true,
  
  // Configuration pour le CI
  maxWorkers: process.env['CI'] ? 1 : '50%',
  
  // Configuration des reporters
  reporters: ['default']
};

export default config;
