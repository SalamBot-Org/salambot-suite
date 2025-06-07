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

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import { createLoggingMiddleware } from './middleware/structured-logging';
import { errorHandler } from './middleware/error-handler';
import { createHealthCheckMiddleware } from './middleware/health-check';
import { metricsCollector, metricsEndpoint } from './middleware/metrics';
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
  private app: Express;
  private config: GatewayConfig;
  private server?: import('http').Server;

  constructor(config: GatewayConfig) {
    this.app = express();
    this.config = config;
    this.setupHttpsEnforcement(); // HTTPS en premier pour la sécurité
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
    this.app.use(createLoggingMiddleware(this.config));
    this.app.use(metricsCollector);
  }

  /**
   * 🛣️ Configuration des routes principales
   */
  private setupRoutes(): void {
    // Health check avancé avec vérification des services
    this.app.use('/health', createHealthCheckMiddleware(this.config));
    
    // Métriques dynamiques (respecte la configuration prometheusEnabled)
    if (this.config.monitoring.prometheusEnabled) {
      this.app.use('/metrics', metricsEndpoint);
    } else {
      this.app.use('/metrics', (req: Request, res: Response) => {
        res.status(404).json({ 
          error: 'Métriques désactivées', 
          message: 'Les métriques Prometheus sont désactivées dans la configuration' 
        });
      });
    }
    
    // Route d'information sur la gateway
    const gatewayInfo = {
      name: 'SalamBot API Gateway Enterprise',
      version: '2.1.0',
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
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
      },
      monitoring: {
        prometheusEnabled: this.config.monitoring.prometheusEnabled,
        logLevel: this.config.monitoring.logLevel,
        tracingEnabled: this.config.monitoring.tracingEnabled
      }
    };

    this.app.get('/gateway/info', (req: Request, res: Response) => {
      res.json({
        ...gatewayInfo,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Endpoint /info pour compatibilité avec les tests
    this.app.get('/info', (req: Request, res: Response) => {
      res.json({
        ...gatewayInfo,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
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

    // Vérification et configuration du proxy IA
    if (this.isValidUrl(this.config.services.genkitFlows)) {
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
          onProxyReq: (proxyReq, req, _res) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            // Ajouter des headers de traçabilité
            proxyReq.setHeader('X-Gateway-Request-ID', req.headers['x-request-id'] || 'unknown');
            proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
          },
          onError: (err, req, res) => {
            console.error(`❌ Erreur proxy IA: ${err.message}`);
            if (!res.headersSent) {
              res.status(502).json({
                error: 'Service IA temporairement indisponible',
                message: 'Veuillez réessayer dans quelques instants',
                timestamp: new Date().toISOString()
              });
            }
          }
        })
      );
    } else {
      this.app.use('/api/ai', (req: Request, res: Response) => {
        res.status(503).json({
          error: 'Service IA non configuré',
          message: 'URL du service Genkit Flows invalide ou manquante'
        });
      });
    }

    // Proxy vers l'API REST classique
    if (this.isValidUrl(this.config.services.restApi)) {
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
            console.error(`❌ Erreur proxy REST API: ${err.message}`);
            if (!res.headersSent) {
              res.status(502).json({
                error: 'Service API temporairement indisponible',
                message: 'Veuillez réessayer dans quelques instants',
                timestamp: new Date().toISOString()
              });
            }
          }
        })
      );
    } else {
      this.app.use('/api/v1', (req: Request, res: Response) => {
        res.status(503).json({
          error: 'Service API non configuré',
          message: 'URL du service REST API invalide ou manquante'
        });
      });
    }

    // Proxy vers les WebSockets (chat temps réel)
    if (this.isValidUrl(this.config.services.websocket)) {
      this.app.use('/ws',
        authMiddleware,
        createProxyMiddleware({
          target: this.config.services.websocket,
          ws: true,
          changeOrigin: true,
          onError: (err, req, res) => {
            console.error(`❌ Erreur proxy WebSocket: ${err.message}`);
            if (!res.headersSent) {
              res.status(502).json({
                error: 'Service WebSocket temporairement indisponible',
                message: 'Veuillez réessayer dans quelques instants',
                timestamp: new Date().toISOString()
              });
            }
          }
        })
      );
    } else {
      this.app.use('/ws', (req: Request, res: Response) => {
        res.status(503).json({
          error: 'Service WebSocket non configuré',
          message: 'URL du service WebSocket invalide ou manquante'
        });
      });
    }
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
   * 🔍 Validation des URLs de services
   */
  private isValidUrl(url?: string): boolean {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * 🔒 Middleware HTTPS enforcement
   */
  private setupHttpsEnforcement(): void {
    if (this.config.security.httpsOnly) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        // Vérifier si la requête est en HTTPS
        const isHttps = req.secure || 
                       req.headers['x-forwarded-proto'] === 'https' ||
                       req.headers['x-forwarded-ssl'] === 'on';
        
        if (!isHttps && this.config.environment === 'production') {
          const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
          return res.redirect(301, httpsUrl);
        }
        
        // Ajouter des headers de sécurité HTTPS
        if (isHttps) {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        
        next();
      });
    }
  }

  /**
   * 🚀 Démarrage du serveur
   */
  public start(): void {
    const port = this.config.port || 3000;
    
    this.server = this.app.listen(port, () => {
      console.log(`\n🚀 SalamBot API Gateway Enterprise démarré!\n`);
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
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🛑 Arrêt gracieux de l\'API Gateway...');
      if (this.server) {
        this.server.close(() => {
          this.server = undefined;
          resolve();
        });
      } else {
        resolve();
      }
      // Ne pas appeler process.exit() pendant les tests
      if (process.env['NODE_ENV'] !== 'test') {
        setTimeout(() => process.exit(0), 100);
      }
    });
  }

  /**
   * 📱 Accès à l'instance Express pour les tests
   */
  public getApp(): Express {
    return this.app;
  }
}