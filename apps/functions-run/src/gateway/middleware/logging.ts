/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  📝 SalamBot API Gateway - Middleware de Logging           │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Traçabilité complète des requêtes et réponses          │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

/**
 * 🌟 MIDDLEWARE DE LOGGING ENTERPRISE 🌟
 * 
 * 📖 Mission: Traçabilité complète des requêtes API Gateway
 * 🎭 Fonctionnalités:
 *   • 📊 Logging structuré (JSON format)
 *   • ⏱️ Mesure de performance (latence, throughput)
 *   • 🔍 Corrélation des requêtes (Request ID)
 *   • 🚨 Détection d'anomalies (erreurs, lenteur)
 * 
 * 🏆 Objectifs Observabilité:
 *   • Debugging facilité
 *   • Monitoring proactif
 *   • Audit trail complet
 * 
 * 👥 Équipe: SalamBot DevOps Team <devops@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 📊 Interface pour les métriques de requête
 */
export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  error?: string;
}

/**
 * 🎯 Niveaux de log
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 📝 Logger structuré pour l'API Gateway
 */
export class GatewayLogger {
  private static instance: GatewayLogger;
  private logLevel: LogLevel;

  private constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  static getInstance(logLevel?: LogLevel): GatewayLogger {
    if (!GatewayLogger.instance) {
      GatewayLogger.instance = new GatewayLogger(logLevel);
    }
    return GatewayLogger.instance;
  }

  /**
   * 📊 Log structuré avec métadonnées
   */
  public log(level: LogLevel, message: string, metadata?: any) {
    if (this.shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        service: 'salambot-api-gateway',
        version: '2.1.0',
        message,
        ...metadata
      };

      // En production, envoyer vers un service de logging centralisé
      // Pour le moment, on utilise console avec formatage JSON
      const emoji = this.getLogEmoji(level);
      console.log(`${emoji} [${level.toUpperCase()}]`, JSON.stringify(logEntry, null, 2));
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  debug(message: string, metadata?: any) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: any) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: any) {
    this.log(LogLevel.ERROR, message, metadata);
  }
}

/**
 * 📝 Middleware principal de logging
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const logger = GatewayLogger.getInstance();
  
  // Génération d'un ID de requête unique si pas déjà présent
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Ajout de l'ID dans les headers de réponse pour le debugging
  res.setHeader('X-Request-ID', req.requestId);

  // Capture de la taille de la requête
  const requestSize = req.headers['content-length'] ? 
    parseInt(req.headers['content-length']) : 0;

  // Log de début de requête
  logger.info('Requête entrante', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    requestSize,
    headers: sanitizeHeaders(req.headers)
  });

  // Interception de la fin de réponse
  const originalSend = res.send;
  let responseSize = 0;

  res.send = function(data: any) {
    responseSize = Buffer.byteLength(data || '', 'utf8');
    return originalSend.call(this, data);
  };

  // Hook sur la fin de la réponse
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const metrics: RequestMetrics = {
      requestId: req.requestId!,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      requestSize,
      responseSize,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    };

    // Détermination du niveau de log selon le status et la performance
    let logLevel: LogLevel;
    let message: string;

    if (res.statusCode >= 500) {
      logLevel = LogLevel.ERROR;
      message = 'Erreur serveur';
    } else if (res.statusCode >= 400) {
      logLevel = LogLevel.WARN;
      message = 'Erreur client';
    } else if (responseTime > 5000) {
      logLevel = LogLevel.WARN;
      message = 'Requête lente détectée';
    } else {
      logLevel = LogLevel.INFO;
      message = 'Requête traitée';
    }

    // Log de fin de requête avec métriques
    logger.log(logLevel, message, {
      ...metrics,
      performance: {
        responseTime,
        category: categorizeResponseTime(responseTime),
        isSlowRequest: responseTime > 1000
      },
      status: {
        code: res.statusCode,
        category: categorizeStatusCode(res.statusCode),
        isError: res.statusCode >= 400
      }
    });

    // Alertes pour les cas critiques
    if (res.statusCode >= 500) {
      logger.error('Erreur critique détectée', {
        requestId: req.requestId,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        responseTime,
        userId: req.user?.id
      });
    }

    if (responseTime > 10000) {
      logger.error('Requête extrêmement lente', {
        requestId: req.requestId,
        responseTime,
        path: req.path,
        method: req.method,
        threshold: '10s',
        impact: 'Expérience utilisateur dégradée'
      });
    }
  });

  next();
};

/**
 * 🧹 Nettoyage des headers sensibles pour le logging
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Masquer les informations sensibles
  const sensitiveHeaders = [
    'authorization',
    'x-api-key',
    'cookie',
    'x-auth-token',
    'x-access-token'
  ];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * ⏱️ Catégorisation du temps de réponse
 */
function categorizeResponseTime(responseTime: number): string {
  if (responseTime < 100) return 'excellent';
  if (responseTime < 500) return 'good';
  if (responseTime < 1000) return 'acceptable';
  if (responseTime < 5000) return 'slow';
  return 'critical';
}

/**
 * 📊 Catégorisation du code de statut
 */
function categorizeStatusCode(statusCode: number): string {
  if (statusCode < 300) return 'success';
  if (statusCode < 400) return 'redirect';
  if (statusCode < 500) return 'client_error';
  return 'server_error';
}

/**
 * 🔍 Middleware de logging pour les erreurs non gérées
 */
export const errorLoggingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const logger = GatewayLogger.getInstance();
  
  logger.error('Erreur non gérée dans l\'API Gateway', {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: sanitizeHeaders(req.headers)
    },
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : null,
    timestamp: new Date().toISOString()
  });

  next(error);
};

/**
 * 📈 Export du logger pour utilisation dans d'autres modules
 */
export const logger = GatewayLogger.getInstance();

export default loggingMiddleware;