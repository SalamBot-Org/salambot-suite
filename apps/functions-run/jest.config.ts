import type { Config } from 'jest';

const config: Config = {
  // Configuration de base
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Extensions de fichiers supportées
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transformation TypeScript
  transform: {
    '^.+\.ts$': ['ts-jest', {
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
    '\.integration\.test\.',
  ],
  
  // Configuration du coverage
  coverageDirectory: '../../coverage/apps/functions-run',
  coverageProvider: 'v8',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  
  // Timeout pour les tests
  testTimeout: 30000,
  
  // Verbose pour plus de détails
  verbose: true,
  
  // Mapper les modules pour les mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Nettoyage automatique des mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Détection des handles ouverts
  detectOpenHandles: true,
  forceExit: true,
  
  // Gestion des workers pour éviter les conflits
  maxWorkers: 1
};

export default config;
