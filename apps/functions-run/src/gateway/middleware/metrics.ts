/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  📊 SalamBot API Gateway - Collecteur de Métriques        │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Monitoring et observabilité en temps réel             │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

/**
 * 🌟 COLLECTEUR DE MÉTRIQUES ENTERPRISE 🌟
 * 
 * 📖 Mission: Observabilité complète de l'API Gateway
 * 🎭 Fonctionnalités:
 *   • 📈 Métriques de performance (latence, throughput)
 *   • 🔢 Compteurs de requêtes par endpoint
 *   • 📊 Histogrammes de temps de réponse
 *   • 🚨 Détection d'anomalies en temps réel
 * 
 * 🏆 Objectifs SLA:
 *   • Monitoring proactif
 *   • Alertes automatiques
 *   • Dashboards temps réel
 * 
 * 👥 Équipe: SalamBot DevOps Team <devops@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 📊 Interface pour les métriques collectées
 */
export interface GatewayMetrics {
  // Compteurs
  totalRequests: number;
  requestsByMethod: Map<string, number>;
  requestsByPath: Map<string, number>;
  requestsByStatus: Map<number, number>;
  requestsByUser: Map<string, number>;
  
  // Temps de réponse
  responseTimes: number[];
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Erreurs
  errorCount: number;
  errorRate: number;
  
  // Système
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  
  // Timestamps
  lastUpdated: string;
  startTime: string;
}

/**
 * 🎯 Collecteur de métriques singleton
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: GatewayMetrics;
  private startTime: number;
  private lastCpuUsage: NodeJS.CpuUsage;

  private constructor() {
    this.startTime = Date.now();
    this.lastCpuUsage = process.cpuUsage();
    this.metrics = this.initializeMetrics();
    
    // Mise à jour périodique des métriques système
    setInterval(() => this.updateSystemMetrics(), 30000); // Toutes les 30 secondes
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * 🔧 Initialisation des métriques
   */
  private initializeMetrics(): GatewayMetrics {
    return {
      totalRequests: 0,
      requestsByMethod: new Map(),
      requestsByPath: new Map(),
      requestsByStatus: new Map(),
      requestsByUser: new Map(),
      responseTimes: [],
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorCount: 0,
      errorRate: 0,
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      lastUpdated: new Date().toISOString(),
      startTime: new Date().toISOString()
    };
  }

  /**
   * 📈 Enregistrement d'une requête
   */
  recordRequest(req: Request, res: Response, responseTime: number) {
    // Compteurs de base
    this.metrics.totalRequests++;
    
    // Par méthode HTTP
    const methodCount = this.metrics.requestsByMethod.get(req.method) || 0;
    this.metrics.requestsByMethod.set(req.method, methodCount + 1);
    
    // Par chemin (normalisé)
    const normalizedPath = this.normalizePath(req.path);
    const pathCount = this.metrics.requestsByPath.get(normalizedPath) || 0;
    this.metrics.requestsByPath.set(normalizedPath, pathCount + 1);
    
    // Par code de statut
    const statusCount = this.metrics.requestsByStatus.get(res.statusCode) || 0;
    this.metrics.requestsByStatus.set(res.statusCode, statusCount + 1);
    
    // Par utilisateur (si authentifié)
    if (req.user?.id) {
      const userCount = this.metrics.requestsByUser.get(req.user.id) || 0;
      this.metrics.requestsByUser.set(req.user.id, userCount + 1);
    }
    
    // Temps de réponse
    this.recordResponseTime(responseTime);
    
    // Erreurs
    if (res.statusCode >= 400) {
      this.metrics.errorCount++;
    }
    
    // Calcul du taux d'erreur
    this.metrics.errorRate = (this.metrics.errorCount / this.metrics.totalRequests) * 100;
    
    // Mise à jour timestamp
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * ⏱️ Enregistrement du temps de réponse
   */
  private recordResponseTime(responseTime: number) {
    this.metrics.responseTimes.push(responseTime);
    
    // Garder seulement les 1000 dernières mesures pour éviter la fuite mémoire
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
    
    // Calcul des percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const length = sortedTimes.length;
    
    this.metrics.averageResponseTime = sortedTimes.reduce((a, b) => a + b, 0) / length;
    this.metrics.p95ResponseTime = sortedTimes[Math.floor(length * 0.95)] || 0;
    this.metrics.p99ResponseTime = sortedTimes[Math.floor(length * 0.99)] || 0;
  }

  /**
   * 🖥️ Mise à jour des métriques système
   */
  private updateSystemMetrics() {
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
  }

  /**
   * 🔄 Normalisation des chemins pour le groupement
   */
  private normalizePath(path: string): string {
    // Remplacer les IDs par des placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:objectId') // MongoDB ObjectIds
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');   // UUIDs
  }

  /**
   * 📊 Récupération des métriques
   */
  getMetrics(): GatewayMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  /**
   * 📈 Export au format Prometheus
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    
    let output = '';
    
    // Métriques de base
    output += `# HELP salambot_gateway_requests_total Total number of requests\n`;
    output += `# TYPE salambot_gateway_requests_total counter\n`;
    output += `salambot_gateway_requests_total ${metrics.totalRequests}\n\n`;
    
    // Requêtes par méthode
    output += `# HELP salambot_gateway_requests_by_method_total Requests by HTTP method\n`;
    output += `# TYPE salambot_gateway_requests_by_method_total counter\n`;
    for (const [method, count] of metrics.requestsByMethod) {
      output += `salambot_gateway_requests_by_method_total{method="${method}"} ${count}\n`;
    }
    output += '\n';
    
    // Requêtes par statut
    output += `# HELP salambot_gateway_requests_by_status_total Requests by status code\n`;
    output += `# TYPE salambot_gateway_requests_by_status_total counter\n`;
    for (const [status, count] of metrics.requestsByStatus) {
      output += `salambot_gateway_requests_by_status_total{status="${status}"} ${count}\n`;
    }
    output += '\n';
    
    // Temps de réponse
    output += `# HELP salambot_gateway_response_time_seconds Response time in seconds\n`;
    output += `# TYPE salambot_gateway_response_time_seconds histogram\n`;
    output += `salambot_gateway_response_time_seconds_sum ${metrics.responseTimes.reduce((a, b) => a + b, 0) / 1000}\n`;
    output += `salambot_gateway_response_time_seconds_count ${metrics.responseTimes.length}\n`;
    
    // Buckets d'histogramme
    const buckets = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
    for (const bucket of buckets) {
      const count = metrics.responseTimes.filter(t => t <= bucket * 1000).length;
      output += `salambot_gateway_response_time_seconds_bucket{le="${bucket}"} ${count}\n`;
    }
    output += `salambot_gateway_response_time_seconds_bucket{le="+Inf"} ${metrics.responseTimes.length}\n\n`;
    
    // Taux d'erreur
    output += `# HELP salambot_gateway_error_rate Error rate percentage\n`;
    output += `# TYPE salambot_gateway_error_rate gauge\n`;
    output += `salambot_gateway_error_rate ${metrics.errorRate}\n\n`;
    
    // Métriques système
    output += `# HELP salambot_gateway_memory_usage_bytes Memory usage in bytes\n`;
    output += `# TYPE salambot_gateway_memory_usage_bytes gauge\n`;
    output += `salambot_gateway_memory_usage_bytes{type="rss"} ${metrics.memoryUsage.rss}\n`;
    output += `salambot_gateway_memory_usage_bytes{type="heapTotal"} ${metrics.memoryUsage.heapTotal}\n`;
    output += `salambot_gateway_memory_usage_bytes{type="heapUsed"} ${metrics.memoryUsage.heapUsed}\n\n`;
    
    // Uptime
    output += `# HELP salambot_gateway_uptime_seconds Uptime in seconds\n`;
    output += `# TYPE salambot_gateway_uptime_seconds counter\n`;
    output += `salambot_gateway_uptime_seconds ${metrics.uptime / 1000}\n\n`;
    
    return output;
  }

  /**
   * 🔄 Reset des métriques
   */
  reset() {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }

  /**
   * 🚨 Détection d'anomalies
   */
  detectAnomalies(): string[] {
    const anomalies: string[] = [];
    const metrics = this.getMetrics();
    
    // Taux d'erreur élevé
    if (metrics.errorRate > 10) {
      anomalies.push(`Taux d'erreur élevé: ${metrics.errorRate.toFixed(2)}%`);
    }
    
    // Temps de réponse élevé
    if (metrics.p95ResponseTime > 5000) {
      anomalies.push(`P95 temps de réponse élevé: ${metrics.p95ResponseTime}ms`);
    }
    
    // Utilisation mémoire élevée
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      anomalies.push(`Utilisation mémoire élevée: ${memoryUsagePercent.toFixed(2)}%`);
    }
    
    return anomalies;
  }
}

/**
 * 📊 Middleware de collecte de métriques
 */
export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const collector = MetricsCollector.getInstance();
  
  // Hook sur la fin de la réponse
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Enregistrement de la requête
    collector.recordRequest(req, res, responseTime);
    
    // Détection d'anomalies
    const anomalies = collector.detectAnomalies();
    if (anomalies.length > 0) {
      console.warn('🚨 Anomalies détectées:', anomalies);
    }
  });
  
  next();
};

/**
 * 📈 Route pour exposer les métriques
 */
export const metricsEndpoint = (req: Request, res: Response) => {
  const collector = MetricsCollector.getInstance();
  
  // Format demandé
  const format = req.query.format as string || 'prometheus';
  
  switch (format) {
    case 'json':
      res.json(collector.getMetrics());
      break;
    case 'prometheus':
    default:
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(collector.getPrometheusMetrics());
      break;
  }
};

/**
 * 📊 Export de l'instance singleton
 */
export const metrics = MetricsCollector.getInstance();

export default metricsCollector;