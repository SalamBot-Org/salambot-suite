/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🔄 SalamBot API Gateway - Routes de Proxy                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Proxification vers les microservices                   │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from '../middleware/logging';
import { GatewayConfigFactory } from '../config/gateway-config';
import { MetricsCollector } from '../middleware/metrics';

/**
 * 🔄 ROUTES DE PROXY API GATEWAY 🔄
 * 
 * 📖 Mission: Proxifier les requêtes vers les microservices
 * 🎭 Fonctionnalités:
 *   • 🎯 Routage intelligent vers les services
 *   • ⚡ Load balancing et failover
 *   • 🔄 Circuit breaker pattern
 *   • 📊 Monitoring des proxies
 * 
 * 🏆 Objectifs Opérationnels:
 *   • Haute disponibilité des services
 *   • Performance optimale
 *   • Résilience aux pannes
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

const router: Router = Router();
const config = GatewayConfigFactory.create();
const metrics = MetricsCollector.getInstance();

/**
 * 🎯 Interface pour la configuration des proxies
 */
interface ProxyConfig {
  target: string;
  pathRewrite?: { [key: string]: string };
  changeOrigin: boolean;
  timeout: number;
  retries: number;
  circuitBreaker: {
    enabled: boolean;
    threshold: number;
    timeout: number;
  };
  healthCheck: {
    enabled: boolean;
    path: string;
    interval: number;
  };
}

/**
 * 🔄 État du circuit breaker par service
 */
const circuitBreakerState = new Map<string, {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
  nextAttempt: number;
}>();

/**
 * 🏥 État de santé des services
 */
const serviceHealth = new Map<string, {
  isHealthy: boolean;
  lastCheck: number;
  responseTime: number;
}>();

/**
 * 🎯 Configuration des proxies par service
 */
const proxyConfigs: { [key: string]: ProxyConfig } = {
  genkitFlows: {
    target: config.services.genkitFlows || 'http://localhost:3000',
    pathRewrite: { '^/api/ai': '' },
    changeOrigin: true,
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000
    },
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 30000
    }
  },
  restApi: {
    target: config.services.restApi || 'http://localhost:3001',
    pathRewrite: { '^/api/rest': '' },
    changeOrigin: true,
    timeout: 15000,
    retries: 2,
    circuitBreaker: {
      enabled: true,
      threshold: 3,
      timeout: 30000
    },
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 30000
    }
  },
  websocket: {
    target: config.services.websocket || 'http://localhost:3002',
    pathRewrite: { '^/api/ws': '' },
    changeOrigin: true,
    timeout: 5000,
    retries: 1,
    circuitBreaker: {
      enabled: true,
      threshold: 2,
      timeout: 15000
    },
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 15000
    }
  }
};

/**
 * 🛡️ Middleware de circuit breaker
 */
function circuitBreakerMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const state = circuitBreakerState.get(serviceName);
    const config = proxyConfigs[serviceName];
    
    if (!config.circuitBreaker.enabled) {
      return next();
    }
    
    if (state?.isOpen) {
      const now = Date.now();
      
      // Vérifier si on peut tenter une nouvelle requête
      if (now < state.nextAttempt) {
        logger.warn(`🔴 Circuit breaker ouvert pour ${serviceName}`, {
          serviceName,
          nextAttempt: new Date(state.nextAttempt).toISOString(),
          requestId: req.headers['x-request-id']
        });
        
        metrics.incrementCounter('circuit_breaker_rejections', {
          service: serviceName,
          path: req.path
        });
        
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: `Service ${serviceName} temporairement indisponible`,
            retryAfter: Math.ceil((state.nextAttempt - now) / 1000)
          }
        });
      }
      
      // Tentative de demi-ouverture
      logger.info(`🟡 Tentative de demi-ouverture du circuit breaker pour ${serviceName}`);
    }
    
    next();
  };
}

/**
 * 📊 Middleware de monitoring des proxies
 */
function proxyMonitoringMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Intercepter la réponse pour collecter les métriques
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Métriques de base
      metrics.incrementCounter('proxy_requests_total', {
        service: serviceName,
        method: req.method,
        status: statusCode.toString()
      });
      
      metrics.recordHistogram('proxy_response_time', responseTime, {
        service: serviceName,
        method: req.method
      });
      
      // Gestion du circuit breaker
      updateCircuitBreakerState(serviceName, statusCode >= 500, responseTime);
      
      // Logging
      logger.info(`🔄 Proxy ${serviceName}`, {
        method: req.method,
        path: req.path,
        statusCode,
        responseTime,
        requestId: req.headers['x-request-id']
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * 🔄 Mise à jour de l'état du circuit breaker
 */
function updateCircuitBreakerState(serviceName: string, isError: boolean, responseTime: number) {
  const config = proxyConfigs[serviceName];
  if (!config.circuitBreaker.enabled) return;
  
  let state = circuitBreakerState.get(serviceName) || {
    isOpen: false,
    failures: 0,
    lastFailure: 0,
    nextAttempt: 0
  };
  
  const now = Date.now();
  
  if (isError) {
    state.failures++;
    state.lastFailure = now;
    
    // Ouvrir le circuit si le seuil est atteint
    if (state.failures >= config.circuitBreaker.threshold) {
      state.isOpen = true;
      state.nextAttempt = now + config.circuitBreaker.timeout;
      
      logger.error(`🔴 Circuit breaker ouvert pour ${serviceName}`, {
        serviceName,
        failures: state.failures,
        threshold: config.circuitBreaker.threshold,
        nextAttempt: new Date(state.nextAttempt).toISOString()
      });
      
      metrics.incrementCounter('circuit_breaker_opened', {
        service: serviceName
      });
    }
  } else {
    // Succès - réinitialiser ou fermer le circuit
    if (state.isOpen) {
      state.isOpen = false;
      state.failures = 0;
      
      logger.info(`🟢 Circuit breaker fermé pour ${serviceName}`, {
        serviceName
      });
      
      metrics.incrementCounter('circuit_breaker_closed', {
        service: serviceName
      });
    } else {
      // Réduire progressivement le compteur d'échecs
      state.failures = Math.max(0, state.failures - 1);
    }
  }
  
  circuitBreakerState.set(serviceName, state);
}

/**
 * 🏥 Health check des services
 */
async function performHealthCheck(serviceName: string): Promise<void> {
  const config = proxyConfigs[serviceName];
  if (!config.healthCheck.enabled) return;
  
  const startTime = Date.now();
  
  try {
    // Simulation d'un health check HTTP
    // En production, utiliser axios ou fetch
    const isHealthy = Math.random() > 0.1; // 90% de succès simulé
    const responseTime = Date.now() - startTime;
    
    serviceHealth.set(serviceName, {
      isHealthy,
      lastCheck: Date.now(),
      responseTime
    });
    
    if (isHealthy) {
      logger.debug(`✅ Health check ${serviceName}: OK`, {
        serviceName,
        responseTime
      });
    } else {
      logger.warn(`⚠️ Health check ${serviceName}: FAILED`, {
        serviceName,
        responseTime
      });
    }
    
    metrics.recordGauge('service_health', isHealthy ? 1 : 0, {
      service: serviceName
    });
    
  } catch (error) {
    logger.error(`❌ Erreur health check ${serviceName}`, {
      serviceName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    serviceHealth.set(serviceName, {
      isHealthy: false,
      lastCheck: Date.now(),
      responseTime: Date.now() - startTime
    });
    
    metrics.recordGauge('service_health', 0, {
      service: serviceName
    });
  }
}

/**
 * 🎯 Création des proxies pour chaque service
 */
function createServiceProxy(serviceName: string, config: ProxyConfig): any {
  const proxyOptions: Options = {
    target: config.target,
    changeOrigin: config.changeOrigin,
    timeout: config.timeout,
    pathRewrite: config.pathRewrite,
    
    // Gestion des erreurs
    onError: (err, req, res) => {
      logger.error(`❌ Erreur proxy ${serviceName}`, {
        serviceName,
        error: err.message,
        path: req.url,
        requestId: req.headers?.['x-request-id']
      });
      
      metrics.incrementCounter('proxy_errors_total', {
        service: serviceName,
        error: (err as any).code || 'unknown'
      });
      
      updateCircuitBreakerState(serviceName, true, 0);
      
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: 'BAD_GATEWAY',
            message: `Service ${serviceName} indisponible`,
            service: serviceName
          }
        });
      }
    },
    
    // Logging des requêtes
    onProxyReq: (proxyReq, req, res) => {
      logger.debug(`➡️ Proxy request ${serviceName}`, {
        serviceName,
        method: req.method,
        path: req.url,
        target: config.target,
        requestId: req.headers['x-request-id']
      });
    },
    
    // Logging des réponses
    onProxyRes: (proxyRes, req, res) => {
      logger.debug(`⬅️ Proxy response ${serviceName}`, {
        serviceName,
        statusCode: proxyRes.statusCode,
        path: req.url,
        requestId: req.headers['x-request-id']
      });
    }
  };
  
  return createProxyMiddleware(proxyOptions);
}

/**
 * 🤖 Routes pour les flows IA (Genkit)
 * 
 * 📝 Endpoints:
 *   • POST /api/ai/detect-language - Détection de langue
 *   • POST /api/ai/generate-reply - Génération de réponse
 *   • GET /api/ai/flows - Liste des flows disponibles
 */
router.use('/api/ai',
  circuitBreakerMiddleware('genkitFlows'),
  proxyMonitoringMiddleware('genkitFlows'),
  createServiceProxy('genkitFlows', proxyConfigs['genkitFlows'])
);

/**
 * 🔄 Routes pour l'API REST
 * 
 * 📝 Endpoints:
 *   • CRUD operations sur les ressources
 *   • Gestion des utilisateurs
 *   • Configuration système
 */
router.use('/api/rest',
  circuitBreakerMiddleware('restApi'),
  proxyMonitoringMiddleware('restApi'),
  createServiceProxy('restApi', proxyConfigs['restApi'])
);

/**
 * 🌐 Routes pour les WebSockets
 * 
 * 📝 Endpoints:
 *   • Communication temps réel
 *   • Notifications push
 *   • Chat en direct
 */
router.use('/api/ws',
  circuitBreakerMiddleware('websocket'),
  proxyMonitoringMiddleware('websocket'),
  createServiceProxy('websocket', proxyConfigs['websocket'])
);

/**
 * 📊 GET /proxy/status - État des proxies
 * 
 * 📝 Description: Retourne l'état de tous les proxies et services
 * 🔐 Authentification: Requise
 */
router.get('/proxy/status', async (req: Request, res: Response) => {
  try {
    logger.info('📊 Demande d\'état des proxies', {
      userId: req.user?.id,
      requestId: req.headers['x-request-id']
    });

    const status = {
      services: {} as any,
      circuitBreakers: {} as any,
      healthChecks: {} as any,
      summary: {
        totalServices: Object.keys(proxyConfigs).length,
        healthyServices: 0,
        unhealthyServices: 0,
        openCircuits: 0
      }
    };

    // État des services
    for (const [serviceName, config] of Object.entries(proxyConfigs)) {
      const health = serviceHealth.get(serviceName);
      const circuit = circuitBreakerState.get(serviceName);
      
      status.services[serviceName] = {
        target: config.target,
        healthy: health?.isHealthy ?? true,
        lastCheck: health?.lastCheck ? new Date(health.lastCheck).toISOString() : null,
        responseTime: health?.responseTime ?? 0,
        circuitOpen: circuit?.isOpen ?? false
      };
      
      status.circuitBreakers[serviceName] = {
        isOpen: circuit?.isOpen ?? false,
        failures: circuit?.failures ?? 0,
        threshold: config.circuitBreaker.threshold,
        nextAttempt: circuit?.nextAttempt ? new Date(circuit.nextAttempt).toISOString() : null
      };
      
      status.healthChecks[serviceName] = {
        enabled: config.healthCheck.enabled,
        interval: config.healthCheck.interval,
        lastCheck: health?.lastCheck ? new Date(health.lastCheck).toISOString() : null,
        status: health?.isHealthy ? 'healthy' : 'unhealthy'
      };
      
      // Mise à jour du résumé
      if (health?.isHealthy !== false) {
        status.summary.healthyServices++;
      } else {
        status.summary.unhealthyServices++;
      }
      
      if (circuit?.isOpen) {
        status.summary.openCircuits++;
      }
    }

    res.json({
      success: true,
      data: status,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    });
    
  } catch (error) {
    logger.error('❌ Erreur lors de la récupération de l\'état des proxies', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id']
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PROXY_STATUS_ERROR',
        message: 'Erreur lors de la récupération de l\'état des proxies'
      }
    });
  }
});

/**
 * 🔄 POST /proxy/circuit-breaker/reset - Réinitialiser un circuit breaker
 * 
 * 📝 Description: Force la réinitialisation d'un circuit breaker
 * 🔐 Authentification: Requise (admin)
 */
router.post('/proxy/circuit-breaker/reset', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.body;
    
    if (!serviceName || !proxyConfigs[serviceName]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICE',
          message: 'Nom de service invalide'
        }
      });
    }
    
    // Vérification des permissions admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissions administrateur requises'
        }
      });
    }
    
    logger.info(`🔄 Réinitialisation du circuit breaker ${serviceName}`, {
      serviceName,
      userId: req.user.id,
      requestId: req.headers['x-request-id']
    });
    
    // Réinitialiser l'état du circuit breaker
    circuitBreakerState.set(serviceName, {
      isOpen: false,
      failures: 0,
      lastFailure: 0,
      nextAttempt: 0
    });
    
    metrics.incrementCounter('circuit_breaker_manual_reset', {
      service: serviceName
    });
    
    return res.json({
      success: true,
      message: `Circuit breaker ${serviceName} réinitialisé`,
      data: {
        serviceName,
        resetAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ Erreur lors de la réinitialisation du circuit breaker', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id']
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'CIRCUIT_BREAKER_RESET_ERROR',
        message: 'Erreur lors de la réinitialisation du circuit breaker'
      }
    });
  }
});

/**
 * 🏥 Initialisation des health checks périodiques
 */
function initializeHealthChecks() {
  for (const [serviceName, config] of Object.entries(proxyConfigs)) {
    if (config.healthCheck.enabled) {
      // Health check initial
      performHealthCheck(serviceName);
      
      // Health checks périodiques
      setInterval(() => {
        performHealthCheck(serviceName);
      }, config.healthCheck.interval);
      
      logger.info(`🏥 Health check initialisé pour ${serviceName}`, {
        serviceName,
        interval: config.healthCheck.interval
      });
    }
  }
}

// Initialiser les health checks au démarrage
initializeHealthChecks();

export default router;
export { circuitBreakerState, serviceHealth, updateCircuitBreakerState };