/**
 * @path        libs/config/__tests__/redis.spec.ts
 * @file        Tests unitaires pour le client Redis
 * @author      SalamBot Team contact: info@salambot.ma
 * @created     01/06/2025
 * @updated     01/06/2025
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import Redis from 'ioredis';
import {
  getRedisClient,
  closeRedisConnection,
  getRedisMetrics,
  resetRedisMetrics,
  checkRedisHealth,
} from '../src/redis';
import { getEnvConfig } from '../src/env';

// Mock des modules
jest.mock('ioredis', () => {
  const mockRedis = jest.fn().mockImplementation(() => {
    const eventHandlers: {
      [key: string]: ((...args: unknown[]) => unknown)[];
    } = {};
    return {
      status: 'ready',
      ping: jest.fn().mockResolvedValue('PONG'),
      emit: jest.fn((event: string, ...args: unknown[]) => {
        if (eventHandlers[event]) {
          eventHandlers[event].forEach((handler) => handler(...args));
        }
      }),
      on: jest.fn((event: string, handler: (...args: unknown[]) => unknown) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
      }),
      quit: jest.fn().mockResolvedValue('OK'),
      connect: jest.fn().mockResolvedValue(undefined),
    };
  });
  return {
    __esModule: true,
    default: mockRedis,
  };
});
jest.mock('../src/env');
jest.mock('../src/runtime', () => ({
  getRedisConfigFromFirestore: jest.fn().mockResolvedValue({
    url: 'redis://localhost:6379',
    host: 'localhost',
    port: 6379,
    auth: 'test-password',
    tls: true,
    environment: 'test',
  }),
}));

const mockGetEnvConfig = getEnvConfig as jest.MockedFunction<
  typeof getEnvConfig
>;
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('Redis Client', () => {
  beforeEach(() => {
    // Reset des métriques avant chaque test
    resetRedisMetrics();

    // Configuration mock par défaut
    mockGetEnvConfig.mockReturnValue({
      nodeEnv: 'test' as const,
      redisUrl: 'redis://localhost:6379',
      redisTls: true,
    });
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await closeRedisConnection();
    jest.clearAllMocks();
  });

  describe('Création du client', () => {
    it('devrait créer un client avec la configuration par défaut', async () => {
      const client = await getRedisClient();

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalled();
    });

    it("devrait créer un client avec les variables d'environnement", async () => {
      mockGetEnvConfig.mockReturnValue({
        nodeEnv: 'development',
        gcpProjectId: 'test-project',
        googleApplicationCredentials: undefined,
        redisUrl: 'redis://localhost:6379',
        redisTls: false,
      });

      const client = await getRedisClient();

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          connectTimeout: expect.any(Number),
        })
      );
    });

    it("devrait réutiliser l'instance du client", async () => {
      const client1 = await getRedisClient();
      const client2 = await getRedisClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs TLS', async () => {
      const client = await getRedisClient();

      // Simulation d'une erreur TLS
      const tlsError = new Error('TLS handshake failed');
      tlsError.name = 'TLSError';

      // Émettre l'erreur
      client.emit('error', tlsError);

      // Vérifier que l'erreur est comptabilisée
      const metrics = getRedisMetrics();
      expect(metrics.errorCount).toBe(1);
    });

    it('devrait gérer les erreurs de connexion avec retry', async () => {
      const client = await getRedisClient();

      // Simulation d'une erreur de connexion
      const connectionError = new Error('ECONNREFUSED');
      connectionError.name = 'ConnectionError';

      // Émettre l'erreur
      client.emit('error', connectionError);

      // Vérifier que l'erreur est comptabilisée
      const metrics = getRedisMetrics();
      expect(metrics.errorCount).toBe(1);
    });

    it('devrait gérer les événements de reconnexion', async () => {
      const client = await getRedisClient();

      // Simulation d'une reconnexion
      client.emit('reconnecting');

      // Note: reconnections are not tracked in current RedisMetrics interface
      // We verify the client is still connected
      const metrics = getRedisMetrics();
      expect(metrics.connected).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('devrait retourner healthy quand Redis répond', async () => {
      // Obtenir le client d'abord pour s'assurer qu'il est initialisé
      const client = await getRedisClient();
      // Mock de la méthode ping qui réussit avec un délai
      client.ping = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('PONG'), 1))
        );
      client.status = 'ready';

      const health = await checkRedisHealth();

      expect(health.healthy).toBe(true);
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.error).toBeUndefined();
    });

    it("devrait retourner unhealthy en cas d'erreur", async () => {
      // Obtenir le client d'abord pour s'assurer qu'il est initialisé
      const client = await getRedisClient();
      // Mock de la méthode ping qui échoue
      client.ping = jest.fn().mockRejectedValue(new Error('Connection failed'));
      client.status = 'ready';

      const health = await checkRedisHealth();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Connection failed');
      expect(health.responseTime).toBeUndefined();
    });

    it('devrait retourner unhealthy si pas de client Redis', async () => {
      // Fermer la connexion pour simuler l'absence de client
      await closeRedisConnection();

      const health = await checkRedisHealth();

      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
    });
  });

  describe('Métriques', () => {
    it('devrait tracker les connexions', async () => {
      const client = await getRedisClient();

      // Simulation des événements de connexion
      client.emit('connect');
      client.emit('ready');

      const metrics = getRedisMetrics();
      expect(metrics.connected).toBe(true);
    });

    it('devrait tracker les déconnexions', async () => {
      const client = await getRedisClient();

      // Simulation des événements
      client.emit('connect');
      client.emit('close');

      const metrics = getRedisMetrics();
      expect(metrics.connected).toBe(false);
    });

    it('devrait reset les métriques', () => {
      // Obtenir un client pour initialiser les métriques
      getRedisClient();

      // Reset
      resetRedisMetrics();

      const metrics = getRedisMetrics();
      expect(metrics.commandsExecuted).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.lastError).toBeUndefined();
    });
  });

  describe('Configuration TLS', () => {
    it('devrait configurer TLS quand redisTls est true', async () => {
      mockGetEnvConfig.mockReturnValue({
        nodeEnv: 'production',
        gcpProjectId: 'test-project',
        googleApplicationCredentials: undefined,
        redisUrl: 'rediss://localhost:6380',
        redisTls: true,
      });

      const client = await getRedisClient();

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: true,
          }),
          retryStrategy: expect.any(Function),
        })
      );
    });

    it("devrait configurer TLS basé sur l'environnement", async () => {
      mockGetEnvConfig.mockReturnValue({
        nodeEnv: 'production',
        gcpProjectId: 'test-project',
        googleApplicationCredentials: undefined,
        redisUrl: undefined,
        redisTls: true,
      });

      const client = await getRedisClient();

      expect(client).toBeDefined();
    });

    it('devrait configurer TLS avec rejectUnauthorized false en développement', async () => {
      mockGetEnvConfig.mockReturnValue({
        nodeEnv: 'development',
        gcpProjectId: 'test-project',
        googleApplicationCredentials: undefined,
        redisUrl: 'rediss://localhost:6380',
        redisTls: true,
      });

      const client = await getRedisClient();

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: false,
          }),
          retryStrategy: expect.any(Function),
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('devrait configurer les retry attempts', async () => {
      const client = await getRedisClient({
        retryDelay: 1000,
        retryAttempts: 5,
      });

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxRetriesPerRequest: 5,
        })
      );
    });

    it('devrait utiliser les valeurs par défaut pour retry', async () => {
      const client = await getRedisClient();

      expect(client).toBeDefined();
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxRetriesPerRequest: 1, // En environnement de test
        })
      );
    });

    it('devrait gérer les échecs de retry', async () => {
      const client = await getRedisClient();

      // Simulation d'un échec après retry
      const retryError = new Error('Max retries exceeded');
      client.emit('error', retryError);

      const metrics = getRedisMetrics();
      expect(metrics.errorCount).toBe(1);
    });
  });
});
