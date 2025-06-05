# 🚀 SalamBot API Gateway Enterprise v2.2.0

> **API Gateway Enterprise pour l'écosystème SalamBot** - Gestion centralisée des microservices IA avec performance, sécurité et observabilité de niveau entreprise.

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/salambot/api-gateway)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 📋 Table des Matières

- [🎯 Vue d'Ensemble](#-vue-densemble)
- [🏗️ Architecture](#️-architecture)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔧 Utilisation](#-utilisation)
- [📊 Monitoring](#-monitoring)
- [🔒 Sécurité](#-sécurité)
- [🧪 Tests](#-tests)
- [📚 Documentation API](#-documentation-api)
- [🤝 Contribution](#-contribution)

## 🎯 Vue d'Ensemble

L'**API Gateway Enterprise SalamBot** est le point d'entrée centralisé pour tous les microservices de l'écosystème SalamBot. Il fournit une couche d'abstraction robuste avec des fonctionnalités enterprise-grade :

### ✨ Fonctionnalités Principales

- 🛡️ **Authentification & Autorisation** - JWT + API Keys avec RBAC
- 🚦 **Rate Limiting Intelligent** - Protection contre les abus avec quotas personnalisés
- 📊 **Monitoring & Métriques** - Observabilité complète avec Prometheus
- 🔄 **Load Balancing** - Distribution intelligente avec health checks
- 🔴 **Circuit Breaker** - Résilience aux pannes avec failover automatique
- ⚡ **Cache Distribué** - Performance optimisée avec Redis
- 📝 **Logging Structuré** - Traçabilité complète avec corrélation
- 🌐 **CORS & Sécurité** - Protection contre les attaques web
- 🏥 **Health Checks** - Surveillance multi-niveaux des services

### 🎭 Services Supportés

| Service | Description | Endpoints |
|---------|-------------|----------|
| 🤖 **Genkit AI Flows** | IA conversationnelle et détection de langue | `/api/ai/*` |
| 🔄 **REST API** | Opérations CRUD et gestion des données | `/api/rest/*` |
| 🌐 **WebSocket** | Communication temps réel | `/api/ws/*` |

## 🏗️ Architecture

```mermaid
graph TB
    Client["🌐 Clients"] --> Gateway["🚀 API Gateway"]
    
    Gateway --> Auth["🔒 Auth Middleware"]
    Gateway --> RateLimit["🚦 Rate Limiter"]
    Gateway --> Validation["✅ Validator"]
    Gateway --> Metrics["📊 Metrics"]
    Gateway --> Logging["📝 Logger"]
    
    Gateway --> Proxy1["🤖 Genkit Flows"]
    Gateway --> Proxy2["🔄 REST API"]
    Gateway --> Proxy3["🌐 WebSocket"]
    
    Proxy1 --> Service1["🧠 AI Service"]
    Proxy2 --> Service2["💾 Data Service"]
    Proxy3 --> Service3["💬 Chat Service"]
    
    Gateway --> Cache["⚡ Redis Cache"]
    Gateway --> Monitor["📊 Prometheus"]
    Gateway --> Health["🏥 Health Checks"]
```

### 📁 Structure du Projet

```
src/gateway/
├── 📄 index.ts              # Point d'entrée principal
├── 🖥️ server.ts             # Serveur Express principal
├── 📋 README.md             # Documentation (ce fichier)
├── 🔧 config/
│   └── gateway-config.ts    # Configuration centralisée
├── 🛡️ middleware/
│   ├── auth.ts              # Authentification JWT/API Key
│   ├── logging.ts           # Logging structuré
│   ├── error-handler.ts     # Gestion d'erreurs
│   ├── metrics.ts           # Collecte de métriques
│   └── validation.ts        # Validation des requêtes
├── 🛣️ routes/
│   ├── health.ts            # Health checks
│   ├── info.ts              # Informations du gateway
│   └── proxy.ts             # Proxies vers microservices
└── 📝 types/
    └── index.ts             # Types TypeScript
```

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **Redis** ≥ 6.0 (optionnel, pour le cache)
- **TypeScript** ≥ 5.0

### Installation des Dépendances

```bash
# Installation des dépendances
pnpm install

# Installation des types
pnpm install --save-dev @types/express @types/node

# Dépendances spécifiques au gateway
pnpm install express cors helmet compression
pnpm install express-rate-limit http-proxy-middleware
pnpm install jsonwebtoken bcryptjs
pnpm install winston pino
pnpm install ioredis
pnpm install prom-client
```

### Build

```bash
# Build TypeScript
pnpm run build

# Build en mode watch
pnpm run build:watch
```

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# 🌍 Environnement
NODE_ENV=development
PORT=3000

# 🔒 Sécurité
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=3600
API_KEYS=sk_live_1234567890,sk_test_0987654321

# 🔄 Services
GENKIT_FLOWS_URL=http://localhost:3001
REST_API_URL=http://localhost:3002
WEBSOCKET_URL=http://localhost:3003

# ⚡ Cache Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 📊 Monitoring
METRICS_ENABLED=true
METRICS_ENDPOINT=/metrics

# 📝 Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/gateway.log
```

### Configuration Avancée

La configuration peut être personnalisée via le fichier `config/gateway-config.ts` :

```typescript
import { GatewayConfig } from '../types';

const config: GatewayConfig = {
  environment: process.env.NODE_ENV as any || 'development',
  port: parseInt(process.env.PORT || '3000'),
  
  security: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600'),
    apiKeys: process.env.API_KEYS?.split(',') || [],
    publicEndpoints: ['/health', '/info', '/metrics']
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requêtes par fenêtre
    endpoints: {
      '/api/ai': { windowMs: 60 * 60 * 1000, max: 100 }, // 100/heure pour l'IA
      '/api/auth': { windowMs: 15 * 60 * 1000, max: 5 }   // 5/15min pour l'auth
    }
  }
};
```

## 🔧 Utilisation

### Démarrage du Serveur

```bash
# Mode développement
pnpm run dev

# Mode production
pnpm start

# Avec PM2 (recommandé pour la production)
pm2 start ecosystem.config.js
```

### Endpoints Principaux

#### 🏥 Health Checks

```bash
# Health check basique
curl http://localhost:3000/health

# Health check détaillé
curl http://localhost:3000/health/detailed

# Readiness probe (Kubernetes)
curl http://localhost:3000/health/ready

# Liveness probe (Kubernetes)
curl http://localhost:3000/health/live
```

#### 📊 Informations & Métriques

```bash
# Informations du gateway
curl http://localhost:3000/info

# Documentation des endpoints
curl http://localhost:3000/info/docs

# Statistiques en temps réel (auth requise)
curl -H "Authorization: Bearer <token>" http://localhost:3000/info/stats

# Métriques Prometheus (auth requise)
curl -H "Authorization: Bearer <token>" http://localhost:3000/metrics
```

#### 🤖 Services IA

```bash
# Détection de langue
curl -X POST http://localhost:3000/api/ai/detect-language \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text": "Salam, kifach nta?"}'

# Génération de réponse
curl -X POST http://localhost:3000/api/ai/generate-reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Bonjour", "context": "greeting"}'
```

### Authentification

#### JWT Token

```bash
# Utilisation avec JWT
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3000/api/ai/detect-language
```

#### API Key

```bash
# Utilisation avec API Key
curl -H "X-API-Key: sk_live_1234567890abcdef" \
     http://localhost:3000/api/ai/detect-language
```

## 📊 Monitoring

### Métriques Disponibles

L'API Gateway expose des métriques détaillées via Prometheus :

```prometheus
# Requêtes totales
gateway_requests_total{method="GET",path="/api/ai",status="200"} 1234

# Temps de réponse
gateway_response_time_histogram{method="POST",path="/api/ai"} 0.045

# Erreurs par service
gateway_proxy_errors_total{service="genkitFlows",error="timeout"} 5

# État des circuit breakers
gateway_circuit_breaker_state{service="restApi"} 0

# Santé des services
gateway_service_health{service="websocket"} 1
```

### Dashboard Grafana

Un dashboard Grafana est disponible dans `monitoring/grafana-dashboard.json` avec :

- 📊 Métriques de trafic en temps réel
- ⏱️ Latences par service
- ❌ Taux d'erreur et alertes
- 🔴 État des circuit breakers
- 🏥 Santé des services
- 💾 Utilisation des ressources

### Alerting

Configuration d'alertes Prometheus dans `monitoring/alerts.yml` :

```yaml
groups:
  - name: salambot-gateway
    rules:
      - alert: HighErrorRate
        expr: rate(gateway_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Taux d'erreur élevé sur l'API Gateway"
          
      - alert: ServiceDown
        expr: gateway_service_health == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.service }} indisponible"
```

## 🔒 Sécurité

### Authentification & Autorisation

#### JWT (Recommandé)

```typescript
// Payload JWT standard
{
  "sub": "user123",
  "email": "user@salambot.ma",
  "roles": ["user", "admin"],
  "permissions": ["ai:read", "ai:write"],
  "iat": 1640995200,
  "exp": 1640998800
}
```

#### API Keys

```typescript
// Format des API Keys
sk_live_1234567890abcdef  // Production
sk_test_0987654321fedcba  // Test
```

### Rate Limiting

Protection contre les abus avec limites configurables :

```typescript
// Configuration par endpoint
const rateLimits = {
  '/api/ai': { windowMs: 3600000, max: 1000 },    // 1000/heure
  '/api/auth': { windowMs: 900000, max: 5 },      // 5/15min
  '/health': { windowMs: 60000, max: 100 }        // 100/minute
};
```

### Headers de Sécurité

Headers automatiques via Helmet.js :

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### Validation des Données

Validation automatique avec sanitisation :

```typescript
// Exemple de validation
const schema = {
  text: { type: 'string', required: true, maxLength: 1000 },
  language: { type: 'string', enum: ['fr', 'ar', 'darija'] }
};
```

## 🧪 Tests

### Tests Unitaires

```bash
# Exécuter tous les tests
pnpm test

# Tests en mode watch
pnpm run test:watch

# Coverage
pnpm run test:coverage
```

### Tests d'Intégration

```bash
# Tests d'intégration
pnpm run test:integration

# Tests de charge
pnpm run test:load
```

### Tests de Performance

```bash
# Benchmark avec Artillery
pnpm run benchmark

# Test de stress
pnpm run stress-test
```

### Exemple de Test

```typescript
describe('API Gateway', () => {
  it('should authenticate with valid JWT', async () => {
    const token = generateTestToken();
    const response = await request(app)
      .get('/api/ai/flows')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
  
  it('should rate limit excessive requests', async () => {
    // Simuler 1001 requêtes
    for (let i = 0; i < 1001; i++) {
      const response = await request(app).get('/api/ai/flows');
      if (i === 1000) {
        expect(response.status).toBe(429);
      }
    }
  });
});
```

## 📚 Documentation API

### Swagger/OpenAPI

Documentation interactive disponible sur :
- **Développement** : http://localhost:3000/api/docs
- **Production** : https://api.salambot.ma/docs

### Postman Collection

Collection Postman disponible : `docs/postman/SalamBot-API-Gateway.json`

### Exemples d'Utilisation

#### Détection de Langue

```javascript
// JavaScript/Node.js
const response = await fetch('http://localhost:3000/api/ai/detect-language', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    text: 'Salam, kifach nta? Ana labas hamdullah'
  })
});

const result = await response.json();
console.log(result.data.detectedLanguage); // 'darija'
```

```python
# Python
import requests

response = requests.post(
    'http://localhost:3000/api/ai/detect-language',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'text': 'Bonjour, comment allez-vous?'
    }
)

result = response.json()
print(result['data']['detectedLanguage'])  # 'french'
```

## 🚀 Déploiement

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/gateway/index.js"]
```

```bash
# Build et run
docker build -t salambot/api-gateway .
docker run -p 3000:3000 salambot/api-gateway
```

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: salambot-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: salambot-gateway
  template:
    metadata:
      labels:
        app: salambot-gateway
    spec:
      containers:
      - name: gateway
        image: salambot/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: salambot-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### PM2 (Production)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'salambot-gateway',
    script: 'dist/gateway/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};
```

## 🔧 Maintenance

### Logs

```bash
# Voir les logs en temps réel
tail -f logs/gateway.log

# Logs avec PM2
pm2 logs salambot-gateway

# Logs structurés avec jq
tail -f logs/gateway.log | jq '.'
```

### Métriques de Performance

```bash
# Statistiques PM2
pm2 monit

# Métriques système
top -p $(pgrep -f "salambot-gateway")

# Métriques réseau
netstat -tulpn | grep :3000
```

### Backup & Restore

```bash
# Backup de la configuration
tar -czf gateway-config-$(date +%Y%m%d).tar.gz config/

# Backup des logs
tar -czf gateway-logs-$(date +%Y%m%d).tar.gz logs/
```

## 🤝 Contribution

### Guidelines

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** les changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Standards de Code

```bash
# Linting
pnpm run lint
pnpm run lint:fix

# Formatting
pnpm run format

# Type checking
pnpm run type-check
```

### Commit Convention

```
feat: add new authentication middleware
fix: resolve rate limiting issue
docs: update API documentation
test: add integration tests for proxy
refactor: improve error handling
```

## 📞 Support

- 📧 **Email** : platform@salambot.ma
- 💬 **Slack** : #salambot-platform
- 📚 **Documentation** : https://docs.salambot.app/api-gateway
- 🐛 **Issues** : https://github.com/salambot/api-gateway/issues

## 📄 License

Copyright © 2025 SalamBot Team. Tous droits réservés.

Ce logiciel est propriétaire et confidentiel. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.

---

**Développé avec ❤️ par l'équipe SalamBot Platform**

*Pour plus d'informations, consultez la [documentation complète](https://docs.salambot.app/api-gateway) ou contactez l'équipe à platform@salambot.ma*