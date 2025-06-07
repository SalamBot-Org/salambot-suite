/**
 * Configuration Redis en Mémoire pour les Tests
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configure une instance Redis en mémoire pour les tests
 *              évitant les dépendances externes et garantissant l'isolation
 * @author SalamBot Platform Team
 * @created 2025-06-05
 */

import { RedisMemoryServer } from 'redis-memory-server';
import Redis from 'ioredis';
import { createServer } from 'net';

// Instance globale Redis en mémoire
let redisServer: RedisMemoryServer | null = null;
let redisClient: Redis | null = null;
let mockRedisPort: number | null = null;

// Détection de l'OS
const isWindows = process.platform === 'win32';

/**
 * Trouve un port disponible
 */
function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        if (port) {
          resolve(port);
        } else {
          reject(new Error('Unable to find available port'));
        }
      });
    });
  });
}

/**
 * Démarre une instance Redis en mémoire
 */
export async function startRedisMemoryServer(): Promise<{ host: string; port: number; url: string }> {
  try {
    console.log('🚀 Démarrage de Redis en mémoire...');
    
    // Nettoyer toute instance précédente
    if (redisServer) {
      try {
        await redisServer.stop();
      } catch (error) {
        console.warn('⚠️ Nettoyage instance Redis précédente:', error);
      }
      redisServer = null;
    }
    
    if (isWindows) {
      // Sur Windows, utiliser un port fixe et simuler Redis
      console.log('🪟 Détection Windows - utilisation du mode mock Redis');
      const host = '127.0.0.1';
      const port = 6380;
      mockRedisPort = port;
      
      // Mettre à jour les variables d'environnement
      const url = `redis://${host}:${port}`;
      process.env['REDIS_URL'] = url;
      process.env['REDIS_HOST'] = host;
      process.env['REDIS_PORT'] = port.toString();
      process.env['REDIS_MOCK_MODE'] = 'true';
      
      console.log(`✅ Redis mock configuré sur ${url}`);
      return { host, port, url };
    }
    
    // Sur Linux/macOS, utiliser redis-memory-server
    redisServer = new RedisMemoryServer({
      instance: {
        port: 6380, // Port différent pour éviter les conflits
        args: [
          '--save', '',
          '--appendonly', 'no',
          '--protected-mode', 'no',
          '--bind', '127.0.0.1',
          '--timeout', '0'
        ], // Configuration optimisée pour les tests
      },
      autoStart: false, // Démarrage manuel pour meilleur contrôle
    });
    
    // Démarrer le serveur avec timeout
    await Promise.race([
      redisServer.start(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Redis start')), 15000)
      )
    ]);
    
    // Attendre que le serveur soit vraiment prêt
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    const url = `redis://${host}:${port}`;
    
    // Tester la connexion
    const testClient = new Redis({
      host,
      port,
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
    
    try {
      await testClient.ping();
      await testClient.quit();
    } catch (error) {
      throw new Error(`Redis connection test failed: ${error}`);
    }
    
    // Mettre à jour les variables d'environnement
    process.env['REDIS_URL'] = url;
    process.env['REDIS_HOST'] = host;
    process.env['REDIS_PORT'] = port.toString();
    
    console.log(`✅ Redis en mémoire démarré sur ${url}`);
    
    return { host, port, url };
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de Redis en mémoire:', error);
    // Nettoyer en cas d'erreur
    if (redisServer) {
      try {
        await redisServer.stop();
      } catch (stopError) {
        console.warn('⚠️ Erreur lors du nettoyage Redis:', stopError);
      } finally {
        redisServer = null;
      }
    }
    throw error;
  }
}

/**
 * Crée un client Redis pour les tests
 */
export async function createRedisTestClient(): Promise<Redis> {
  if (isWindows && mockRedisPort) {
    // Mode mock sur Windows
    console.log('🪟 Création client Redis mock pour Windows');
    
    // Utiliser ioredis-mock pour simuler Redis
    const MockRedis = require('ioredis-mock');
    redisClient = new MockRedis({
      data: {}, // Données initiales vides
      keyPrefix: 'salambot:test:gateway:',
    });
    
    if (!redisClient) {
      throw new Error('Failed to create mock Redis client');
    }
    
    console.log('✅ Client Redis mock connecté');
    return redisClient;
  }
  
  if (!redisServer) {
    throw new Error('Redis memory server not started');
  }
  
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  
  redisClient = new Redis({
    host,
    port,
    db: 15, // Base de données de test
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keyPrefix: 'salambot:test:gateway:',
  });
  
  // Vérifier la connexion
  await redisClient.ping();
  console.log('✅ Client Redis de test connecté');
  
  return redisClient;
}

/**
 * Nettoie toutes les clés de test Redis
 */
export async function cleanRedisTestData(): Promise<void> {
  if (!redisClient) {
    return;
  }
  
  try {
    // Sur Windows avec mock, utiliser flushall pour simplifier
    if (isWindows && mockRedisPort) {
      await redisClient.flushall();
      console.log('🧹 Redis mock nettoyé (flushall)');
    } else {
      // Nettoyer les clés de test avec différents patterns
      const patterns = ['salambot:test:*', '*test-key*', 'test:*'];
      let totalDeleted = 0;
      
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          totalDeleted += keys.length;
        }
      }
      
      if (totalDeleted > 0) {
        console.log(`🧹 ${totalDeleted} clés de test Redis supprimées`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage Redis:', error);
  }
}

/**
 * Arrête l'instance Redis en mémoire
 */
export async function stopRedisMemoryServer(): Promise<void> {
  console.log('📦 Arrêt de Redis en mémoire...');
  
  // Fermer le client en premier
  if (redisClient) {
    try {
      if (isWindows && mockRedisPort) {
        // Mode mock sur Windows - pas besoin de quit
        console.log('🪟 Fermeture client Redis mock');
        redisClient.disconnect();
      } else {
        await Promise.race([
          redisClient.quit(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Client quit timeout')), 3000)
          )
        ]);
      }
      console.log('✅ Client Redis fermé');
    } catch (clientError) {
      console.warn('⚠️ Erreur lors de la fermeture du client Redis:', clientError);
      // Forcer la déconnexion
      try {
        redisClient.disconnect();
      } catch (disconnectError) {
        console.warn('⚠️ Erreur lors de la déconnexion forcée:', disconnectError);
      }
    } finally {
      redisClient = null;
    }
  }
  
  // Arrêter le serveur (seulement si pas en mode mock)
  if (redisServer && !isWindows) {
    try {
      await Promise.race([
        redisServer.stop(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server stop timeout')), 8000)
        )
      ]);
      console.log('✅ Redis en mémoire arrêté');
    } catch (serverError) {
      console.warn('⚠️ Erreur lors de l\'arrêt du serveur Redis:', serverError);
      // Tentative d'arrêt forcé
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance = (redisServer as any).instanceInfo?.instance;
        if (instance && instance.kill) {
          instance.kill('SIGKILL');
          console.warn('⚠️ Redis arrêté de force (SIGKILL)');
        }
      } catch (forceError) {
        console.warn('⚠️ Impossible d\'arrêter Redis de force:', forceError);
      }
    } finally {
      redisServer = null;
    }
  }
  
  // Nettoyer le mode mock
  if (isWindows && mockRedisPort) {
    console.log('✅ Redis mock arrêté');
    mockRedisPort = null;
  }
  
  // Nettoyer les variables d'environnement
  delete process.env['REDIS_URL'];
  delete process.env['REDIS_HOST'];
  delete process.env['REDIS_PORT'];
  delete process.env['REDIS_MOCK_MODE'];
}

/**
 * Obtient le client Redis de test actuel
 */
export function getRedisTestClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis test client not initialized');
  }
  return redisClient;
}

/**
 * Vérifie si Redis en mémoire est démarré
 */
export function isRedisMemoryServerRunning(): boolean {
  if (isWindows) {
    return mockRedisPort !== null;
  }
  return redisServer !== null;
}