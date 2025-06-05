/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  📝 SalamBot API Gateway - Types TypeScript                │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Définitions de types pour l'API Gateway                │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request } from 'express';

/**
 * 📝 TYPES API GATEWAY ENTERPRISE 📝
 * 
 * 📖 Mission: Définir les types TypeScript pour l'API Gateway
 * 🎭 Fonctionnalités:
 *   • 🏗️ Types pour la configuration
 *   • 👤 Types pour l'authentification
 *   • 📊 Types pour les métriques
 *   • 🔄 Types pour les proxies
 * 
 * 🏆 Objectifs Opérationnels:
 *   • Type safety complet
 *   • IntelliSense optimal
 *   • Documentation intégrée
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

// ═══════════════════════════════════════════════════════════════
// 🔧 TYPES DE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * 🔧 Configuration principale de l'API Gateway
 */
export interface GatewayConfig {
  /** 🌍 Environnement d'exécution */
  environment: 'development' | 'staging' | 'production';
  
  /** 🚪 Port d'écoute du serveur */
  port: number;
  
  /** 🔒 Configuration de sécurité */
  security: SecurityConfig;
  
  /** 🌐 Configuration CORS */
  cors: CorsConfig;
  
  /** 🚦 Configuration du rate limiting */
  rateLimit: RateLimitConfig;
  
  /** 🔄 Configuration des services */
  services: ServicesConfig;
  
  /** 📊 Configuration des métriques */
  metrics: MetricsConfig;
  
  /** 📝 Configuration du logging */
  logging: LoggingConfig;
  
  /** 🏥 Configuration des health checks */
  healthCheck: HealthCheckConfig;
  
  /** ⚡ Configuration du cache */
  cache: CacheConfig;
}

/**
 * 🔒 Configuration de sécurité
 */
export interface SecurityConfig {
  /** 🔑 Secret JWT */
  jwtSecret: string;
  
  /** ⏰ Durée de vie du token JWT (en secondes) */
  jwtExpiresIn: number;
  
  /** 🔐 Clés API autorisées */
  apiKeys: string[];
  
  /** 🛡️ Endpoints publics (sans authentification) */
  publicEndpoints: string[];
  
  /** 🔒 Configuration HTTPS */
  https: {
    enabled: boolean;
    cert?: string;
    key?: string;
  };
}

/**
 * 🌐 Configuration CORS
 */
export interface CorsConfig {
  /** ✅ CORS activé */
  enabled: boolean;
  
  /** 🌍 Origines autorisées */
  origins: string[];
  
  /** 📋 Méthodes autorisées */
  methods: string[];
  
  /** 📝 Headers autorisés */
  allowedHeaders: string[];
  
  /** 🍪 Credentials autorisés */
  credentials: boolean;
}

/**
 * 🚦 Configuration du rate limiting
 */
export interface RateLimitConfig {
  /** ⏰ Fenêtre de temps (en ms) */
  windowMs: number;
  
  /** 🔢 Nombre maximum de requêtes */
  max: number;
  
  /** 📝 Message d'erreur personnalisé */
  message: string;
  
  /** 🎯 Rate limits spécifiques par endpoint */
  endpoints: {
    [path: string]: {
      windowMs: number;
      max: number;
    };
  };
}

/**
 * 🔄 Configuration des services
 */
export interface ServicesConfig {
  /** 🤖 Service Genkit Flows */
  genkitFlows: string;
  
  /** 🔄 API REST */
  restApi: string;
  
  /** 🌐 WebSocket */
  websocket: string;
}

/**
 * 📊 Configuration des métriques
 */
export interface MetricsConfig {
  /** ✅ Métriques activées */
  enabled: boolean;
  
  /** 📊 Format d'export (prometheus, json) */
  format: 'prometheus' | 'json' | 'both';
  
  /** 📍 Endpoint des métriques */
  endpoint: string;
  
  /** 🏷️ Labels par défaut */
  defaultLabels: { [key: string]: string };
}

/**
 * 📝 Configuration du logging
 */
export interface LoggingConfig {
  /** 📊 Niveau de log */
  level: 'error' | 'warn' | 'info' | 'debug';
  
  /** 📄 Format de sortie */
  format: 'json' | 'text';
  
  /** 📁 Fichier de log */
  file?: string;
  
  /** 🔄 Rotation des logs */
  rotation: {
    enabled: boolean;
    maxSize: string;
    maxFiles: number;
  };
}

/**
 * 🏥 Configuration des health checks
 */
export interface HealthCheckConfig {
  /** ✅ Health checks activés */
  enabled: boolean;
  
  /** ⏰ Intervalle de vérification (en ms) */
  interval: number;
  
  /** ⏱️ Timeout pour les checks (en ms) */
  timeout: number;
  
  /** 🎯 Services à vérifier */
  services: string[];
}

/**
 * ⚡ Configuration du cache
 */
export interface CacheConfig {
  /** ✅ Cache activé */
  enabled: boolean;
  
  /** 🔧 Type de cache (memory, redis) */
  type: 'memory' | 'redis';
  
  /** ⏰ TTL par défaut (en secondes) */
  defaultTtl: number;
  
  /** 🔗 Configuration Redis */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 👤 TYPES D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * 👤 Utilisateur authentifié
 */
export interface AuthenticatedUser {
  /** 🆔 Identifiant unique */
  id: string;
  
  /** 📧 Email */
  email?: string;
  
  /** 👤 Nom d'utilisateur */
  username?: string;
  
  /** 🎭 Rôle principal */
  role: 'admin' | 'user' | 'service' | 'guest';
  
  /** 🏷️ Rôles */
  roles?: string[];
  
  /** 🔑 Permissions */
  permissions: string[];
  
  /** 🔑 Clé API */
  apiKey?: string;
  
  /** 🏢 Tenant */
  tenant?: string;
  
  /** ⏰ Date de création du token */
  iat?: number;
  
  /** ⏰ Date d'expiration du token */
  exp?: number;
  
  /** 🏢 Organisation */
  organization?: string;
  
  /** 📊 Métadonnées */
  metadata?: { [key: string]: any };
}

/**
 * 🔑 Payload JWT
 */
export interface JwtPayload {
  /** 🆔 Subject (user ID) */
  sub: string;
  
  /** 📧 Email */
  email: string;
  
  /** 🏷️ Rôles */
  roles: string[];
  
  /** 🔑 Permissions */
  permissions: string[];
  
  /** ⏰ Issued at */
  iat: number;
  
  /** ⏰ Expires at */
  exp: number;
  
  /** 🎯 Audience */
  aud?: string;
  
  /** 🏢 Issuer */
  iss?: string;
}

/**
 * 🔐 Contexte d'authentification
 */
export interface AuthContext {
  /** 👤 Utilisateur */
  user?: AuthenticatedUser;
  
  /** 🔑 Token */
  token?: string;
  
  /** 🔐 Type d'authentification */
  authType: 'jwt' | 'apikey' | 'none';
  
  /** ✅ Authentifié */
  isAuthenticated: boolean;
  
  /** 🔑 Permissions */
  permissions: string[];
}

// ═══════════════════════════════════════════════════════════════
// 📊 TYPES DE MÉTRIQUES
// ═══════════════════════════════════════════════════════════════

/**
 * 📊 Métrique de base
 */
export interface Metric {
  /** 📝 Nom de la métrique */
  name: string;
  
  /** 📊 Type de métrique */
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  
  /** 💰 Valeur */
  value: number;
  
  /** 🏷️ Labels */
  labels: { [key: string]: string };
  
  /** ⏰ Timestamp */
  timestamp: number;
  
  /** 📝 Description */
  description?: string;
}

/**
 * 📈 Compteur
 */
export interface Counter extends Metric {
  type: 'counter';
}

/**
 * 📊 Gauge
 */
export interface Gauge extends Metric {
  type: 'gauge';
}

/**
 * 📊 Histogramme
 */
export interface Histogram extends Metric {
  type: 'histogram';
  /** 🪣 Buckets */
  buckets: { [le: string]: number };
  /** 📊 Somme */
  sum: number;
  /** 🔢 Nombre d'observations */
  count: number;
}

/**
 * 📊 Résumé de métriques
 */
export interface MetricsSummary {
  /** 🔢 Nombre total de requêtes */
  totalRequests: number;
  
  /** ✅ Requêtes réussies */
  successfulRequests: number;
  
  /** ❌ Requêtes échouées */
  failedRequests: number;
  
  /** ⏱️ Temps de réponse moyen */
  averageResponseTime: number;
  
  /** 📊 Requêtes par seconde */
  requestsPerSecond: number;
  
  /** 💾 Utilisation mémoire */
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  /** 🖥️ Utilisation CPU */
  cpuUsage: number;
  
  /** ⏰ Uptime */
  uptime: number;
}

// ═══════════════════════════════════════════════════════════════
// 🔄 TYPES DE PROXY
// ═══════════════════════════════════════════════════════════════

/**
 * 🔄 Configuration de proxy
 */
export interface ProxyConfig {
  /** 🎯 URL cible */
  target: string;
  
  /** 🔄 Réécriture de chemin */
  pathRewrite?: { [key: string]: string };
  
  /** 🌍 Changer l'origine */
  changeOrigin: boolean;
  
  /** ⏱️ Timeout (en ms) */
  timeout: number;
  
  /** 🔄 Nombre de tentatives */
  retries: number;
  
  /** 🔴 Configuration du circuit breaker */
  circuitBreaker: CircuitBreakerConfig;
  
  /** 🏥 Configuration du health check */
  healthCheck: ProxyHealthCheckConfig;
}

/**
 * 🔴 Configuration du circuit breaker
 */
export interface CircuitBreakerConfig {
  /** ✅ Activé */
  enabled: boolean;
  
  /** 🚨 Seuil d'échecs */
  threshold: number;
  
  /** ⏱️ Timeout avant nouvelle tentative (en ms) */
  timeout: number;
}

/**
 * 🏥 Configuration du health check pour proxy
 */
export interface ProxyHealthCheckConfig {
  /** ✅ Activé */
  enabled: boolean;
  
  /** 📍 Chemin du health check */
  path: string;
  
  /** ⏰ Intervalle (en ms) */
  interval: number;
}

/**
 * 🔴 État du circuit breaker
 */
export interface CircuitBreakerState {
  /** 🔴 Circuit ouvert */
  isOpen: boolean;
  
  /** 🔢 Nombre d'échecs */
  failures: number;
  
  /** ⏰ Dernier échec */
  lastFailure: number;
  
  /** ⏰ Prochaine tentative */
  nextAttempt: number;
}

/**
 * 🏥 État de santé d'un service
 */
export interface ServiceHealthState {
  /** ✅ En bonne santé */
  isHealthy: boolean;
  
  /** ⏰ Dernière vérification */
  lastCheck: number;
  
  /** ⏱️ Temps de réponse */
  responseTime: number;
}

// ═══════════════════════════════════════════════════════════════
// 🌐 TYPES DE REQUÊTE/RÉPONSE
// ═══════════════════════════════════════════════════════════════

/**
 * 🌐 Requête Express étendue
 */
export interface ExtendedRequest extends Request {
  /** 👤 Utilisateur authentifié */
  user?: AuthenticatedUser;
  
  /** 🔑 Contexte d'authentification */
  auth?: AuthContext;
  
  /** 🆔 ID de requête unique */
  requestId?: string;
  
  /** ⏰ Timestamp de début */
  startTime?: number;
  
  /** 📊 Métadonnées de la requête */
  metadata?: { [key: string]: any };
}

/**
 * 📤 Réponse API standardisée
 */
export interface ApiResponse<T = any> {
  /** ✅ Succès */
  success: boolean;
  
  /** 📊 Données */
  data?: T;
  
  /** ❌ Erreur */
  error?: ApiError;
  
  /** 📋 Métadonnées */
  meta?: {
    /** ⏰ Timestamp */
    timestamp: string;
    
    /** 🆔 ID de requête */
    requestId?: string;
    
    /** ⏱️ Temps de réponse */
    responseTime?: number;
    
    /** 📄 Pagination */
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * ❌ Erreur API
 */
export interface ApiError {
  /** 🔢 Code d'erreur */
  code: string;
  
  /** 📝 Message */
  message: string;
  
  /** 📋 Détails */
  details?: any;
  
  /** 📍 Chemin de l'erreur */
  path?: string;
  
  /** ⏰ Timestamp */
  timestamp?: string;
  
  /** 🔗 Lien vers la documentation */
  documentation?: string;
}

// ═══════════════════════════════════════════════════════════════
// 🏥 TYPES DE HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * 🏥 État de santé
 */
export interface HealthStatus {
  /** ✅ Statut global */
  status: 'healthy' | 'unhealthy' | 'degraded';
  
  /** ⏰ Timestamp */
  timestamp: string;
  
  /** ⏱️ Uptime */
  uptime: number;
  
  /** 📊 Checks individuels */
  checks: { [name: string]: HealthCheck };
  
  /** 📊 Métriques système */
  system?: SystemMetrics;
}

/**
 * 🏥 Check de santé individuel
 */
export interface HealthCheck {
  /** ✅ Statut */
  status: 'pass' | 'fail' | 'warn';
  
  /** ⏱️ Temps de réponse */
  responseTime: number;
  
  /** 📝 Message */
  message?: string;
  
  /** 📊 Détails */
  details?: any;
  
  /** ⏰ Dernière vérification */
  lastCheck: string;
}

/**
 * 📊 Métriques système
 */
export interface SystemMetrics {
  /** 💾 Mémoire */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  
  /** 🖥️ CPU */
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  
  /** 💽 Disque */
  disk?: {
    used: number;
    total: number;
    percentage: number;
  };
  
  /** 🌐 Réseau */
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 📝 TYPES DE VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * 📝 Règle de validation
 */
export interface ValidationRule {
  /** 📝 Nom du champ */
  field: string;
  
  /** 🔧 Type attendu */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  
  /** ✅ Requis */
  required: boolean;
  
  /** 📏 Contraintes */
  constraints?: {
    /** 📏 Longueur minimum */
    minLength?: number;
    
    /** 📏 Longueur maximum */
    maxLength?: number;
    
    /** 🔢 Valeur minimum */
    min?: number;
    
    /** 🔢 Valeur maximum */
    max?: number;
    
    /** 🎭 Pattern regex */
    pattern?: string;
    
    /** 📋 Valeurs autorisées */
    enum?: any[];
  };
  
  /** 📝 Message d'erreur personnalisé */
  message?: string;
}

/**
 * ❌ Erreur de validation
 */
export interface ValidationError {
  /** 📝 Champ en erreur */
  field: string;
  
  /** 💰 Valeur fournie */
  value: any;
  
  /** 📝 Message d'erreur */
  message: string;
  
  /** 🔧 Type attendu */
  expectedType?: string;
  
  /** 📏 Contrainte violée */
  constraint?: string;
}

// ═══════════════════════════════════════════════════════════════
// 📊 TYPES D'ÉVÉNEMENTS
// ═══════════════════════════════════════════════════════════════

/**
 * 📊 Événement de l'API Gateway
 */
export interface GatewayEvent {
  /** 🆔 ID unique */
  id: string;
  
  /** 🏷️ Type d'événement */
  type: 'request' | 'response' | 'error' | 'metric' | 'health' | 'auth';
  
  /** ⏰ Timestamp */
  timestamp: number;
  
  /** 📊 Données de l'événement */
  data: any;
  
  /** 📝 Métadonnées */
  metadata?: { [key: string]: any };
}

/**
 * 📊 Événement de requête
 */
export interface RequestEvent extends GatewayEvent {
  type: 'request';
  data: {
    method: string;
    path: string;
    headers: { [key: string]: string };
    query: { [key: string]: any };
    body?: any;
    ip: string;
    userAgent: string;
    requestId: string;
    userId?: string;
  };
}

/**
 * 📊 Événement de réponse
 */
export interface ResponseEvent extends GatewayEvent {
  type: 'response';
  data: {
    statusCode: number;
    responseTime: number;
    contentLength: number;
    requestId: string;
    userId?: string;
  };
}

/**
 * ❌ Événement d'erreur
 */
export interface ErrorEvent extends GatewayEvent {
  type: 'error';
  data: {
    error: string;
    stack?: string;
    statusCode: number;
    requestId: string;
    userId?: string;
    service?: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// 🔧 TYPES UTILITAIRES
// ═══════════════════════════════════════════════════════════════

/**
 * 🔧 Type partiel récursif
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 🔧 Type requis récursif
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 🔧 Clés optionnelles
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * 🔧 Clés requises
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * 🔧 Type avec clés optionnelles
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 🔧 Type avec clés requises
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  GatewayConfig,
  AuthenticatedUser,
  ApiResponse,
  HealthStatus,
  Metric,
  ProxyConfig,
  ValidationRule,
  GatewayEvent
};