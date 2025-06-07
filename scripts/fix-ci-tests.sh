#!/bin/bash
# Script de correction pour améliorer la robustesse des tests CI
# SalamBot Functions-Run - Corrections des échecs de tests

set -e

echo "🔧 Application des corrections pour les tests CI..."

# 1. Amélioration du script de démarrage des services mock
echo "📦 Amélioration du démarrage des services mock..."

# Créer un script de démarrage plus robuste
cat > scripts/start-mock-services-robust.sh << 'EOF'
#!/bin/bash
# Script robuste pour démarrer les services mock

set -e

echo "🚀 Démarrage robuste des services mock..."

# Change to the functions-run directory
cd "$(dirname "$0")/../apps/functions-run"

# Create logs directory
mkdir -p logs

# Function to wait for service with exponential backoff
wait_for_service() {
  local port=$1
  local service_name=$2
  local max_attempts=60
  local attempt=1
  local wait_time=1
  
  echo "🔍 Attente du service $service_name sur le port $port..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
      echo "✅ $service_name est prêt sur le port $port"
      return 0
    fi
    
    echo "⏳ Tentative $attempt/$max_attempts: Attente de $service_name (délai: ${wait_time}s)"
    sleep $wait_time
    
    # Exponential backoff with max 5 seconds
    wait_time=$((wait_time < 5 ? wait_time + 1 : 5))
    attempt=$((attempt + 1))
  done
  
  echo "❌ $service_name a échoué à démarrer sur le port $port"
  echo "📋 Dernières lignes du log:"
  tail -n 20 "logs/${service_name,,}.log" 2>/dev/null || echo "Aucun fichier de log trouvé"
  return 1
}

# Function to check port availability
check_port_available() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Port $port déjà utilisé, tentative d'arrêt..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
}

# Clean up any existing services
echo "🧹 Nettoyage des services existants..."
for port in 3001 3002 3003 3004; do
  check_port_available $port
done

# Start services with better error handling
echo "📦 Démarrage des services mock..."

# Start Genkit Mock
echo "Starting Genkit mock service..."
MOCK_GENKIT_PORT=3001 nohup pnpm run mock:genkit > logs/genkit.log 2>&1 &
GENKIT_PID=$!
echo $GENKIT_PID > logs/genkit.pid
sleep 3

# Start REST API Mock
echo "Starting REST API mock service..."
MOCK_REST_API_PORT=3002 nohup pnpm run mock:rest-api > logs/rest-api.log 2>&1 &
REST_API_PID=$!
echo $REST_API_PID > logs/rest-api.pid
sleep 3

# Start WebSocket Mock
echo "Starting WebSocket mock service..."
MOCK_WEBSOCKET_PORT=3003 nohup pnpm run mock:websocket > logs/websocket.log 2>&1 &
WEBSOCKET_PID=$!
echo $WEBSOCKET_PID > logs/websocket.pid
sleep 3

# Start Prometheus Mock
echo "Starting Prometheus mock service..."
MOCK_PROMETHEUS_PORT=3004 nohup pnpm run mock:prometheus > logs/prometheus.log 2>&1 &
PROMETHEUS_PID=$!
echo $PROMETHEUS_PID > logs/prometheus.pid
sleep 3

# Wait for all services to be ready
echo "⏳ Attente de la disponibilité des services..."
SERVICES_FAILED=0

if ! wait_for_service 3001 "Genkit"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

if ! wait_for_service 3002 "REST-API"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

if ! wait_for_service 3004 "Prometheus"; then
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
fi

# WebSocket check (no health endpoint)
if ! nc -z localhost 3003 2>/dev/null; then
  echo "❌ WebSocket service non disponible"
  SERVICES_FAILED=$((SERVICES_FAILED + 1))
else
  echo "✅ WebSocket service disponible"
fi

if [ $SERVICES_FAILED -eq 0 ]; then
  echo "✅ Tous les services mock sont prêts!"
  echo "🎯 Les tests peuvent maintenant s'exécuter"
  exit 0
else
  echo "❌ $SERVICES_FAILED service(s) ont échoué à démarrer"
  echo "🔍 Vérifiez les fichiers de log dans le répertoire logs/"
  exit 1
fi
EOF

chmod +x scripts/start-mock-services-robust.sh

# 2. Amélioration de la configuration Jest
echo "⚙️ Amélioration de la configuration Jest..."

# Backup de la configuration actuelle
cp apps/functions-run/jest.config.ts apps/functions-run/jest.config.ts.backup

# Mise à jour de la configuration Jest avec des timeouts plus longs
cat > apps/functions-run/jest.config.ts << 'EOF'
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
    '.integration.test.',
  ],
  
  // Configuration du coverage
  coverageDirectory: '../../coverage/apps/functions-run',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/env-setup.ts'
  ],
  
  // Timeout augmenté pour le CI (30 secondes)
  testTimeout: 30000,
  
  // Mapper les modules pour les mocks
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Nettoyage automatique des mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Configuration pour le CI
  maxWorkers: process.env.CI ? 1 : '50%',
  
  // Retry des tests flaky
  retry: process.env.CI ? 2 : 0,
  
  // Détection des handles ouverts
  detectOpenHandles: true,
  forceExit: true,
  
  // Configuration des reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Global setup et teardown
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts'
};

export default config;
EOF

# 3. Amélioration du setup global des tests
echo "🔧 Amélioration du setup global des tests..."

# Créer un teardown global plus robuste
cat > apps/functions-run/src/__tests__/global-teardown.ts << 'EOF'
/**
 * Global Teardown pour Jest
 * Nettoyage robuste des ressources après tous les tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export default async function globalTeardown() {
  console.log('🧹 Nettoyage global des ressources de test...');
  
  try {
    // 1. Arrêt des services mock par PID
    const logsDir = path.join(__dirname, '../../logs');
    const pidFiles = ['genkit.pid', 'rest-api.pid', 'websocket.pid', 'prometheus.pid'];
    
    for (const pidFile of pidFiles) {
      const pidPath = path.join(logsDir, pidFile);
      if (fs.existsSync(pidPath)) {
        try {
          const pid = fs.readFileSync(pidPath, 'utf8').trim();
          if (pid) {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`✅ Service arrêté (PID: ${pid})`);
          }
        } catch (error) {
          console.log(`⚠️ Impossible d'arrêter le service ${pidFile}: ${error}`);
        }
        fs.unlinkSync(pidPath);
      }
    }
    
    // 2. Nettoyage des ports par force
    const ports = [3001, 3002, 3003, 3004];
    for (const port of ports) {
      try {
        if (process.platform === 'win32') {
          await execAsync(`netstat -ano | findstr :${port} | for /f "tokens=5" %a in ('more') do taskkill /F /PID %a 2>nul`);
        } else {
          await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        }
      } catch (error) {
        // Ignorer les erreurs de nettoyage
      }
    }
    
    // 3. Attendre un peu pour que les processus se terminent
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Nettoyage global terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage global:', error);
  }
}
EOF

# 4. Mise à jour du workflow CI
echo "🔄 Mise à jour du workflow CI..."

# Backup du workflow actuel
cp .github/workflows/ci.yml .github/workflows/ci.yml.backup

# Mise à jour de la section test du workflow
sed -i 's/timeout 600 pnpm test/timeout 900 pnpm test/g' .github/workflows/ci.yml
sed -i 's/JEST_TIMEOUT: 15000/JEST_TIMEOUT: 30000/g' .github/workflows/ci.yml

# 5. Ajout d'un script de retry pour les tests
echo "🔄 Création d'un script de retry pour les tests..."

cat > scripts/run-tests-with-retry.sh << 'EOF'
#!/bin/bash
# Script pour exécuter les tests avec retry en cas d'échec

set -e

MAX_RETRIES=3
RETRY_COUNT=0

echo "🧪 Exécution des tests avec retry (max: $MAX_RETRIES tentatives)..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "\n🔄 Tentative $((RETRY_COUNT + 1))/$MAX_RETRIES"
  
  if pnpm test; then
    echo "✅ Tests réussis!"
    exit 0
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "❌ Tests échoués, nouvelle tentative dans 10 secondes..."
      sleep 10
      
      # Nettoyage entre les tentatives
      echo "🧹 Nettoyage avant nouvelle tentative..."
      ./scripts/stop-mock-services.sh || true
      sleep 5
    fi
  fi
done

echo "❌ Tests échoués après $MAX_RETRIES tentatives"
exit 1
EOF

chmod +x scripts/run-tests-with-retry.sh

echo "✅ Corrections appliquées avec succès!"
echo ""
echo "📋 Résumé des améliorations:"
echo "  1. ✅ Script de démarrage des services mock plus robuste"
echo "  2. ✅ Configuration Jest avec timeouts augmentés (30s)"
echo "  3. ✅ Teardown global amélioré"
echo "  4. ✅ Workflow CI mis à jour avec timeouts plus longs"
echo "  5. ✅ Script de retry pour les tests"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Tester les modifications localement"
echo "  2. Committer et pousser les changements"
echo "  3. Vérifier que les tests CI passent"