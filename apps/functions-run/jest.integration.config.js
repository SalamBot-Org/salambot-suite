/**
 * Configuration Jest pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configuration spécialisée pour les tests d'intégration
 *              nécessitant des services externes (Redis, mocks, etc.)
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

// Configuration de base Jest
const baseConfig = {
  displayName: 'functions-run-functions-run',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/functions-run_tmp',
  moduleNameMapper: {
    '^genkit$': '<rootDir>/src/__mocks__/genkit.js',
    '^cld3$': '<rootDir>/src/__mocks__/cld3.js',
    '^genkit-vertexai$': '<rootDir>/src/__mocks__/genkit-vertexai.js',
    '^genkit-openai$': '<rootDir>/src/__mocks__/genkit-openai.js',
  },
};

module.exports = {
  ...baseConfig,
  
  // Configuration spécifique aux tests d'intégration
  displayName: 'functions-run-integration',
  
  // Pattern de fichiers de test d'intégration
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.integration.test.ts',
    '<rootDir>/src/**/*.integration.test.ts'
  ],
  
  // Exclure les tests unitaires
  testPathIgnorePatterns: [
    '/node_modules/',
    '.unit.test.',
    '.spec.',
    '/dist/'
  ],
  
  // Setup et teardown pour les tests d'intégration
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-integration.ts'
  ],
  
  // Configuration pour éviter les fuites de mémoire
  detectOpenHandles: true,
  forceExit: true,
  detectLeaks: true,
  
  // Setup et teardown globaux pour les services
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts',
  
  // Timeout plus élevé pour les tests d'intégration
  testTimeout: 30000, // 30 secondes
  
  // Exécution séquentielle pour éviter les conflits de ports
  maxWorkers: 1,
  
  // Isolation des tests
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  
  // Variables d'environnement spécifiques aux tests
  setupFiles: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  

  
  // Mapping des modules avec mocks spécifiques
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Utiliser les vrais modules Redis pour les tests d'intégration
    '^ioredis$': 'ioredis',
    // Garder les mocks pour les services externes non critiques
    '^genkit$': '<rootDir>/src/__mocks__/genkit.js',
    '^cld3$': '<rootDir>/src/__mocks__/cld3.js'
  },
  
  // Configuration de couverture spécifique
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.ts'
  ],
  
  // Répertoire de couverture séparé
  coverageDirectory: '../../coverage/apps/functions-run-integration',
  
  // Seuils de couverture pour les tests d'intégration
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Configuration des reporters pour un meilleur debugging
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'integration-results.xml',
      suiteName: 'Integration Tests'
    }]
  ],
  
  // Configuration pour les tests longs
  verbose: true,
  
  // Nettoyage après chaque test
  clearMocks: true
};