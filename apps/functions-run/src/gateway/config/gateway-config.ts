/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  ⚙️ SalamBot API Gateway - Configuration Enterprise        │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Configuration centralisée pour l'API Gateway           │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

/**
 * 🌟 CONFIGURATION API GATEWAY ENTERPRISE 🌟
 * 
 * 📖 Mission: Configuration centralisée et typée pour l'API Gateway
 * 🎭 Fonctionnalités:
 *   • 🔧 Configuration par environnement (dev/staging/prod)
 *   • 🛡️ Paramètres de sécurité (rate limiting, CORS, auth)
 *   • 🌐 URLs des microservices et domaines
 *   • 📊 Configuration monitoring et logging
 * 
 * 🏆 Objectifs:
 *   • Configuration type-safe
 *   • Validation des paramètres
 *   • Gestion multi-environnement
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

export interface ServiceEndpoints {
  /** 🤖 Service Genkit Flows (IA conversationnelle) */
  genkitFlows: string;
  /** 🔗 API REST classique */
  restApi: string;
  /** 💬 Service WebSocket (chat temps réel) */
  websocket: string;
  /** 📊 Service de métriques */
  metrics?: string;
  /** 🔍 Service de logging */
  logging?: string;
}

export interface RateLimitConfig {
  /** 🌍 Limite globale par IP (requêtes/15min) */
  global: number;
  /** 🤖 Limite spécifique IA (requêtes/min) */
  ai: number;
  /** 🔗 Limite API REST (requêtes/min) */
  api: number;
  /** 💬 Limite WebSocket (connexions simultanées) */
  websocket: number;
}

export interface SecurityConfig {
  /** 🔐 Clé secrète JWT */
  jwtSecret: string;
  /** ⏰ Durée de validité des tokens (en secondes) */
  jwtExpiration: number;
  /** 🔑 Clés API autorisées */
  apiKeys: string[];
  /** 🛡️ Activation de l'authentification */
  authEnabled: boolean;
  /** 🔒 HTTPS obligatoire en production */
  httpsOnly: boolean;
}

export interface MonitoringConfig {
  /** 📊 Activation des métriques Prometheus */
  prometheusEnabled: boolean;
  /** 📝 Niveau de logging (debug, info, warn, error) */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 🔍 Activation du tracing distribué */
  tracingEnabled: boolean;
  /** 📈 Endpoint Grafana */
  grafanaUrl?: string;
}

export interface GatewayConfig {
  /** 🌐 Port d'écoute du serveur */
  port: number;
  /** 🏷️ Environnement d'exécution */
  environment: 'development' | 'staging' | 'production';
  /** 🔧 Mode développement */
  isDevelopment: boolean;
  /** 🌍 Domaines autorisés */
  allowedDomains: string[];
  /** 🔗 Configuration des services */
  services: ServiceEndpoints;
  /** 🚦 Configuration rate limiting */
  rateLimit: RateLimitConfig;
  /** 🛡️ Configuration sécurité */
  security: SecurityConfig;
  /** 📊 Configuration monitoring */
  monitoring: MonitoringConfig;
}

/**
 * 🏭 Factory pour créer la configuration selon l'environnement
 */
export class GatewayConfigFactory {
  /**
   * 🔧 Crée la configuration pour l'environnement spécifié
   */
  static create(environment?: string): GatewayConfig {
    const env = environment || process.env['NODE_ENV'] || 'development';
    
    switch (env) {
      case 'production':
        return this.createProductionConfig();
      case 'staging':
        return this.createStagingConfig();
      default:
        return this.createDevelopmentConfig();
    }
  }

  /**
   * 🚀 Configuration Production
   */
  private static createProductionConfig(): GatewayConfig {
    return {
      port: parseInt(process.env['PORT'] || '3000'),
      environment: 'production',
      isDevelopment: false,
      allowedDomains: [
        'https://salambot.ma',
        'https://salambot.app',
        'https://api.salambot.app',
        'https://docs.salambot.app',
        'https://grafana.salambot.app'
      ],
      services: {
        genkitFlows: process.env['GENKIT_FLOWS_URL'] || 'http://localhost:3001',
        restApi: process.env['REST_API_URL'] || 'http://localhost:3002',
        websocket: process.env['WEBSOCKET_URL'] || 'http://localhost:3003',
        metrics: process.env['METRICS_URL'] || 'http://localhost:9090',
        logging: process.env['LOGGING_URL'] || 'http://localhost:3100'
      },
      rateLimit: {
        global: 1000, // 1000 req/15min par IP
        ai: 100,      // 100 req/min pour l'IA
        api: 500,     // 500 req/min pour l'API
        websocket: 50 // 50 connexions simultanées
      },
      security: {
        jwtSecret: process.env['JWT_SECRET'] || 'salambot-super-secret-key-production',
        jwtExpiration: 3600, // 1 heure
        apiKeys: (process.env['API_KEYS'] || '').split(',').filter(Boolean),
        authEnabled: true,
        httpsOnly: true
      },
      monitoring: {
        prometheusEnabled: true,
        logLevel: 'info',
        tracingEnabled: true,
        grafanaUrl: 'https://grafana.salambot.app'
      }
    };
  }

  /**
   * 🧪 Configuration Staging
   */
  private static createStagingConfig(): GatewayConfig {
    return {
      port: parseInt(process.env['PORT'] || '3000'),
      environment: 'staging',
      isDevelopment: false,
      allowedDomains: [
        'https://staging.salambot.ma',
        'https://staging.salambot.app',
        'https://api-staging.salambot.app',
        'https://docs-staging.salambot.app',
        'https://grafana-staging.salambot.app'
      ],
      services: {
        genkitFlows: process.env['GENKIT_FLOWS_URL'] || 'http://localhost:3001',
        restApi: process.env['REST_API_URL'] || 'http://localhost:3002',
        websocket: process.env['WEBSOCKET_URL'] || 'http://localhost:3003',
        metrics: process.env['METRICS_URL'] || 'http://localhost:9090'
      },
      rateLimit: {
        global: 2000, // Plus permissif en staging
        ai: 200,
        api: 1000,
        websocket: 100
      },
      security: {
        jwtSecret: process.env['JWT_SECRET'] || 'salambot-staging-secret-key',
        jwtExpiration: 7200, // 2 heures
        apiKeys: (process.env['API_KEYS'] || '').split(',').filter(Boolean),
        authEnabled: true,
        httpsOnly: true
      },
      monitoring: {
        prometheusEnabled: true,
        logLevel: 'debug',
        tracingEnabled: true,
        grafanaUrl: 'https://grafana-staging.salambot.app'
      }
    };
  }

  /**
   * 🛠️ Configuration Development
   */
  private static createDevelopmentConfig(): GatewayConfig {
    return {
      port: parseInt(process.env['PORT'] || '3000'),
      environment: 'development',
      isDevelopment: true,
      allowedDomains: [
        'http://localhost:3000',
        'http://localhost:4200',
        'http://localhost:4201',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:4201'
      ],
      services: {
        genkitFlows: process.env['GENKIT_FLOWS_URL'] || 'http://localhost:3001',
        restApi: process.env['REST_API_URL'] || 'http://localhost:3002',
        websocket: process.env['WEBSOCKET_URL'] || 'http://localhost:3003'
      },
      rateLimit: {
        global: 10000, // Très permissif en dev
        ai: 1000,
        api: 5000,
        websocket: 500
      },
      security: {
        jwtSecret: process.env['JWT_SECRET'] || 'salambot-dev-secret-key-not-for-production',
        jwtExpiration: 86400, // 24 heures
        apiKeys: ['dev-api-key-1', 'dev-api-key-2'],
        authEnabled: false, // Désactivé en dev pour faciliter les tests
        httpsOnly: false
      },
      monitoring: {
        prometheusEnabled: false, // Désactivé en dev
        logLevel: 'debug',
        tracingEnabled: false,
        grafanaUrl: undefined
      }
    };
  }

  /**
   * 🔍 Validation de la configuration
   */
  static validate(config: GatewayConfig): boolean {
    const errors: string[] = [];

    // Validation du port
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('Port invalide (doit être entre 1 et 65535)');
    }

    // Validation des URLs de services
    if (!config.services.genkitFlows) {
      errors.push('URL Genkit Flows manquante');
    }
    if (!config.services.restApi) {
      errors.push('URL REST API manquante');
    }
    if (!config.services.websocket) {
      errors.push('URL WebSocket manquante');
    }

    // Validation sécurité en production
    if (config.environment === 'production') {
      if (!config.security.jwtSecret || config.security.jwtSecret.length < 32) {
        errors.push('JWT Secret trop court en production (minimum 32 caractères)');
      }
      if (!config.security.authEnabled) {
        errors.push('Authentification obligatoire en production');
      }
      if (!config.security.httpsOnly) {
        errors.push('HTTPS obligatoire en production');
      }
    }

    if (errors.length > 0) {
      console.error('❌ Erreurs de configuration:', errors);
      return false;
    }

    console.log('✅ Configuration validée avec succès');
    return true;
  }
}

/**
 * 🎯 Export de la configuration par défaut
 */
export const defaultGatewayConfig = GatewayConfigFactory.create();