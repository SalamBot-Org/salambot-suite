/**
 * Configuration d'Environnement pour les Tests
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configure les variables d'environnement spécifiques aux tests
 *              avant l'exécution de la suite de tests
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import { config } from 'dotenv';
import path from 'path';

// Charger les variables d'environnement de test
const envPath = path.resolve(__dirname, '../../.env.test');
config({ path: envPath });

// Configuration spécifique aux tests
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';
process.env['METRICS_ENABLED'] = 'true';

// Désactiver les warnings Node.js pour les tests
process.env['NODE_NO_WARNINGS'] = '1';

// Configuration Jest Worker
process.env['JEST_WORKER_ID'] = process.env['JEST_WORKER_ID'] || '1';

// Configuration des timeouts pour les tests
process.env['REQUEST_TIMEOUT'] = '5000';
process.env['HEALTH_CHECK_TIMEOUT'] = '2000';

// Timeouts spécifiques optimisés
process.env['TEST_REQUEST_TIMEOUT'] = '3000';
process.env['TEST_CONNECTION_TIMEOUT'] = '1000';
process.env['TEST_RESPONSE_TIMEOUT'] = '2000';

// Désactivation des circuit breakers
process.env['CIRCUIT_BREAKER_ENABLED'] = 'false';
process.env['CIRCUIT_BREAKER_TEST_MODE'] = 'true';

// Configuration Redis pour les tests
process.env['REDIS_DB'] = '15'; // Base de données de test
process.env['REDIS_KEY_PREFIX'] = 'salambot:test:gateway:';

// Configuration des mocks
process.env['USE_MOCK_SERVICES'] = 'true';
process.env['DISABLE_EXTERNAL_SERVICES'] = 'true';

// Configuration des ports des mocks (alignée avec ci.yml)
process.env['MOCK_GENKIT_PORT'] = '3001';
process.env['MOCK_REST_API_PORT'] = '3002';
process.env['MOCK_WEBSOCKET_PORT'] = '3003';
process.env['MOCK_PROMETHEUS_PORT'] = '3004'; // Corrigé pour correspondre au CI

// Configuration des délais et erreurs des mocks
process.env['MOCK_RESPONSE_DELAY_MS'] = '50';
process.env['MOCK_ERROR_RATE_PERCENT'] = '5';
process.env['MOCK_TIMEOUT_RATE_PERCENT'] = '2';

// Configuration des données de test
process.env['TEST_DATA_RESET_BETWEEN_TESTS'] = 'true';
process.env['TEST_DATA_CLEANUP_ENABLED'] = 'true';

// Configuration du seed pour la reproductibilité
process.env['TEST_DATA_SEED'] = '12345';

// Configuration des features flags pour les tests
process.env['FEATURE_DARIJA_DETECTION'] = 'true';
process.env['FEATURE_AI_FALLBACK'] = 'true';
process.env['FEATURE_CACHE_OPTIMIZATION'] = 'true';
process.env['FEATURE_ADVANCED_METRICS'] = 'false';
process.env['FEATURE_EXPERIMENTAL_FLOWS'] = 'false';

// Configuration du rate limiting pour les tests
process.env['RATE_LIMIT_MAX_REQUESTS'] = '1000';
process.env['RATE_LIMIT_WINDOW_MS'] = '60000';
process.env['RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS'] = 'true';

// Configuration CORS permissive pour les tests
process.env['CORS_ORIGIN'] = 'http://localhost:3000,http://127.0.0.1:3000';

// Désactiver les logs de fichier pour les tests
process.env['LOG_FILE_ENABLED'] = 'false';

// Configuration des clés de test
process.env['JWT_SECRET'] = 'test-jwt-secret-for-integration-tests-only';
process.env['API_KEYS'] = 'test-api-key-1,test-api-key-2';
process.env['ENCRYPTION_KEY'] = 'test-32-character-encryption-key';

// Affichage de confirmation (uniquement en mode verbose)
if (process.env['JEST_VERBOSE'] === 'true') {
  console.log('🧪 Configuration d\'environnement de test chargée');
  console.log(`📁 Fichier .env.test: ${envPath}`);
  console.log(`🔧 NODE_ENV: ${process.env['NODE_ENV']}`);
  console.log(`📊 Redis DB: ${process.env['REDIS_DB']}`);
  console.log(`🎭 Mocks activés: ${process.env['USE_MOCK_SERVICES']}`);
}

export {};