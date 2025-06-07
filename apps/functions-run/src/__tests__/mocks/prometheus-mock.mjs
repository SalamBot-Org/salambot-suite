/**
 * Mock Prometheus Service
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Service mock pour simuler Prometheus metrics
 *              utilisé dans les tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 * @optimized 2025-01-27
 */

import express from 'express';
import cors from 'cors';

// Configuration
const PORT = process.env.PORT || process.env.MOCK_PROMETHEUS_PORT || 9090;
const RESPONSE_DELAY = parseInt(process.env.MOCK_RESPONSE_DELAY_MS || '20');
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || '1');
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || '0');
const CACHE_TTL = parseInt(process.env.MOCK_CACHE_TTL_MS || '5000'); // 5 secondes
const LOG_LEVEL = process.env.MOCK_LOG_LEVEL || 'info'; // debug, info, warn, error

// Cache pour les métriques
let metricsCache = null;
let cacheTimestamp = 0;

// Données mock pour les métriques
const mockMetrics = {
  counters: {
    'http_requests_total': 1250,
    'http_errors_total': 45,
    'genkit_requests_total': 890,
    'redis_operations_total': 2340,
    'websocket_connections_total': 156
  },
  gauges: {
    'http_requests_in_flight': 12,
    'active_connections': 45,
    'memory_usage_bytes': 134217728, // 128MB
    'cpu_usage_percent': 23.5,
    'redis_connected_clients': 8
  },
  histograms: {
    'http_request_duration_seconds': {
      '0.1': 850,
      '0.25': 1100,
      '0.5': 1200,
      '1.0': 1240,
      '2.5': 1248,
      '5.0': 1250,
      '+Inf': 1250
    },
    'genkit_response_time_seconds': {
      '0.1': 450,
      '0.5': 780,
      '1.0': 870,
      '2.0': 885,
      '5.0': 890,
      '+Inf': 890
    }
  }
};

// Utilitaires
function simulateDelay() {
  return new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
}

function shouldSimulateError() {
  return Math.random() * 100 < ERROR_RATE;
}

function shouldSimulateTimeout() {
  return Math.random() * 100 < TIMEOUT_RATE;
}

function log(level, message, ...args) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levels[level] >= levels[LOG_LEVEL]) {
    console[level](`[PROMETHEUS-MOCK] ${message}`, ...args);
  }
}

function generatePrometheusMetrics() {
  // Vérifier le cache
  const now = Date.now();
  if (metricsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return metricsCache;
  }

  const timestamp = now;
  let metrics = [];
  
  // Ajouter des variations aléatoires aux métriques
  const variation = () => Math.random() * 0.1 - 0.05; // ±5%
  
  // Counters
  Object.entries(mockMetrics.counters).forEach(([name, value]) => {
    const newValue = Math.max(0, Math.floor(value * (1 + variation())));
    metrics.push(
      `# HELP ${name} Total number of ${name.replace(/_/g, ' ')}`,
      `# TYPE ${name} counter`,
      `${name} ${newValue} ${timestamp}`,
      ''
    );
  });
  
  // Gauges
  Object.entries(mockMetrics.gauges).forEach(([name, value]) => {
    const newValue = Math.max(0, value * (1 + variation()));
    const formattedValue = name.includes('percent') ? newValue.toFixed(2) : Math.floor(newValue);
    metrics.push(
      `# HELP ${name} Current ${name.replace(/_/g, ' ')}`,
      `# TYPE ${name} gauge`,
      `${name} ${formattedValue} ${timestamp}`,
      ''
    );
  });
  
  // Histograms
  Object.entries(mockMetrics.histograms).forEach(([name, buckets]) => {
    metrics.push(
      `# HELP ${name} ${name.replace(/_/g, ' ')} histogram`,
      `# TYPE ${name} histogram`
    );
    
    Object.entries(buckets).forEach(([le, count]) => {
      const newCount = Math.max(0, Math.floor(count * (1 + variation())));
      metrics.push(`${name}_bucket{le="${le}"} ${newCount} ${timestamp}`);
    });
    
    const totalCount = Math.max(0, Math.floor(buckets['+Inf'] * (1 + variation())));
    const sum = (totalCount * 0.5 * Math.random()).toFixed(3);
    
    metrics.push(
      `${name}_sum ${sum} ${timestamp}`,
      `${name}_count ${totalCount} ${timestamp}`,
      ''
    );
  });
  
  // Métriques système
  metrics.push(
    '# HELP process_start_time_seconds Start time of the process since unix epoch in seconds',
    '# TYPE process_start_time_seconds gauge',
    `process_start_time_seconds ${Math.floor((timestamp - process.uptime() * 1000) / 1000)} ${timestamp}`,
    '',
    '# HELP nodejs_version_info Node.js version info',
    '# TYPE nodejs_version_info gauge',
    `nodejs_version_info{version="${process.version}",major="${process.versions.node.split('.')[0]}"} 1 ${timestamp}`,
    ''
  );
  
  // Mettre en cache
  metricsCache = metrics.join('\n');
  cacheTimestamp = timestamp;
  
  return metricsCache;
}

function getHealthStatus() {
  return {
    status: 'healthy',
    service: 'prometheus-mock',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.40.0-mock',
    cache: {
      enabled: true,
      ttl: CACHE_TTL,
      lastUpdate: new Date(cacheTimestamp).toISOString()
    },
    metrics: {
      total: Object.keys(mockMetrics.counters).length + 
             Object.keys(mockMetrics.gauges).length + 
             Object.keys(mockMetrics.histograms).length,
      counters: Object.keys(mockMetrics.counters).length,
      gauges: Object.keys(mockMetrics.gauges).length,
      histograms: Object.keys(mockMetrics.histograms).length
    }
  };
}

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Middleware de simulation d'erreurs
app.use((req, res, next) => {
  if (shouldSimulateTimeout()) {
    log('debug', `Simulation timeout pour ${req.method} ${req.path}`);
    return; // Ne pas répondre = timeout
  }
  
  if (shouldSimulateError()) {
    log('debug', `Simulation erreur 500 pour ${req.method} ${req.path}`);
    return res.status(500).send('Internal Server Error (simulated)');
  }
  
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  log('debug', `${req.method} ${req.path}`);
  next();
});

// Routes principales
app.get('/metrics', async (req, res) => {
  await simulateDelay();
  const metrics = generatePrometheusMetrics();
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics);
});

app.get('/health', async (req, res) => {
  await simulateDelay();
  res.json(getHealthStatus());
});

// Endpoints Prometheus standards
app.get('/-/healthy', async (req, res) => {
  await simulateDelay();
  res.status(200).send('Prometheus is Healthy.\n');
});

app.get('/-/ready', async (req, res) => {
  await simulateDelay();
  res.status(200).send('Prometheus is Ready.\n');
});

// Route racine simplifiée
app.get('/', async (req, res) => {
  await simulateDelay();
  const health = getHealthStatus();
  res.json({
    service: 'Prometheus Mock Server',
    version: health.version,
    status: 'running',
    uptime: Math.floor(health.uptime),
    endpoints: [
      '/metrics - Prometheus metrics endpoint',
      '/health - Health check endpoint',
      '/api/v1/query - Query API (mock)',
      '/api/v1/targets - Targets API (mock)',
      '/-/healthy - Prometheus health endpoint',
      '/-/ready - Prometheus ready endpoint'
    ],
    config: {
      responseDelay: RESPONSE_DELAY,
      errorRate: ERROR_RATE,
      timeoutRate: TIMEOUT_RATE,
      cacheTTL: CACHE_TTL,
      logLevel: LOG_LEVEL
    },
    metrics: health.metrics
  });
});

// API Query mock
app.get('/api/v1/query', async (req, res) => {
  await simulateDelay();
  
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({
      status: 'error',
      errorType: 'bad_data',
      error: 'query parameter is required'
    });
  }
  
  const mockResult = {
    status: 'success',
    data: {
      resultType: 'vector',
      result: [{
        metric: {
          __name__: query.split('{')[0] || query,
          instance: 'localhost:3000',
          job: 'salambot-gateway'
        },
        value: [Math.floor(Date.now() / 1000), (Math.random() * 100).toFixed(2)]
      }]
    }
  };
  
  log('debug', `Query: ${query}`);
  res.json(mockResult);
});

// API Targets mock
app.get('/api/v1/targets', async (req, res) => {
  await simulateDelay();
  
  const mockTargets = {
    status: 'success',
    data: {
      activeTargets: [{
        discoveredLabels: {
          '__address__': 'localhost:3000',
          '__job__': 'salambot-gateway'
        },
        labels: {
          instance: 'localhost:3000',
          job: 'salambot-gateway'
        },
        scrapePool: 'salambot-gateway',
        scrapeUrl: 'http://localhost:3000/metrics',
        globalUrl: 'http://localhost:3000/metrics',
        lastError: '',
        lastScrape: new Date().toISOString(),
        lastScrapeDuration: 0.002,
        health: 'up'
      }],
      droppedTargets: []
    }
  };
  
  res.json(mockTargets);
});

// Route catch-all
app.all('*', async (req, res) => {
  await simulateDelay();
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /metrics',
      'GET /health',
      'GET /api/v1/query',
      'GET /api/v1/targets',
      'GET /-/healthy',
      'GET /-/ready'
    ]
  });
});

// Gestion des erreurs Express (AVANT app.listen)
app.use((error, req, res) => {
  log('error', 'Erreur Express:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Gestion de l'arrêt propre
function shutdown() {
  log('info', 'Arrêt en cours...');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('error', 'Unhandled Rejection:', reason);
  process.exit(1);
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  log('info', `Service démarré sur http://localhost:${PORT}`);
  log('info', `Métriques disponibles sur http://localhost:${PORT}/metrics`);
  log('info', `Configuration:`);
  log('info', `  - Délai de réponse: ${RESPONSE_DELAY}ms`);
  log('info', `  - Taux d'erreur: ${ERROR_RATE}%`);
  log('info', `  - Taux de timeout: ${TIMEOUT_RATE}%`);
  log('info', `  - Cache TTL: ${CACHE_TTL}ms`);
  log('info', `  - Log level: ${LOG_LEVEL}`);
  log('info', `Métriques simulées:`);
  log('info', `  - Counters: ${Object.keys(mockMetrics.counters).length}`);
  log('info', `  - Gauges: ${Object.keys(mockMetrics.gauges).length}`);
  log('info', `  - Histograms: ${Object.keys(mockMetrics.histograms).length}`);
  log('info', `Prêt pour les tests d'intégration`);
});