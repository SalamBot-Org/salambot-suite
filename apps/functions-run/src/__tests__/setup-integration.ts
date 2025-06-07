/**
 * Setup pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configuration et utilitaires pour les tests d'intégration
 *              Exécuté avant chaque fichier de test d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import Redis from 'ioredis';
import {
  createRedisTestClient,
  cleanRedisTestData,
  startRedisMemoryServer,
  isRedisMemoryServerRunning,
} from './redis-memory-setup';

// Configuration des timeouts
jest.setTimeout(20000); // Réduit à 20 secondes pour optimiser les tests CI

// Configuration axios pour les tests
axios.defaults.timeout = 10000; // 10 secondes
axios.defaults.validateStatus = () => true; // Accepter tous les codes de statut

// Instance Redis pour les tests
let redisClient: Redis | null = null;

// Configuration des services mock
const MOCK_SERVICES = {
  genkit: {
    url: 'http://localhost:3001',
    healthEndpoint: '/health'
  },
  restApi: {
    url: 'http://localhost:3002',
    healthEndpoint: '/health'
  },
  websocket: {
    url: 'http://localhost:3003',
    healthEndpoint: '/health'
  },
  prometheus: {
    url: 'http://localhost:9090',
    healthEndpoint: '/-/healthy'
  }
};

/**
 * Vérifie qu'un service est accessible
 */
async function checkServiceHealth(serviceName: string, url: string, endpoint: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}${endpoint}`, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      console.log(`✅ Service ${serviceName} est accessible`);
      return true;
    } else {
      console.warn(`⚠️  Service ${serviceName} répond avec le statut ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Service ${serviceName} non accessible:`, (error as Error).message);
    return false;
  }
}

/**
 * Vérifie que tous les services mock sont prêts
 */
async function waitForServices(maxAttempts = 30): Promise<void> {
  console.log('🔍 Vérification de la disponibilité des services mock...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const serviceChecks = Object.entries(MOCK_SERVICES).map(([name, config]) =>
      checkServiceHealth(name, config.url, config.healthEndpoint)
    );
    
    const results = await Promise.all(serviceChecks);
    const allServicesReady = results.every(Boolean);
    
    if (allServicesReady) {
      console.log(`✅ Tous les services mock sont prêts (tentative ${attempt}/${maxAttempts})`);
      return;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Tentative ${attempt}/${maxAttempts} - Attente des services...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('❌ Timeout: Les services mock ne sont pas tous prêts');
}

/**
 * Initialise la connexion Redis pour les tests
 */
async function initializeRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
    }
    
    // Vérifier si Redis est déjà démarré par le global setup
    if (!isRedisMemoryServerRunning()) {
      // Démarrer le serveur Redis en mémoire si pas déjà fait
      try {
        await startRedisMemoryServer();
        console.log('✅ Serveur Redis en mémoire démarré');
      } catch (error) {
        console.log('ℹ️ Erreur lors du démarrage Redis:', (error as Error).message);
        throw error;
      }
    } else {
      console.log('ℹ️ Serveur Redis en mémoire déjà démarré par le global setup');
    }
    
    // Utiliser le client Redis en mémoire
    redisClient = await createRedisTestClient();
    console.log('✅ Redis en mémoire connecté pour les tests');
    
  } catch (error) {
    console.error('❌ Erreur de connexion Redis en mémoire:', (error as Error).message);
    throw error;
  }
}

/**
 * Nettoie les données Redis entre les tests
 */
async function cleanupRedisData(): Promise<void> {
  try {
    await cleanRedisTestData();
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage Redis:', (error as Error).message);
  }
}

/**
 * Ferme la connexion Redis
 */
async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Connexion Redis fermée');
    } catch (error) {
      console.warn('⚠️  Erreur lors de la fermeture Redis:', (error as Error).message);
    }
    redisClient = null;
  }
}

/**
 * Génère des données de test reproductibles
 */
function generateTestData() {
  const seed = parseInt(process.env['TEST_DATA_SEED'] || '12345');
  
  // Générateur de nombres pseudo-aléatoires basé sur le seed
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  return {
    userId: `test-user-${Math.floor(random() * 1000)}`,
    conversationId: `test-conv-${Math.floor(random() * 1000)}`,
    message: 'Message de test pour l\'intégration',
    language: 'darija-latin',
    timestamp: new Date().toISOString()
  };
}

/**
 * Utilitaires disponibles dans les tests
 */
const testUtils = {
  /**
   * Fait une requête HTTP avec retry automatique
   */
  async makeRequest(url: string, options: Record<string, unknown> = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios(url, {
          timeout: 10000,
          validateStatus: () => true,
          ...options
        });
        return response;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    // This should never be reached, but TypeScript requires it
    throw new Error('Max retries exceeded');
  },
  
  /**
   * Attend qu'une condition soit vraie
   */
  async waitFor(condition: () => Promise<boolean>, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout: La condition n'a pas été remplie en ${timeout}ms`);
  },
  
  /**
   * Génère des données de test
   */
  generateTestData,
  
  /**
   * Accès à Redis pour les tests
   */
  get redis() {
    return redisClient;
  },
  
  /**
   * URLs des services mock
   */
  services: MOCK_SERVICES,
  
  /**
   * URLs des services mock (alias pour compatibilité)
   */
  serviceUrls: {
    genkit: MOCK_SERVICES.genkit.url,
    restApi: MOCK_SERVICES.restApi.url,
    websocket: MOCK_SERVICES.websocket.url,
    prometheus: MOCK_SERVICES.prometheus.url
  }
};

// Rendre les utilitaires disponibles globalement
(global as Record<string, unknown>)['testUtils'] = testUtils;

// Setup avant tous les tests d'intégration
beforeAll(async () => {
  console.log('🧪 === SETUP DES TESTS D\'INTÉGRATION ===');
  
  // Vérifier que les services mock sont prêts
  await waitForServices();
  
  // Initialiser Redis
  await initializeRedis();
  
  console.log('✅ Setup des tests d\'intégration terminé');
}, 60000); // 60 secondes de timeout pour le setup

// Cleanup après tous les tests d'intégration
afterAll(async () => {
  console.log('🧹 === CLEANUP DES TESTS D\'INTÉGRATION ===');
  
  // Fermer Redis
  await closeRedis();
  
  console.log('✅ Cleanup des tests d\'intégration terminé');
}, 30000); // 30 secondes de timeout pour le cleanup

// Setup avant chaque test
beforeEach(async () => {
  // Nettoyer les données Redis si activé
  if (process.env['TEST_DATA_RESET_BETWEEN_TESTS'] === 'true') {
    await cleanupRedisData();
  }
});

// Cleanup après chaque test
afterEach(async () => {
  // Nettoyer les données Redis si activé
  if (process.env['TEST_DATA_CLEANUP_ENABLED'] === 'true') {
    await cleanupRedisData();
  }
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection dans les tests:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception dans les tests:', error);
});

// Export des types pour TypeScript
export interface TestUtils {
  makeRequest: (url: string, options?: Record<string, unknown>, maxRetries?: number) => Promise<Record<string, unknown>>;
  waitFor: (condition: () => Promise<boolean>, timeout?: number) => Promise<boolean>;
  generateTestData: () => Record<string, unknown>;
  redis: Redis | null;
  services: typeof MOCK_SERVICES;
  serviceUrls: {
    genkit: string;
    restApi: string;
    websocket: string;
    prometheus: string;
  };
}

// Déclaration globale pour TypeScript
declare global {
  const testUtils: TestUtils;
}

export {};