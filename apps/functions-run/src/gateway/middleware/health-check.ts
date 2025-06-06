/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🏥 SalamBot API Gateway - Health Check Middleware         │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Middleware de vérification de santé des services       │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-01-20 | Modifié: 2025-01-20                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response } from 'express';
import { GatewayConfig } from '../config/gateway-config';

/**
 * 🌟 HEALTH CHECK AVANCÉ 🌟
 * 
 * 📖 Mission: Vérification complète de la santé du gateway et des services
 * 🎭 Fonctionnalités:
 *   • 🔍 Vérification de connectivité des services
 *   • 📊 Métriques de performance
 *   • 🚨 Détection d'anomalies
 *   • 📈 Historique de santé
 * 
 * 🏆 Objectifs:
 *   • Monitoring proactif
 *   • Détection précoce des problèmes
 *   • Informations détaillées pour le debugging
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-01-20
 * 🔖 Version: 2.1.0-enterprise
 */

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  url?: string;
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

/**
 * 🏥 Classe de gestion du health check
 */
export class HealthChecker {
  private config: GatewayConfig;
  private serviceHistory: Map<string, ServiceHealth[]> = new Map();

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  /**
   * 🔍 Vérification complète de santé
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Vérification des services
    const services = await this.checkServices();
    
    // Métriques système
    const systemMetrics = this.getSystemMetrics();
    
    // Calcul du temps de réponse
    const responseTime = Date.now() - startTime; // eslint-disable-line @typescript-eslint/no-unused-vars
    
    // Détermination du statut global
    const globalStatus = this.determineGlobalStatus(services);
    
    const result: HealthCheckResult = {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.1.0',
      environment: this.config.environment,
      services,
      system: systemMetrics
    };
    
    // Enregistrer dans l'historique
    this.updateHistory(services);
    
    return result;
  }

  /**
   * 🔍 Vérification de tous les services
   */
  private async checkServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];
    
    // Vérification Genkit Flows
    if (this.config.services.genkitFlows) {
      services.push(await this.checkService('Genkit Flows', this.config.services.genkitFlows));
    }
    
    // Vérification REST API
    if (this.config.services.restApi) {
      services.push(await this.checkService('REST API', this.config.services.restApi));
    }
    
    // Vérification WebSocket
    if (this.config.services.websocket) {
      services.push(await this.checkService('WebSocket', this.config.services.websocket));
    }
    
    return services;
  }

  /**
   * 🔍 Vérification d'un service individuel
   */
  private async checkService(name: string, url: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Tentative de connexion avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SalamBot-Gateway-HealthCheck/2.1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        name,
        status: response.ok ? 'healthy' : 'unhealthy',
        url,
        responseTime,
        lastCheck: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name,
        status: 'unhealthy',
        url,
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erreur de connexion inconnue'
      };
    }
  }

  /**
   * 📊 Métriques système
   */
  private getSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        usage: Math.round(process.cpuUsage().user / 1000000) // Approximation
      }
    };
  }

  /**
   * 🎯 Détermination du statut global
   */
  private determineGlobalStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    
    if (healthyServices === totalServices) {
      return 'healthy';
    } else if (healthyServices > 0) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * 📈 Mise à jour de l'historique
   */
  private updateHistory(services: ServiceHealth[]): void {
    services.forEach(service => {
      if (!this.serviceHistory.has(service.name)) {
        this.serviceHistory.set(service.name, []);
      }
      
      const history = this.serviceHistory.get(service.name);
      if (history) {
        history.push(service);
        
        // Garder seulement les 100 dernières vérifications
        if (history.length > 100) {
          history.shift();
        }
      }
    });
  }

  /**
   * 📊 Obtenir l'historique d'un service
   */
  getServiceHistory(serviceName: string): ServiceHealth[] {
    return this.serviceHistory.get(serviceName) || [];
  }
}

/**
 * 🏥 Middleware de health check
 */
export const createHealthCheckMiddleware = (config: GatewayConfig) => {
  const healthChecker = new HealthChecker(config);
  
  return async (req: Request, res: Response) => {
    try {
      const healthResult = await healthChecker.checkHealth();
      
      // Définir le code de statut HTTP selon la santé
      let statusCode = 200;
      if (healthResult.status === 'degraded') {
        statusCode = 207; // Multi-Status
      } else if (healthResult.status === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      }
      
      res.status(statusCode).json(healthResult);
      
    } catch (error) {
      console.error('❌ Erreur lors du health check:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Erreur interne du health check',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  };
};

export default createHealthCheckMiddleware;