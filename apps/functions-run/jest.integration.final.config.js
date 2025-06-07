/**
 * Configuration Jest Finale pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 */

export default {
  // Configuration de base qui fonctionne
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Node.js options to handle unhandled promise rejections
  testEnvironmentOptions: {
    NODE_OPTIONS: '--unhandled-rejections=warn'
  },
  
  // Nom d'affichage
  displayName: 'functions-run-integration',
  
  // Pattern de fichiers de test d'intégration
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // Exclure les tests unitaires
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Extensions de fichiers
  moduleFileExtensions: ['ts', 'js'],
  
  // Transform TypeScript
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }]
  },
  
  // Timeout plus élevé pour les tests d'intégration
  testTimeout: 30000,
  
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
  verbose: true,
  
  // Variables d'environnement pour les tests
  setupFiles: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  
  // Setup après environnement
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-integration.ts'
  ],
  
  // Setup et teardown globaux
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts'
};