/**
 * Configuration Jest Simplifiée pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 */

module.exports = {
  // Configuration de base
  displayName: 'functions-run-integration',
  testEnvironment: 'node',
  
  // Pattern de fichiers de test d'intégration
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.integration.test.ts',
    '<rootDir>/src/**/*.integration.test.ts'
  ],
  
  // Exclure les tests unitaires
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.unit\\.test\\.',
    '\\.spec\\.',
    '/dist/'
  ],
  
  // Transform TypeScript
  transform: {
    '^.+.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }]
  },
  
  // Extensions de fichiers
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Configuration TypeScript
  preset: 'ts-jest',
  
  // Setup et teardown pour les tests d'intégration
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-integration.ts'
  ],
  
  // Setup et teardown globaux pour les services
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts',
  
  // Variables d'environnement spécifiques aux tests
  setupFiles: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  
  // Timeout plus élevé pour les tests d'intégration
  testTimeout: 20000, // Réduit à 20 secondes pour optimiser les tests CI
  
  // Exécution séquentielle pour éviter les conflits de ports
  maxWorkers: 1,
  
  // Configuration pour éviter les fuites de mémoire
  detectOpenHandles: true,
  forceExit: true,
  
  // Isolation des tests
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  clearMocks: true,
  
  // Mapping des modules avec mocks spécifiques
  moduleNameMapper: {
    // Utiliser les vrais modules Redis pour les tests d'intégration
    '^ioredis$': 'ioredis',
    // Garder les mocks pour les services externes non critiques
    '^genkit$': '<rootDir>/src/__mocks__/genkit.js',
    '^cld3$': '<rootDir>/src/__mocks__/cld3.js',
    '^genkit-vertexai$': '<rootDir>/src/__mocks__/genkit-vertexai.js',
    '^genkit-openai$': '<rootDir>/src/__mocks__/genkit-openai.js'
  },
  
  // Configuration de couverture
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.ts'
  ],
  
  // Répertoire de couverture séparé
  coverageDirectory: './coverage/integration',
  
  // Configuration pour les tests longs
  verbose: true
};