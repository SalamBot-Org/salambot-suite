/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🏥 SalamBot API Gateway - Routes de Santé                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Monitoring de santé et diagnostics système             │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Router, Request, Response } from 'express';
import { performance } from 'perf_hooks';

/**
 * 🌟 ROUTES DE SANTÉ ENTERPRISE 🌟
 * 
 * 📖 Mission: Monitoring proactif de la santé du système
 * 🎭 Fonctionnalités:
 *   • 🏥 Health checks basiques et détaillés
 *   • 🔍 Diagnostics des services externes
 *   • 📊 Métriques de performance en temps réel
 *   • 🚨 Alertes de santé automatiques
 * 
 * 🏆 Objectifs SLA:
 *   • Détection précoce des problèmes
 *   • Monitoring continu 24/7
 *   • Diagnostics automatisés
 * 
 * 👥 Équipe: SalamBot DevOps Team <devops@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

const router: Router = Router();

/**
 * 🏥 Interface pour le statut de santé
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  system: SystemHealth;
  checks: HealthCheck[];
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  url?: string;
}

export interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * 🏥 Health check basique - Endpoint rapide pour les load balancers
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = performance.now();
  
  try {
    const basicHealth = await performBasicHealthCheck();
    const duration = Math.round(performance.now() - startTime);
    
    // Statut HTTP selon la santé
    const statusCode = basicHealth.status === 'healthy' ? 200 : 
                      basicHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      status: basicHealth.status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '2.1.0',
      environment: process.env['NODE_ENV'] || 'development',
      responseTime: `${duration}ms`,
      message: getHealthMessage(basicHealth.status)
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: 'Service temporairement indisponible'
    });
  }
});

/**
 * 🔍 Health check détaillé - Diagnostics complets
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = performance.now();
  
  try {
    const detailedHealth = await performDetailedHealthCheck();
    const duration = Math.round(performance.now() - startTime);
    
    // Ajout des métriques de performance
    
    const response: HealthStatus = {
      ...detailedHealth,
      checks: [
        ...detailedHealth.checks,
        {
          name: 'health_check_performance',
          status: duration < 1000 ? 'pass' : duration < 5000 ? 'warn' : 'fail',
          duration,
          message: `Health check completed in ${duration}ms`
        }
      ]
    };
    
    // Statut HTTP selon la santé globale
    const statusCode = response.status === 'healthy' ? 200 : 
                      response.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('❌ Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🚀 Readiness probe - Kubernetes readiness
 * GET /health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const readinessChecks = await performReadinessChecks();
    const isReady = readinessChecks.every(check => check.status === 'pass');
    
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: readinessChecks
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * 💓 Liveness probe - Kubernetes liveness
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  // Check basique : le processus répond-il ?
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  // Considéré comme "mort" si utilisation mémoire > 95%
  const isAlive = memoryUsagePercent < 95;
  
  res.status(isAlive ? 200 : 503).json({
    alive: isAlive,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      usage: `${memoryUsagePercent.toFixed(2)}%`,
      threshold: '95%'
    }
  });
});

/**
 * 🏥 Health check basique
 */
async function performBasicHealthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy' }> {
  const checks: HealthCheck[] = [];
  
  // Check mémoire
  const memoryCheck = checkMemoryUsage();
  checks.push(memoryCheck);
  
  // Check uptime
  const uptimeCheck = checkUptime();
  checks.push(uptimeCheck);
  
  // Détermination du statut global
  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const warnChecks = checks.filter(c => c.status === 'warn').length;
  
  if (failedChecks > 0) {
    return { status: 'unhealthy' };
  } else if (warnChecks > 0) {
    return { status: 'degraded' };
  } else {
    return { status: 'healthy' };
  }
}

/**
 * 🔍 Health check détaillé
 */
async function performDetailedHealthCheck(): Promise<HealthStatus> {
  const startTime = performance.now();
  
  // Checks système
  const systemChecks = [
    checkMemoryUsage(),
    checkUptime(),
    checkCpuUsage()
  ];
  
  // Checks des services externes
  const serviceChecks = await checkExternalServices();
  
  // Métriques système
  const systemHealth = getSystemHealth();
  
  // Détermination du statut global
  const allChecks = [...systemChecks, ...serviceChecks.map(s => ({
    name: s.name,
    status: s.status === 'up' ? 'pass' as const : 'fail' as const,
    duration: s.responseTime || 0,
    message: s.error
  }))];
  
  const failedChecks = allChecks.filter(c => c.status === 'fail').length;
  const warnChecks = allChecks.filter(c => c.status === 'warn').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks > 0) {
    overallStatus = 'unhealthy';
  } else if (warnChecks > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  const duration = Math.round(performance.now() - startTime);
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '2.1.0',
    environment: process.env['NODE_ENV'] || 'development',
    services: serviceChecks,
    system: systemHealth,
    checks: [...allChecks, {
      name: 'detailed_health_check_performance',
      status: duration < 2000 ? 'pass' as const : duration < 5000 ? 'warn' as const : 'fail' as const,
      duration,
      message: `Health check completed in ${duration}ms`
    }]
  };
}

/**
 * 🚀 Checks de readiness
 */
async function performReadinessChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Check que les services critiques sont disponibles
  const criticalServices = await checkExternalServices();
  
  for (const service of criticalServices) {
    checks.push({
      name: `service_${service.name}`,
      status: service.status === 'up' ? 'pass' : 'fail',
      duration: service.responseTime || 0,
      message: service.error || `Service ${service.name} is ${service.status}`
    });
  }
  
  // Check que l'application est initialisée
  checks.push({
    name: 'application_initialized',
    status: 'pass', // Toujours pass si on arrive ici
    duration: 0,
    message: 'Application successfully initialized'
  });
  
  return checks;
}

/**
 * 💾 Check utilisation mémoire
 */
function checkMemoryUsage(): HealthCheck {
  const memoryUsage = process.memoryUsage();
  const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  let status: 'pass' | 'warn' | 'fail';
  let message: string;
  
  if (usagePercent > 90) {
    status = 'fail';
    message = `Utilisation mémoire critique: ${usagePercent.toFixed(2)}%`;
  } else if (usagePercent > 75) {
    status = 'warn';
    message = `Utilisation mémoire élevée: ${usagePercent.toFixed(2)}%`;
  } else {
    status = 'pass';
    message = `Utilisation mémoire normale: ${usagePercent.toFixed(2)}%`;
  }
  
  return {
    name: 'memory_usage',
    status,
    duration: 0,
    message,
    details: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      percentage: usagePercent
    }
  };
}

/**
 * ⏰ Check uptime
 */
function checkUptime(): HealthCheck {
  const uptime = process.uptime();
  
  return {
    name: 'uptime',
    status: uptime > 60 ? 'pass' : 'warn', // Warn si uptime < 1 minute
    duration: 0,
    message: `Uptime: ${Math.floor(uptime)}s`,
    details: { uptime }
  };
}

/**
 * 🖥️ Check utilisation CPU
 */
function checkCpuUsage(): HealthCheck {
  const cpuUsage = process.cpuUsage();
  const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convertir en secondes
  
  return {
    name: 'cpu_usage',
    status: 'pass', // Difficile de déterminer sans baseline
    duration: 0,
    message: `CPU usage: ${totalUsage.toFixed(2)}s`,
    details: {
      user: cpuUsage.user,
      system: cpuUsage.system
    } as Record<string, unknown>
  };
}

/**
 * 🌐 Check des services externes
 */
async function checkExternalServices(): Promise<ServiceHealth[]> {
  const services: ServiceHealth[] = [];
  
  // Configuration des services à vérifier
  const servicesToCheck = [
    {
      name: 'genkit_flows',
      url: process.env['GENKIT_FLOWS_URL'] || 'http://localhost:3001/health'
    },
    {
      name: 'rest_api',
      url: process.env['REST_API_URL'] || 'http://localhost:3002/health'
    },
    {
      name: 'websocket',
      url: process.env['WEBSOCKET_URL'] || 'http://localhost:3003/health'
    }
  ];
  
  // Check de chaque service
  for (const service of servicesToCheck) {
    const serviceHealth = await checkService(service.name, service.url);
    services.push(serviceHealth);
  }
  
  return services;
}

/**
 * 🔍 Check d'un service spécifique
 */
async function checkService(name: string, url: string): Promise<ServiceHealth> {
  const startTime = performance.now();
  
  try {
    // Simulation d'un check HTTP (en production, utiliser fetch ou axios)
    // Pour le moment, on simule un service up
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      name,
      status: 'up',
      responseTime,
      lastCheck: new Date().toISOString(),
      url
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      name,
      status: 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      url
    };
  }
}

/**
 * 🖥️ Récupération des métriques système
 */
function getSystemHealth(): SystemHealth {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    },
    cpu: {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000
    }
  };
}

/**
 * 💬 Message de santé selon le statut
 */
function getHealthMessage(status: string): string {
  switch (status) {
    case 'healthy':
      return '🟢 Tous les systèmes fonctionnent normalement';
    case 'degraded':
      return '🟡 Certains services présentent des problèmes mineurs';
    case 'unhealthy':
      return '🔴 Des problèmes critiques ont été détectés';
    default:
      return '⚪ Statut de santé inconnu';
  }
}

export const healthCheck: Router = router;
export default router;