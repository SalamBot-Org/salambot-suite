/**
 * Configuration Jest pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configuration spécialisée pour les tests d'intégration
 *              nécessitant des services externes (Redis, mocks, etc.)
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

const baseConfig = require('./jest.config.ts').default;

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
    '\.unit\.test\.',
    '\.spec\.',
    '/dist/'
  ],
  
  // Setup et teardown pour les tests d'intégration
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-integration.ts'
  ],
  
  // Setup et teardown globaux pour les services
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts',
  
  // Timeout plus élevé pour les tests d'intégration
  testTimeout: 30000, // 30 secondes
  
  // Exécution séquentielle pour éviter les conflits de ports
  maxWorkers: 1,
  
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
  
  // Reporters spécifiques
  reporters: [
    'default'
    // TODO: Ajouter jest-junit après installation
    // [
    //   'jest-junit',
    //   {
    //     outputDirectory: './test-results/integration',
    //     outputName: 'junit.xml',
    //     suiteName: 'Integration Tests'
    //   }
    // ]
  ],
  
  // Configuration pour les tests longs
  verbose: true,
  
  // Détection des fuites mémoire
  detectLeaks: true,
  
  // Force la sortie en cas de fuite
  forceExit: true,
  
  // Nettoyage après chaque test
  clearMocks: true,
  restoreMocks: true
};