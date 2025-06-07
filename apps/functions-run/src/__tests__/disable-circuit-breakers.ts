/**
 * Désactivation des Circuit Breakers pour les Tests
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Force la désactivation des circuit breakers pendant les tests
 *              pour éviter les comportements imprévisibles
 * @author SalamBot Platform Team
 * @created 2025-06-07
 */

import { beforeAll, afterAll } from '@jest/globals';

/**
 * 🔴 Configuration pour désactiver les circuit breakers en mode test
 */
beforeAll(() => {
  // Forcer la désactivation des circuit breakers
  process.env['CIRCUIT_BREAKER_ENABLED'] = 'false';
  process.env['CIRCUIT_BREAKER_TEST_MODE'] = 'true';
  
  // Configuration de timeouts optimisés pour les tests
  process.env['TEST_REQUEST_TIMEOUT'] = '3000';
  process.env['TEST_CONNECTION_TIMEOUT'] = '1000';
  process.env['TEST_RESPONSE_TIMEOUT'] = '2000';
  
  console.log('🔴 Circuit breakers désactivés pour les tests');
  console.log('⏱️  Timeouts optimisés pour les tests configurés');
});

/**
 * 🧹 Nettoyage après les tests
 */
afterAll(() => {
  // Restaurer les valeurs par défaut si nécessaire
  // (optionnel car les tests s'exécutent dans un environnement isolé)
});

export {};