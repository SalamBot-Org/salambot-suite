/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  📝 SalamBot API Gateway - Structured Logging              │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Middleware de logging structuré et observabilité       │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-01-20 | Modifié: 2025-01-20                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import { GatewayConfig } from '../config/gateway-config';

/**
 * 🌟 LOGGING STRUCTURÉ ENTERPRISE 🌟
 * 
 * 📖 Mission: Logging structuré et observabilité complète
 * 🎭 Fonctionnalités:
 *   • 📊 Logs structurés en JSON
 *   • 🔍 Traçabilité des requêtes
 *   • 📈 Métriques de performance
 *   • 🚨 Alertes et anomalies
 * 
 * 🏆 Objectifs:
 *   • Debugging efficace
 *   • Monitoring proactif
 *   • Conformité aux standards
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-01-20
 * 🔖 Version: 2.1.0-enterprise
 */

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * 📝 Logger structuré
 */
export class StructuredLogger {
  private config: GatewayConfig;
  private logLevel: number;
  
  private readonly LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: GatewayConfig) {
    this.config = config;
    this.logLevel = this.LOG_LEVELS[config.monitoring.logLevel] || 1;
  }

  /**
   * 📝 Log générique
   */
  private log(entry: LogEntry): void {
    if (this.LOG_LEVELS[entry.level] < this.logLevel) {
      return; // Niveau de log trop bas
    }

    // Format JSON structuré
    const logOutput = {
      '@timestamp': entry.timestamp,
      '@level': entry.level.toUpperCase(),
      '@message': entry.message,
      '@service': 'salambot-gateway',
      '@version': '2.1.0',
      '@environment': this.config.environment,
      ...entry
    };

    // Sortie console avec couleurs en développement
    if (this.config.isDevelopment) {
      this.logToConsoleWithColors(entry);
    } else {
      // JSON structuré pour la production
      console.log(JSON.stringify(logOutput));
    }
  }

  /**
   * 🎨 Log coloré pour le développement
   */
  private logToConsoleWithColors(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Vert
      warn: '\x1b[33m',  // Jaune
      error: '\x1b[31m'  // Rouge
    };
    
    const reset = '\x1b[0m';
    const color = colors[entry.level] || colors.info;
    
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
    const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`;
    
    if (entry.method && entry.url) {
      console.log(`${timestamp} ${prefix} ${entry.method} ${entry.url} - ${entry.message}`);
    } else {
      console.log(`${timestamp} ${prefix} ${entry.message}`);
    }
    
    if (entry.error && entry.level === 'error') {
      console.error(`${color}Stack:${reset}`, entry.error.stack);
    }
  }

  /**
   * 🐛 Log debug
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      metadata
    });
  }

  /**
   * ℹ️ Log info
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      metadata
    });
  }

  /**
   * ⚠️ Log warning
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      metadata
    });
  }

  /**
   * 🚨 Log error
   */
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    });
  }

  /**
   * 📊 Log de requête HTTP
   */
  logRequest(req: Request, res: Response, responseTime: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: this.getLogLevelForStatus(res.statusCode),
      message: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as { user?: { id?: string } }).user?.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIP(req),
      metadata: {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        contentLength: res.get('Content-Length'),
        referer: req.get('Referer')
      }
    };

    this.log(entry);
  }

  /**
   * 🎯 Déterminer le niveau de log selon le status HTTP
   */
  private getLogLevelForStatus(statusCode: number): 'debug' | 'info' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'info';
  }

  /**
   * 🌐 Obtenir l'IP du client
   */
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }
}

/**
 * 📝 Instance singleton du logger
 */
let loggerInstance: StructuredLogger;

/**
 * 🏭 Factory pour créer le logger
 */
export const createLogger = (config: GatewayConfig): StructuredLogger => {
  if (!loggerInstance) {
    loggerInstance = new StructuredLogger(config);
  }
  return loggerInstance;
};

/**
 * 📝 Middleware de logging des requêtes
 */
export const createLoggingMiddleware = (config: GatewayConfig) => {
  const logger = createLogger(config);
  
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Générer un ID de requête unique si absent
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Log de début de requête (debug seulement)
    logger.debug(`Début de requête: ${req.method} ${req.originalUrl}`, {
      requestId: req.headers['x-request-id'],
      userAgent: req.get('User-Agent'),
      ip: logger['getClientIP'](req)
    });
    
    // Hook sur la fin de la réponse
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logger.logRequest(req, res, responseTime);
    });
    
    next();
  };
};

/**
 * 📝 Export du logger pour utilisation globale
 */
export const getLogger = (): StructuredLogger => {
  if (!loggerInstance) {
    throw new Error('Logger non initialisé. Appelez createLogger() d\'abord.');
  }
  return loggerInstance;
};

export default createLoggingMiddleware;