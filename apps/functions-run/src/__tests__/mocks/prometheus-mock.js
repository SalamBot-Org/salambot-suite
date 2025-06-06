/**
 * Mock Prometheus Service
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Service mock pour simuler Prometheus metrics
 *              utilisé dans les tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

const express = require('express');
const cors = require('cors');

// Configuration
const PORT = process.env.PORT || process.env.MOCK_PROMETHEUS_PORT || 9090;
const RESPONSE_DELAY = parseInt(process.env.MOCK_RESPONSE_DELAY_MS || '20');
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || '1');
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || '0');

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

function generatePrometheusMetrics() {
  const timestamp = Date.now();
  let metrics = [];
  
  // Ajouter des variations aléatoires aux métriques
  const variation = () => Math.random() * 0.1 - 0.05; // ±5%
  
  // Counters
  Object.entries(mockMetrics.counters).forEach(([name, value]) => {
    const newValue = Math.max(0, Math.floor(value * (1 + variation())));
    metrics.push(`# HELP ${name} Total number of ${name.replace(/_/g, ' ')}`);
    metrics.push(`# TYPE ${name} counter`);
    metrics.push(`${name} ${newValue} ${timestamp}`);
    metrics.push('');
  });
  
  // Gauges
  Object.entries(mockMetrics.gauges).forEach(([name, value]) => {
    const newValue = Math.max(0, value * (1 + variation()));
    const formattedValue = name.includes('percent') ? newValue.toFixed(2) : Math.floor(newValue);
    metrics.push(`# HELP ${name} Current ${name.replace(/_/g, ' ')}`);
    metrics.push(`# TYPE ${name} gauge`);
    metrics.push(`${name} ${formattedValue} ${timestamp}`);
    metrics.push('');
  });
  
  // Histograms
  Object.entries(mockMetrics.histograms).forEach(([name, buckets]) => {
    metrics.push(`# HELP ${name} ${name.replace(/_/g, ' ')} histogram`);
    metrics.push(`# TYPE ${name} histogram`);
    
    Object.entries(buckets).forEach(([le, count]) => {
      const newCount = Math.max(0, Math.floor(count * (1 + variation())));
      metrics.push(`${name}_bucket{le="${le}"} ${newCount} ${timestamp}`);
    });
    
    const totalCount = Math.max(0, Math.floor(buckets['+Inf'] * (1 + variation())));
    const sum = (totalCount * 0.5 * Math.random()).toFixed(3); // Somme approximative
    
    metrics.push(`${name}_sum ${sum} ${timestamp}`);
    metrics.push(`${name}_count ${totalCount} ${timestamp}`);
    metrics.push('');
  });
  
  // Métriques système supplémentaires
  metrics.push('# HELP process_start_time_seconds Start time of the process since unix epoch in seconds');
  metrics.push('# TYPE process_start_time_seconds gauge');
  metrics.push(`process_start_time_seconds ${Math.floor((timestamp - process.uptime() * 1000) / 1000)} ${timestamp}`);
  metrics.push('');
  
  metrics.push('# HELP nodejs_version_info Node.js version info');
  metrics.push('# TYPE nodejs_version_info gauge');
  metrics.push(`nodejs_version_info{version="${process.version}",major="${process.versions.node.split('.')[0]}"} 1 ${timestamp}`);
  metrics.push('');
  
  return metrics.join('\n');
}

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Middleware de simulation d'erreurs
app.use((req, res, next) => {
  // Simuler timeout
  if (shouldSimulateTimeout()) {
    console.log(`⏱️  [PROMETHEUS-MOCK] Simulation timeout pour ${req.method} ${req.path}`);
    return; // Ne pas répondre = timeout
  }
  
  // Simuler erreur serveur
  if (shouldSimulateError()) {
    console.log(`❌ [PROMETHEUS-MOCK] Simulation erreur 500 pour ${req.method} ${req.path}`);
    return res.status(500).send('Internal Server Error (simulated)');
  }
  
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 [PROMETHEUS-MOCK] ${req.method} ${req.path}`);
  next();
});

// Route principale des métriques Prometheus
app.get('/metrics', async (req, res) => {
  await simulateDelay();
  
  const metrics = generatePrometheusMetrics();
  
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics);
});

// Route de santé
app.get('/health', async (req, res) => {
  await simulateDelay();
  res.json({
    status: 'healthy',
    service: 'prometheus-mock',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.40.0-mock',
    metrics: {
      total: Object.keys(mockMetrics.counters).length + 
             Object.keys(mockMetrics.gauges).length + 
             Object.keys(mockMetrics.histograms).length,
      counters: Object.keys(mockMetrics.counters).length,
      gauges: Object.keys(mockMetrics.gauges).length,
      histograms: Object.keys(mockMetrics.histograms).length
    }
  });
});

// Route racine
app.get('/', async (req, res) => {
  await simulateDelay();
  res.send(`
    <html>
      <head><title>Prometheus Mock Server</title></head>
      <body>
        <h1>🔥 Prometheus Mock Server</h1>
        <p><strong>Service:</strong> SalamBot Functions-Run Metrics Mock</p>
        <p><strong>Version:</strong> 2.40.0-mock</p>
        <p><strong>Status:</strong> Running</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        
        <h2>📊 Available Endpoints</h2>
        <ul>
          <li><a href="/metrics">/metrics</a> - Prometheus metrics endpoint</li>
          <li><a href="/health">/health</a> - Health check endpoint</li>
          <li><a href="/api/v1/query">/api/v1/query</a> - Query API (mock)</li>
          <li><a href="/api/v1/targets">/api/v1/targets</a> - Targets API (mock)</li>
        </ul>
        
        <h2>🎯 Mock Configuration</h2>
        <ul>
          <li><strong>Response Delay:</strong> ${RESPONSE_DELAY}ms</li>
          <li><strong>Error Rate:</strong> ${ERROR_RATE}%</li>
          <li><strong>Timeout Rate:</strong> ${TIMEOUT_RATE}%</li>
        </ul>
        
        <h2>📈 Available Metrics</h2>
        <h3>Counters</h3>
        <ul>
          ${Object.keys(mockMetrics.counters).map(name => `<li>${name}</li>`).join('')}
        </ul>
        
        <h3>Gauges</h3>
        <ul>
          ${Object.keys(mockMetrics.gauges).map(name => `<li>${name}</li>`).join('')}
        </ul>
        
        <h3>Histograms</h3>
        <ul>
          ${Object.keys(mockMetrics.histograms).map(name => `<li>${name}</li>`).join('')}
        </ul>
      </body>
    </html>
  `);
});

// API Query mock (pour compatibilité avec les clients Prometheus)
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
  
  // Simuler une réponse de requête Prometheus
  const mockResult = {
    status: 'success',
    data: {
      resultType: 'vector',
      result: [
        {
          metric: {
            __name__: query.split('{')[0] || query,
            instance: 'localhost:3000',
            job: 'salambot-gateway'
          },
          value: [Math.floor(Date.now() / 1000), (Math.random() * 100).toFixed(2)]
        }
      ]
    }
  };
  
  console.log(`🔍 [PROMETHEUS-MOCK] Query: ${query}`);
  res.json(mockResult);
});

// API Targets mock
app.get('/api/v1/targets', async (req, res) => {
  await simulateDelay();
  
  const mockTargets = {
    status: 'success',
    data: {
      activeTargets: [
        {
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
        }
      ],
      droppedTargets: []
    }
  };
  
  res.json(mockTargets);
});

// Route catch-all pour les endpoints non implémentés
app.all('*', async (req, res) => {
  await simulateDelay();
  res.status(404).send(`
    <html>
      <head><title>404 - Prometheus Mock</title></head>
      <body>
        <h1>❌ Endpoint Not Found</h1>
        <p><strong>Path:</strong> ${req.path}</p>
        <p><strong>Method:</strong> ${req.method}</p>
        
        <h2>📋 Available Endpoints</h2>
        <ul>
          <li>GET /metrics</li>
          <li>GET /health</li>
          <li>GET /api/v1/query</li>
          <li>GET /api/v1/targets</li>
        </ul>
        
        <p><a href="/">← Back to home</a></p>
      </body>
    </html>
  `);
});

// Gestion des erreurs Express
app.use((error, req, res, next) => {
  console.error(`❌ [PROMETHEUS-MOCK] Erreur Express:`, error);
  res.status(500).send('Internal Server Error');
});

// Démarrage du serveur
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [PROMETHEUS-MOCK] Service démarré sur http://localhost:${PORT}`);
  console.log(`📊 [PROMETHEUS-MOCK] Métriques disponibles sur http://localhost:${PORT}/metrics`);
  console.log(`🔍 [PROMETHEUS-MOCK] API Query disponible sur http://localhost:${PORT}/api/v1/query`);
  console.log(`📊 [PROMETHEUS-MOCK] Configuration:`);
  console.log(`   - Délai de réponse: ${RESPONSE_DELAY}ms`);
  console.log(`   - Taux d'erreur: ${ERROR_RATE}%`);
  console.log(`   - Taux de timeout: ${TIMEOUT_RATE}%`);
  console.log(`📈 [PROMETHEUS-MOCK] Métriques simulées:`);
  console.log(`   - Counters: ${Object.keys(mockMetrics.counters).length}`);
  console.log(`   - Gauges: ${Object.keys(mockMetrics.gauges).length}`);
  console.log(`   - Histograms: ${Object.keys(mockMetrics.histograms).length}`);
  console.log(`✅ [PROMETHEUS-MOCK] Prêt pour les tests d'intégration`);
});

// Gestion de l'arrêt propre
function shutdown() {
  console.log('🛑 [PROMETHEUS-MOCK] Arrêt en cours...');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ [PROMETHEUS-MOCK] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [PROMETHEUS-MOCK] Unhandled Rejection:', reason);
  process.exit(1);
});