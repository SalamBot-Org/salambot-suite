/**
 * @file        Client Redis configuré pour SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import Redis, { RedisOptions } from 'ioredis';
import { RedisConfig, RedisClientOptions, RedisMetrics, RedisEventCallback } from './types';
import { getEnvConfig, maskSensitiveValue } from './env';
import { getRedisConfigFromFirestore } from './runtime';
import { getCached, setCached } from './cache';

const CACHE_KEY_REDIS_CONFIG = 'redis-config';
const CACHE_TTL_REDIS_CONFIG = 300; // 5 minutes

/**
 * Métriques globales du client Redis
 */
let redisMetrics: RedisMetrics = {
  connected: false,
  commandsExecuted: 0,
  averageResponseTime: 0,
  errorCount: 0,
  lastError: undefined,
  lastConnectedAt: undefined
};

/**
 * Instance globale du client Redis
 */
let globalRedisClient: Redis | null = null;

/**
 * Callbacks pour les événements Redis
 */
const eventCallbacks: RedisEventCallback[] = [];

/**
 * Récupère la configuration Redis depuis les variables d'environnement ou Firestore
 */
async function getRedisConfig(): Promise<RedisConfig> {
  // Vérifier le cache d'abord
  const cached = getCached<RedisConfig>(CACHE_KEY_REDIS_CONFIG);
  if (cached) {
    return cached;
  }

  const envConfig = getEnvConfig();
  
  // Priorité aux variables d'environnement
  if (envConfig.redisUrl) {
    const config: RedisConfig = {
      url: envConfig.redisUrl,
      tls: envConfig.redisTls || false,
      environment: envConfig.nodeEnv
    };
    
    // Parser l'URL pour extraire les détails
    try {
      const url = new URL(envConfig.redisUrl);
      config.host = url.hostname;
      config.port = parseInt(url.port) || (url.protocol === 'rediss:' ? 6380 : 6379);
      config.auth = url.password || undefined;
      // TLS is enabled if explicitly set in env config OR if URL uses rediss protocol
      config.tls = envConfig.redisTls || url.protocol === 'rediss:';
    } catch (error) {
      console.warn('Failed to parse Redis URL from environment:', error);
    }
    
    setCached(CACHE_KEY_REDIS_CONFIG, config, CACHE_TTL_REDIS_CONFIG);
    return config;
  }
  
  // Sinon, récupérer depuis Firestore
  try {
    const config = await getRedisConfigFromFirestore();
    setCached(CACHE_KEY_REDIS_CONFIG, config, CACHE_TTL_REDIS_CONFIG);
    return config;
  } catch (error) {
    throw new Error(
      'Redis configuration not found. Please set REDIS_URL environment variable or configure it in Firestore.'
    );
  }
}

/**
 * Crée et configure un client Redis
 */
export async function getRedisClient(
  options: RedisClientOptions = {}
): Promise<Redis> {
  // Retourner l'instance globale si elle existe et est connectée
  if (globalRedisClient && globalRedisClient.status === 'ready') {
    return globalRedisClient;
  }

  const config = options.config || await getRedisConfig();
  
  try {
    // Configuration du client Redis
    const redisOptions: RedisOptions = {
      connectTimeout: options.connectTimeout || 10000,
      lazyConnect: true,
      maxRetriesPerRequest: options.retryAttempts || 3,
      enableReadyCheck: true
    };

    // Configuration TLS
    if (config.tls) {
      redisOptions.tls = {
        rejectUnauthorized: true
      };
    }

    // Créer le client Redis
    let redis: Redis;
    
    if (config.url) {
      redis = new Redis(config.url, redisOptions);
    } else if (config.host && config.port) {
      redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.auth,
        ...redisOptions
      });
    } else {
      throw new Error('Invalid Redis configuration: missing URL or host/port');
    }

    // Configurer les événements
    setupRedisEvents(redis, options.debug || false);
    
    // Connecter
    await redis.connect();
    
    // Tester la connexion
    await redis.ping();
    
    globalRedisClient = redis;
    redisMetrics.connected = true;
    redisMetrics.lastConnectedAt = new Date().toISOString();
    
    if (options.debug) {
      console.log('Redis client connected successfully', {
        host: config.host,
        port: config.port,
        tls: config.tls,
        environment: config.environment
      });
    }
    
    return redis;
  } catch (error) {
    redisMetrics.connected = false;
    redisMetrics.errorCount++;
    redisMetrics.lastError = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Failed to connect to Redis:', {
      error: error instanceof Error ? error.message : error,
      config: {
        host: config.host,
        port: config.port,
        tls: config.tls,
        url: config.url ? maskSensitiveValue(config.url) : 'not-set'
      }
    });
    
    throw error;
  }
}

/**
 * Configure les événements du client Redis
 */
function setupRedisEvents(redis: Redis, debug: boolean) {
  redis.on('connect', () => {
    redisMetrics.connected = true;
    redisMetrics.lastConnectedAt = new Date().toISOString();
    
    if (debug) {
      console.log('Redis connected');
    }
    
    eventCallbacks.forEach(callback => callback('connect'));
  });

  redis.on('ready', () => {
    if (debug) {
      console.log('Redis ready');
    }
    
    eventCallbacks.forEach(callback => callback('ready'));
  });

  redis.on('error', (error) => {
    redisMetrics.connected = false;
    redisMetrics.errorCount++;
    redisMetrics.lastError = error.message;
    
    console.error('Redis error:', error);
    eventCallbacks.forEach(callback => callback('error', error));
  });

  redis.on('close', () => {
    redisMetrics.connected = false;
    
    if (debug) {
      console.log('Redis connection closed');
    }
    
    eventCallbacks.forEach(callback => callback('close'));
  });

  redis.on('reconnecting', () => {
    if (debug) {
      console.log('Redis reconnecting...');
    }
    
    eventCallbacks.forEach(callback => callback('reconnecting'));
  });

  redis.on('end', () => {
    redisMetrics.connected = false;
    globalRedisClient = null;
    
    if (debug) {
      console.log('Redis connection ended');
    }
    
    eventCallbacks.forEach(callback => callback('end'));
  });
}

/**
 * Ferme la connexion Redis globale
 */
export async function closeRedisConnection(): Promise<void> {
  if (globalRedisClient) {
    await globalRedisClient.quit();
    globalRedisClient = null;
    redisMetrics.connected = false;
  }
}

/**
 * Retourne les métriques du client Redis
 */
export function getRedisMetrics(): RedisMetrics {
  return { ...redisMetrics };
}

/**
 * Ajoute un callback pour les événements Redis
 */
export function onRedisEvent(callback: RedisEventCallback): void {
  eventCallbacks.push(callback);
}

/**
 * Supprime un callback d'événement Redis
 */
export function offRedisEvent(callback: RedisEventCallback): void {
  const index = eventCallbacks.indexOf(callback);
  if (index > -1) {
    eventCallbacks.splice(index, 1);
  }
}

/**
 * Vérifie la santé de la connexion Redis
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  connected: boolean;
  responseTime?: number;
  error?: string;
}> {
  try {
    if (!globalRedisClient || globalRedisClient.status !== 'ready') {
      return {
        healthy: false,
        connected: false,
        error: 'Redis client not connected'
      };
    }

    const start = Date.now();
    await globalRedisClient.ping();
    const responseTime = Date.now() - start;
    
    // Mettre à jour les métriques
    redisMetrics.commandsExecuted++;
    redisMetrics.averageResponseTime = 
      (redisMetrics.averageResponseTime + responseTime) / 2;
    
    return {
      healthy: true,
      connected: true,
      responseTime
    };
  } catch (error) {
    redisMetrics.errorCount++;
    redisMetrics.lastError = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      healthy: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Réinitialise les métriques Redis
 */
export function resetRedisMetrics(): void {
  redisMetrics = {
    connected: globalRedisClient?.status === 'ready' || false,
    commandsExecuted: 0,
    averageResponseTime: 0,
    errorCount: 0,
    lastError: undefined,
    lastConnectedAt: redisMetrics.lastConnectedAt
  };
}