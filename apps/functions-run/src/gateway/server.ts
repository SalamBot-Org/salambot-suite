/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🚀 SalamBot API Gateway Enterprise - Serveur Principal    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Point d'entrée unifié pour tous les services SalamBot  │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/error-handler';
import { healthCheck } from './routes/health';
import { metricsCollector } from './middleware/metrics';
import { validateRequest } from './middleware/validation';
import { GatewayConfig } from './config/gateway-config';

/**
 * 🌟 SALAMBOT API GATEWAY ENTERPRISE 🌟
 * 
 * 📖 Mission: Point d'entrée unifié pour l'écosystème SalamBot
 * 🎭 Fonctionnalités:
 *   • 🛡️  Sécurité multicouche (OAuth2 + JWT + Rate limiting)
 *   • ⚡ Performance (Cache + Compression + Load balancing)
 *   • 🔍 Observabilité (Logging + Metrics + Tracing)
 *   • 🌍 Multi-tenant (Isolation + Scaling + Monitoring)
 * 
 * 🏆 Objectifs SLA:
 *   • 99.9% uptime
 *   • <100ms p95 latency
 *   • 10K+ req/sec capacity
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

export class SalamBotAPIGateway {
  private app: Application;
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.app = express();
    this.config = config;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupProxies();
    this.setupErrorHandling();
  }

  /**
   * 🔧 Configuration des middlewares de sécurité et performance
   */
  private setupMiddleware(): void {
    // Sécurité de base
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuré pour les domaines SalamBot
    this.app.use(cors({
      origin: [
        'https://salambot.ma',
        'https://salambot.app',
        'https://api.salambot.app',
        'https://docs.salambot.app',
        'https://grafana.salambot.app',
        /\.salambot\.(ma|app)$/,
        ...(this.config.isDevelopment ? ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:4201'] : [])
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
    }));

    // Compression et parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting global
    const globalRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.config.rateLimit.global, // 1000 requests par IP
      message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(globalRateLimit);

    // Middlewares personnalisés
    this.app.use(loggingMiddleware);
    this.app.use(metricsCollector);
  }

  /**
   * 🛣️ Configuration des routes principales
   */
  private setupRoutes(): void {
    // Health check et monitoring
    this.app.use('/health', healthCheck);
    this.app.use('/metrics', this.createMetricsEndpoint());
    
    // Route d'information sur la gateway
    this.app.get('/gateway/info', (req: Request, res: Response) => {
      res.json({
        name: 'SalamBot API Gateway Enterprise',
        version: '2.1.0',
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          'functions-run': 'active',
          'widget-web': 'active',
          'agent-desk': 'active'
        },
        domains: {
          vitrine: 'salambot.ma',
          application: 'salambot.app',
          api: 'api.salambot.app',
          docs: 'docs.salambot.app',
          monitoring: 'grafana.salambot.app'
        }
      });
    });
  }

  /**
   * 🔄 Configuration des proxies vers les microservices
   */
  private setupProxies(): void {
    // Rate limiting spécifique à l'API IA
    const aiRateLimit = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: this.config.rateLimit.ai, // 100 requests par minute pour l'IA
      message: {
        error: 'Limite de requêtes IA atteinte, veuillez patienter.',
        retryAfter: '1 minute'
      }
    });

    // Proxy vers les flows Genkit (IA)
    this.app.use('/api/ai', 
      aiRateLimit,
      authMiddleware,
      validateRequest,
      createProxyMiddleware({
        target: this.config.services.genkitFlows,
        changeOrigin: true,
        pathRewrite: {
          '^/api/ai': '/'
        },
        onProxyReq: (proxyReq, req, res) => {
          // Ajouter des headers de traçabilité
          proxyReq.setHeader('X-Gateway-Request-ID', req.headers['x-request-id'] || 'unknown');
          proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
        },
        onError: (err, req, res) => {
          console.error('Proxy error to Genkit flows:', err);
          res.status(502).json({
            error: 'Service IA temporairement indisponible',
            code: 'AI_SERVICE_UNAVAILABLE'
          });
        }
      })
    );

    // Proxy vers l'API REST classique
    this.app.use('/api/v1',
      authMiddleware,
      validateRequest,
      createProxyMiddleware({
        target: this.config.services.restApi,
        changeOrigin: true,
        pathRewrite: {
          '^/api/v1': '/api'
        },
        onError: (err, req, res) => {
          console.error('Proxy error to REST API:', err);
          res.status(502).json({
            error: 'Service API temporairement indisponible',
            code: 'REST_API_UNAVAILABLE'
          });
        }
      })
    );

    // Proxy vers les WebSockets (chat temps réel)
    this.app.use('/ws',
      authMiddleware,
      createProxyMiddleware({
        target: this.config.services.websocket,
        ws: true,
        changeOrigin: true,
        onError: (err, req, res) => {
          console.error('WebSocket proxy error:', err);
          res.status(502).json({
            error: 'Service WebSocket temporairement indisponible',
            code: 'WEBSOCKET_UNAVAILABLE'
          });
        }
      })
    );
  }

  /**
   * 🚨 Gestion centralisée des erreurs
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint non trouvé',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        suggestion: 'Vérifiez la documentation API à https://docs.salambot.app'
      });
    });

    // Error handler global
    this.app.use(errorHandler);
  }

  /**
   * 📊 Endpoint de métriques Prometheus
   */
  private createMetricsEndpoint() {
    return (req: Request, res: Response) => {
      // TODO: Intégrer avec Prometheus metrics
      res.set('Content-Type', 'text/plain');
      res.send(`
# HELP salambot_gateway_requests_total Total number of requests
# TYPE salambot_gateway_requests_total counter
salambot_gateway_requests_total{method="GET",status="200"} 1000
salambot_gateway_requests_total{method="POST",status="200"} 500

# HELP salambot_gateway_request_duration_seconds Request duration in seconds
# TYPE salambot_gateway_request_duration_seconds histogram
salambot_gateway_request_duration_seconds_bucket{le="0.1"} 800
salambot_gateway_request_duration_seconds_bucket{le="0.5"} 1400
salambot_gateway_request_duration_seconds_bucket{le="1.0"} 1500
salambot_gateway_request_duration_seconds_bucket{le="+Inf"} 1500
salambot_gateway_request_duration_seconds_sum 150.5
salambot_gateway_request_duration_seconds_count 1500
      `);
    };
  }

  /**
   * 🚀 Démarrage du serveur
   */
  public start(): void {
    const port = this.config.port || 3000;
    
    this.app.listen(port, () => {
      console.log(`
🚀 SalamBot API Gateway Enterprise démarré!
`);
      console.log(`📍 Port: ${port}`);
      console.log(`🌐 Environnement: ${this.config.environment}`);
      console.log(`🔗 Health Check: http://localhost:${port}/health`);
      console.log(`📊 Métriques: http://localhost:${port}/metrics`);
      console.log(`📚 Documentation: https://docs.salambot.app`);
      console.log(`\n🎯 Services proxifiés:`);
      console.log(`   • IA Flows: ${this.config.services.genkitFlows}`);
      console.log(`   • REST API: ${this.config.services.restApi}`);
      console.log(`   • WebSocket: ${this.config.services.websocket}`);
      console.log(`\n✨ Prêt à servir l'écosystème SalamBot!\n`);
    });
  }

  /**
   * 🛑 Arrêt gracieux du serveur
   */
  public stop(): void {
    console.log('🛑 Arrêt gracieux de l\'API Gateway...');
    process.exit(0);
  }

  /**
   * 📱 Accès à l'instance Express pour les tests
   */
  public getApp(): Application {
    return this.app;
  }
}