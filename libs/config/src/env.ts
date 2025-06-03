/**
 * @file        Gestion des variables d'environnement
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { EnvConfig } from './types';

/**
 * Valide et retourne la configuration d'environnement
 */
export function getEnvConfig(): EnvConfig {
  const nodeEnv = process.env['NODE_ENV'] || 'development';

  // Validation de l'environnement
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: ${nodeEnv}. Must be one of: development, production, test`
    );
  }

  return {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    gcpProjectId: process.env['GCP_PROJECT_ID'],
    googleApplicationCredentials: process.env['GOOGLE_APPLICATION_CREDENTIALS'],
    redisUrl: process.env['REDIS_URL'],
    redisTls: process.env['REDIS_TLS'] === 'true',
  };
}

/**
 * Vérifie si toutes les variables d'environnement requises sont définies
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Retourne true si l'application s'exécute en mode production
 */
export function isProduction(): boolean {
  return getEnvConfig().nodeEnv === 'production';
}

/**
 * Retourne true si l'application s'exécute en mode développement
 */
export function isDevelopment(): boolean {
  return getEnvConfig().nodeEnv === 'development';
}

/**
 * Retourne true si l'application s'exécute en mode test
 */
export function isTest(): boolean {
  return getEnvConfig().nodeEnv === 'test';
}

/**
 * Masque les valeurs sensibles dans les logs
 */
export function maskSensitiveValue(value: string): string {
  if (!value || value.length < 8) {
    return '***';
  }

  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

/**
 * Retourne les variables d'environnement pour les logs (avec masquage)
 */
export function getEnvForLogs(): Record<string, string> {
  const config = getEnvConfig();

  return {
    NODE_ENV: config.nodeEnv,
    GCP_PROJECT_ID: config.gcpProjectId || 'not-set',
    GOOGLE_APPLICATION_CREDENTIALS: config.googleApplicationCredentials
      ? 'set'
      : 'not-set',
    REDIS_URL: config.redisUrl
      ? maskSensitiveValue(config.redisUrl)
      : 'not-set',
    REDIS_TLS: config.redisTls ? 'true' : 'false',
  };
}
