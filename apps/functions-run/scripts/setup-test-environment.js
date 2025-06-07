#!/usr/bin/env node
/**
 * Script de Configuration de l'Environnement de Test
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Installe et configure toutes les dépendances nécessaires
 *              pour stabiliser l'environnement de test
 * @author SalamBot Platform Team
 * @created 2025-06-05
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Dépendances nécessaires pour les tests
const testDependencies = [
  'redis-memory-server@^9.0.0',
  'ioredis-mock@^8.9.0',
  'jest-junit@^16.0.0',
  'supertest@^6.3.0',
  'ws@^8.14.0'
];

// Dépendances de développement
const devDependencies = [
  '@types/supertest@^6.0.0',
  '@types/ws@^8.5.0'
];

function executeCommand(command, description) {
  try {
    log(`Exécution: ${command}`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    logSuccess(description);
    return true;
  } catch (error) {
    logError(`Échec: ${description}`);
    logError(error.message);
    return false;
  }
}

function checkPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json non trouvé dans le répertoire courant');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  logSuccess(`Package: ${packageJson.name}@${packageJson.version}`);
  
  return packageJson;
}

function updatePackageJsonScripts(packageJson) {
  const newScripts = {
    'test:setup': 'node scripts/setup-test-environment.js',
    'test:integration': 'jest --config jest.integration.config.js',
    'test:integration:watch': 'jest --config jest.integration.config.js --watch',
    'test:integration:coverage': 'jest --config jest.integration.config.js --coverage',
    'test:unit': 'jest --config jest.config.ts --testPathIgnorePatterns=".*\\.integration\\.test\\..*"',
    'test:all': 'npm run test:unit && npm run test:integration',
    'test:clean': 'rimraf coverage test-results node_modules/.cache'
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...newScripts };
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  logSuccess('Scripts package.json mis à jour');
}

function createTestDirectories() {
  const directories = [
    'test-results',
    'coverage',
    'logs'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logSuccess(`Répertoire créé: ${dir}`);
    }
  });
}

function createGitignoreEntries() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const entriesToAdd = [
    '# Test artifacts',
    'test-results/',
    'coverage/',
    'logs/',
    '*.log',
    '',
    '# Redis dumps',
    'dump.rdb',
    '*.rdb',
    ''
  ];
  
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  const newEntries = entriesToAdd.filter(entry => 
    entry === '' || !gitignoreContent.includes(entry)
  );
  
  if (newEntries.length > 0) {
    fs.appendFileSync(gitignorePath, '\n' + newEntries.join('\n'));
    logSuccess('.gitignore mis à jour');
  }
}

function main() {
  log('🚀 Configuration de l\'environnement de test SalamBot', 'bright');
  log('=' .repeat(60), 'cyan');
  
  // Vérifier package.json
  logStep('1.', 'Vérification du package.json');
  const packageJson = checkPackageJson();
  
  // Installer les dépendances de test
  logStep('2.', 'Installation des dépendances de test');
  const installTestDeps = executeCommand(
    `pnpm add -D ${testDependencies.join(' ')}`,
    'Dépendances de test installées'
  );
  
  if (!installTestDeps) {
    logWarning('Tentative avec npm...');
    executeCommand(
      `npm install --save-dev ${testDependencies.join(' ')}`,
      'Dépendances de test installées avec npm'
    );
  }
  
  // Installer les types TypeScript
  logStep('3.', 'Installation des types TypeScript');
  const installTypes = executeCommand(
    `pnpm add -D ${devDependencies.join(' ')}`,
    'Types TypeScript installés'
  );
  
  if (!installTypes) {
    logWarning('Tentative avec npm...');
    executeCommand(
      `npm install --save-dev ${devDependencies.join(' ')}`,
      'Types TypeScript installés avec npm'
    );
  }
  
  // Mettre à jour les scripts
  logStep('4.', 'Mise à jour des scripts package.json');
  updatePackageJsonScripts(packageJson);
  
  // Créer les répertoires nécessaires
  logStep('5.', 'Création des répertoires de test');
  createTestDirectories();
  
  // Mettre à jour .gitignore
  logStep('6.', 'Mise à jour du .gitignore');
  createGitignoreEntries();
  
  // Résumé
  log('\n' + '=' .repeat(60), 'cyan');
  logSuccess('Configuration de l\'environnement de test terminée!');
  log('\nCommandes disponibles:', 'bright');
  log('  pnpm test:setup           - Configurer l\'environnement', 'blue');
  log('  pnpm test:integration     - Lancer les tests d\'intégration', 'blue');
  log('  pnpm test:unit           - Lancer les tests unitaires', 'blue');
  log('  pnpm test:all            - Lancer tous les tests', 'blue');
  log('  pnpm test:clean          - Nettoyer les artifacts', 'blue');
  
  log('\nProchaines étapes:', 'bright');
  log('  1. Vérifier que Redis est installé localement', 'yellow');
  log('  2. Lancer: pnpm test:integration', 'yellow');
  log('  3. Vérifier les résultats dans test-results/', 'yellow');
}

if (require.main === module) {
  main();
}

module.exports = { main };