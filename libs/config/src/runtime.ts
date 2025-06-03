/**
 * @file        Gestion de la configuration runtime depuis Firestore
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { RuntimeConfig, RedisConfig } from './types';
import { getEnvConfig, maskSensitiveValue } from './env';
import { getCached, setCached } from './cache';

const CACHE_KEY_RUNTIME = 'runtime-config';
const CACHE_TTL_RUNTIME = 300; // 5 minutes

/**
 * Initialise Firebase Admin SDK si ce n'est pas déjà fait
 */
function initializeFirebaseAdmin(): Firestore {
  try {
    // Vérifier si Firebase est déjà initialisé
    if (getApps().length > 0) {
      return getFirestore();
    }

    const envConfig = getEnvConfig();

    if (envConfig.googleApplicationCredentials) {
      // Utiliser le fichier de service account
      const serviceAccount = JSON.parse(
        readFileSync(envConfig.googleApplicationCredentials, 'utf8')
      );

      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || envConfig.gcpProjectId,
      });
    } else {
      // Utiliser les credentials par défaut (pour Cloud Run, etc.)
      initializeApp({
        projectId: envConfig.gcpProjectId,
      });
    }

    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw new Error('Firebase initialization failed. Check your credentials.');
  }
}

/**
 * Récupère la configuration runtime depuis Firestore
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  // Vérifier le cache d'abord
  const cached = getCached<RuntimeConfig>(CACHE_KEY_RUNTIME);
  if (cached) {
    return cached;
  }

  try {
    const db = initializeFirebaseAdmin();
    const configDoc = await db.collection('configs').doc('runtime').get();

    if (!configDoc.exists) {
      throw new Error('Runtime configuration not found in Firestore');
    }

    const data = configDoc.data() as RuntimeConfig;

    // Valider la configuration Redis
    if (!data.redis || !data.redis.url) {
      throw new Error('Redis configuration is missing or invalid');
    }

    // Mettre en cache
    setCached(CACHE_KEY_RUNTIME, data, CACHE_TTL_RUNTIME);

    return data;
  } catch (error) {
    console.error('Failed to fetch runtime configuration:', error);
    throw error;
  }
}

/**
 * Récupère uniquement la configuration Redis
 */
export async function getRedisConfigFromFirestore(): Promise<RedisConfig> {
  const runtimeConfig = await getRuntimeConfig();
  return runtimeConfig.redis;
}

/**
 * Met à jour la configuration runtime dans Firestore
 */
export async function updateRuntimeConfig(
  updates: Partial<RuntimeConfig>
): Promise<void> {
  try {
    const db = initializeFirebaseAdmin();
    const configRef = db.collection('configs').doc('runtime');

    await configRef.set(updates, { merge: true });

    // Invalider le cache
    setCached(CACHE_KEY_RUNTIME, null, 0);

    console.log('Runtime configuration updated successfully');
  } catch (error) {
    console.error('Failed to update runtime configuration:', error);
    throw error;
  }
}

/**
 * Met à jour spécifiquement la configuration Redis
 */
export async function updateRedisConfig(
  redisConfig: RedisConfig
): Promise<void> {
  await updateRuntimeConfig({ redis: redisConfig });
}

/**
 * Vérifie la santé de la configuration runtime
 */
export async function checkRuntimeConfigHealth(): Promise<{
  healthy: boolean;
  redis: boolean;
  lastUpdated?: string;
  errors: string[];
}> {
  const errors: string[] = [];
  let redisHealthy = false;
  let lastUpdated: string | undefined;

  try {
    const config = await getRuntimeConfig();

    // Vérifier Redis
    if (config.redis && config.redis.url) {
      redisHealthy = true;
      lastUpdated = config.redis.updatedAt;
    } else {
      errors.push('Redis configuration is missing or invalid');
    }

    // Vérifier la fraîcheur de la configuration
    if (lastUpdated) {
      const updateTime = new Date(lastUpdated).getTime();
      const now = Date.now();
      const ageHours = (now - updateTime) / (1000 * 60 * 60);

      if (ageHours > 24) {
        errors.push(`Configuration is ${Math.round(ageHours)} hours old`);
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch configuration: ${error}`);
  }

  return {
    healthy: errors.length === 0,
    redis: redisHealthy,
    lastUpdated,
    errors,
  };
}

/**
 * Retourne la configuration pour les logs (avec masquage des données sensibles)
 */
export async function getRuntimeConfigForLogs(): Promise<
  Record<string, unknown>
> {
  try {
    const config = await getRuntimeConfig();

    return {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        tls: config.redis.tls,
        url: config.redis.url
          ? maskSensitiveValue(config.redis.url)
          : 'not-set',
        auth: config.redis.auth ? 'set' : 'not-set',
        environment: config.redis.environment,
        updatedAt: config.redis.updatedAt,
      },
    };
  } catch (error) {
    return {
      error: 'Failed to fetch runtime configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
