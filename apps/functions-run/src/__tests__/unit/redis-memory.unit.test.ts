/**
 * Tests Unitaires - Redis Memory Setup
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Tests unitaires pour la configuration Redis en mémoire
 * @author SalamBot Platform Team
 * @created 2025-01-27
 */

import { 
  startRedisMemoryServer, 
  stopRedisMemoryServer, 
  createRedisTestClient, 
  cleanRedisTestData,
  getRedisTestClient,
  isRedisMemoryServerRunning
} from '../redis-memory-setup';
import Redis from 'ioredis';

describe('Redis Memory Setup', () => {
  let redisClient: Redis | null = null;

  afterEach(async () => {
    // Nettoyer après chaque test
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
      redisClient = null;
    }
    
    try {
      await stopRedisMemoryServer();
    } catch (error) {
      // Ignorer les erreurs d'arrêt
    }
  });

  describe('startRedisMemoryServer', () => {
    test('devrait démarrer une instance Redis en mémoire', async () => {
      const result = await startRedisMemoryServer();
      
      expect(result).toHaveProperty('host');
      expect(result).toHaveProperty('port');
      expect(result).toHaveProperty('url');
      expect(result.host).toBe('127.0.0.1');
      expect(result.port).toBeGreaterThan(0);
      expect(result.url).toMatch(/^redis:\/\/127\.0\.0\.1:\d+$/);
      
      // Vérifier que les variables d'environnement sont définies
      expect(process.env['REDIS_URL']).toBe(result.url);
      expect(process.env['REDIS_HOST']).toBe(result.host);
      expect(process.env['REDIS_PORT']).toBe(result.port.toString());
    });

    test('devrait indiquer que le serveur est en cours d\'exécution', async () => {
      expect(isRedisMemoryServerRunning()).toBe(false);
      
      await startRedisMemoryServer();
      
      expect(isRedisMemoryServerRunning()).toBe(true);
    });
  });

  describe('createRedisTestClient', () => {
    beforeEach(async () => {
      await startRedisMemoryServer();
    });

    test('devrait créer un client Redis fonctionnel', async () => {
      await startRedisMemoryServer();
      redisClient = await createRedisTestClient();
      
      // Sur Windows, on utilise ioredis-mock, sinon Redis
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        expect(redisClient.constructor.name).toBe('_RedisMock');
      } else {
        expect(redisClient).toBeInstanceOf(Redis);
      }
      expect(getRedisTestClient()).toBe(redisClient);
      
      // Tester la connexion
      const pong = await redisClient.ping();
      expect(pong).toBe('PONG');
    });

    test('devrait configurer le préfixe de clé correct', async () => {
      redisClient = await createRedisTestClient();
      
      await redisClient.set('test-key', 'test-value');
      
      // Vérifier que la clé a le bon préfixe
      const keys = await redisClient.keys('*');
      expect(keys).toContain('salambot:test:gateway:test-key');
    });

    test('devrait lever une erreur si le serveur n\'est pas démarré', async () => {
      await stopRedisMemoryServer();
      
      await expect(createRedisTestClient()).rejects.toThrow('Redis memory server not started');
    });
  });

  describe('cleanRedisTestData', () => {
    beforeEach(async () => {
      await startRedisMemoryServer();
      redisClient = await createRedisTestClient();
    });

    test('devrait nettoyer les clés de test', async () => {
      // Nettoyer d'abord pour s'assurer qu'on part d'un état propre
      await redisClient!.flushall();
      
      // Ajouter des données de test
      await redisClient!.set('test-key-1', 'value1');
      await redisClient!.set('test-key-2', 'value2');
      
      // Vérifier que les données existent
      let keys = await redisClient!.keys('*test-key*');
      expect(keys.length).toBe(2);
      
      // Nettoyer
      await cleanRedisTestData();
      
      // Vérifier que les données sont supprimées
      keys = await redisClient!.keys('*test-key*');
      expect(keys.length).toBe(0);
    });

    test('devrait gérer le cas où il n\'y a pas de client Redis', async () => {
      await stopRedisMemoryServer();
      
      // Ne devrait pas lever d'erreur
      await expect(cleanRedisTestData()).resolves.toBeUndefined();
    });
  });

  describe('stopRedisMemoryServer', () => {
    test('devrait arrêter le serveur Redis proprement', async () => {
      await startRedisMemoryServer();
      redisClient = await createRedisTestClient();
      
      expect(isRedisMemoryServerRunning()).toBe(true);
      expect(getRedisTestClient()).not.toBeNull();
      
      await stopRedisMemoryServer();
      
      expect(isRedisMemoryServerRunning()).toBe(false);
      expect(() => getRedisTestClient()).toThrow('Redis test client not initialized');
    });

    test('devrait gérer l\'arrêt multiple sans erreur', async () => {
      await startRedisMemoryServer();
      
      // Premier arrêt
      await stopRedisMemoryServer();
      expect(isRedisMemoryServerRunning()).toBe(false);
      
      // Deuxième arrêt (ne devrait pas lever d'erreur)
      await expect(stopRedisMemoryServer()).resolves.toBeUndefined();
    });
  });

  describe('getRedisTestClient', () => {
    test('devrait lever une erreur si aucun client n\'est créé', () => {
      expect(() => getRedisTestClient()).toThrow('Redis test client not initialized');
    });

    test('devrait retourner le client actuel après création', async () => {
      await startRedisMemoryServer();
      redisClient = await createRedisTestClient();
      
      expect(getRedisTestClient()).toBe(redisClient);
    });
  });

  describe('isRedisMemoryServerRunning', () => {
    test('devrait retourner false initialement', () => {
      expect(isRedisMemoryServerRunning()).toBe(false);
    });

    test('devrait retourner true après démarrage', async () => {
      await startRedisMemoryServer();
      expect(isRedisMemoryServerRunning()).toBe(true);
    });

    test('devrait retourner false après arrêt', async () => {
      await startRedisMemoryServer();
      await stopRedisMemoryServer();
      expect(isRedisMemoryServerRunning()).toBe(false);
    });
  });
});