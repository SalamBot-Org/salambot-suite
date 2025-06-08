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
  
  // Timeout pour les tests - augmenté pour Ubuntu CI
  testTimeout: process.env['CI'] ? 45000 : 20000,
  
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
  
  // Configuration pour le CI - optimisée pour Ubuntu
  maxWorkers: process.env['CI'] ? 1 : '50%',
  
  // Configuration spécifique pour CI
  ...(process.env['CI'] && {
    // Retry des tests flaky en CI - augmenté pour Ubuntu
    testRetries: 3,
    // Timeout plus long pour les hooks
    testEnvironmentOptions: {
      timeout: 90000
    },
    // Configuration spécifique pour Ubuntu CI
    slowTestThreshold: 10000,
    // Bail après 3 échecs pour éviter les timeouts
    bail: 3
  }),
  
  // Configuration des reporters
  reporters: ['default']
};

export default config;
