/**
 * @file        Types TypeScript pour la bibliothèque Config
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/**
 * Configuration Redis
 */
export interface RedisConfig {
  /** URL de connexion Redis */
  url: string;
  /** Activation du TLS */
  tls: boolean;
  /** Host Redis */
  host?: string;
  /** Port Redis */
  port?: number;
  /** Mot de passe d'authentification */
  auth?: string;
  /** Date de dernière mise à jour */
  updatedAt?: string;
  /** Environnement */
  environment?: string;
}

/**
 * Configuration d'environnement
 */
export interface EnvConfig {
  /** Environnement Node.js */
  nodeEnv: 'development' | 'production' | 'test';
  /** ID du projet Google Cloud */
  gcpProjectId?: string;
  /** Chemin vers les credentials Google Cloud */
  googleApplicationCredentials?: string;
  /** URL Redis depuis les variables d'environnement */
  redisUrl?: string;
  /** Activation TLS Redis depuis les variables d'environnement */
  redisTls?: boolean;
}

/**
 * Configuration runtime récupérée depuis Firestore
 */
export interface RuntimeConfig {
  /** Configuration Redis */
  redis: RedisConfig;
  /** Autres configurations runtime */
  [key: string]: unknown;
}

/**
 * Options pour le client Redis
 */
export interface RedisClientOptions {
  /** Configuration Redis personnalisée */
  config?: RedisConfig;
  /** Timeout de connexion en millisecondes */
  connectTimeout?: number;
  /** Nombre de tentatives de reconnexion */
  retryAttempts?: number;
  /** Délai entre les tentatives de reconnexion */
  retryDelay?: number;
  /** Activation des logs de debug */
  debug?: boolean;
}

/**
 * Métriques de connexion Redis
 */
export interface RedisMetrics {
  /** Statut de la connexion */
  connected: boolean;
  /** Nombre de commandes exécutées */
  commandsExecuted: number;
  /** Temps de réponse moyen en millisecondes */
  averageResponseTime: number;
  /** Nombre d'erreurs */
  errorCount: number;
  /** Dernière erreur */
  lastError?: string;
  /** Timestamp de la dernière connexion */
  lastConnectedAt?: string;
}

/**
 * Configuration de cache
 */
export interface CacheConfig {
  /** TTL par défaut en secondes */
  defaultTtl: number;
  /** Taille maximale du cache */
  maxSize: number;
  /** Activation du cache */
  enabled: boolean;
}

/**
 * Événements du client Redis
 */
export type RedisEvent = 
  | 'connect'
  | 'ready'
  | 'error'
  | 'close'
  | 'reconnecting'
  | 'end';

/**
 * Callback pour les événements Redis
 */
export type RedisEventCallback = (event: RedisEvent, data?: unknown) => void;