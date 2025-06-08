# Kong Gateway Implementation Plan

## Vue d'Ensemble

Ce document détaille le plan d'implémentation de Kong Gateway pour remplacer l'ancienne API Gateway Express dans le projet SalamBot Suite.

## Phase 1: Setup Kong Gateway + Migration Services Core

### 1.1 Installation et Configuration Kong

```yaml
# docker-compose.kong.yml
version: '3.8'
services:
  kong-database:
    image: postgres:13
    environment:
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: kong
      POSTGRES_DB: kong
    volumes:
      - kong_data:/var/lib/postgresql/data
    networks:
      - kong-net

  kong-migrations:
    image: kong:3.4
    command: kong migrations bootstrap
    depends_on:
      - kong-database
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PG_DATABASE: kong
    networks:
      - kong-net

  kong:
    image: kong:3.4
    depends_on:
      - kong-database
      - kong-migrations
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PG_DATABASE: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
      KONG_ADMIN_GUI_URL: http://localhost:8002
    ports:
      - "8000:8000"  # Proxy
      - "8443:8443"  # Proxy SSL
      - "8001:8001"  # Admin API
      - "8444:8444"  # Admin API SSL
      - "8002:8002"  # Kong Manager
      - "8445:8445"  # Kong Manager SSL
    networks:
      - kong-net

volumes:
  kong_data:

networks:
  kong-net:
    driver: bridge
```

### 1.2 Services à Migrer

#### Services Core Identifiés
1. **Language Detection Service** (`libs/ai/lang-detect`)
2. **Authentication Service** (`libs/auth`)
3. **Configuration Service** (`libs/config`)
4. **Functions Runtime** (`apps/functions-run`)

#### Configuration des Services Kong

```javascript
/**
 * Configuration des services Kong pour SalamBot
 * @fileoverview Définit les services, routes et plugins Kong
 */

const KONG_SERVICES = {
  langDetect: {
    name: 'salambot-lang-detect',
    url: 'http://functions-run:3000/lang-detect',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/lang-detect'
  },
  auth: {
    name: 'salambot-auth',
    url: 'http://functions-run:3000/auth',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/auth'
  },
  genkit: {
    name: 'salambot-genkit',
    url: 'http://functions-run:3000/genkit',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/genkit'
  }
};
```

## Phase 2: Sécurité et Authentification

### 2.1 JWT Authentication Plugin

```javascript
/**
 * Configuration JWT pour Kong
 * @description Plugin JWT pour l'authentification des requêtes
 */
const JWT_CONFIG = {
  name: 'jwt',
  config: {
    secret_is_base64: false,
    key_claim_name: 'iss',
    algorithm: 'HS256',
    claims_to_verify: ['exp', 'iat']
  }
};
```

### 2.2 Rate Limiting

```javascript
/**
 * Configuration Rate Limiting
 * @description Limite le nombre de requêtes par utilisateur
 */
const RATE_LIMIT_CONFIG = {
  name: 'rate-limiting',
  config: {
    minute: 100,
    hour: 1000,
    policy: 'redis',
    redis_host: process.env.REDIS_HOST,
    redis_port: process.env.REDIS_PORT,
    redis_password: process.env.REDIS_PASSWORD
  }
};
```

## Phase 3: Monitoring et Observabilité

### 3.1 Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'kong'
    static_configs:
      - targets: ['kong:8001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'salambot-functions'
    static_configs:
      - targets: ['functions-run:3000']
    metrics_path: '/metrics'
```

### 3.2 Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SalamBot Kong Gateway Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(kong_http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(kong_request_latency_ms_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## Phase 4: Tests de Performance + Déploiement

### 4.1 Tests de Charge

```javascript
/**
 * Tests de performance Kong Gateway
 * @fileoverview Tests de charge pour valider les performances
 */

const loadTestConfig = {
  target: 'http://localhost:8000',
  phases: [
    { duration: '2m', arrivalRate: 10 },
    { duration: '5m', arrivalRate: 50 },
    { duration: '2m', arrivalRate: 100 }
  ],
  scenarios: [
    {
      name: 'Language Detection Load Test',
      weight: 70,
      flow: [
        {
          post: {
            url: '/lang-detect',
            json: {
              text: 'مرحبا كيف حالك؟ Hello how are you?'
            }
          }
        }
      ]
    }
  ]
};
```

### 4.2 Configuration Production

```yaml
# kong-production.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kong-gateway
  namespace: salambot-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kong-gateway
  template:
    metadata:
      labels:
        app: kong-gateway
    spec:
      containers:
      - name: kong
        image: kong:3.4
        env:
        - name: KONG_DATABASE
          value: "postgres"
        - name: KONG_PG_HOST
          valueFrom:
            secretKeyRef:
              name: kong-postgres
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## Checklist d'Implémentation

### Phase 1: Setup Kong
- [ ] Créer docker-compose.kong.yml
- [ ] Configurer base de données PostgreSQL
- [ ] Démarrer Kong Gateway
- [ ] Configurer services de base
- [ ] Tester connectivité

### Phase 2: Sécurité
- [ ] Implémenter JWT authentication
- [ ] Configurer rate limiting
- [ ] Tester sécurité endpoints
- [ ] Valider tokens JWT

### Phase 3: Monitoring
- [ ] Setup Prometheus
- [ ] Configurer Grafana
- [ ] Créer dashboards
- [ ] Tester métriques

### Phase 4: Production
- [ ] Tests de performance
- [ ] Configuration Kubernetes
- [ ] Déploiement staging
- [ ] Validation production
- [ ] Migration DNS

## Notes Techniques

- **Gestionnaire de paquets**: `pnpm`
- **Documentation**: Standard JSDoc
- **Architecture**: Nx Workspace monorepo
- **Base de données**: PostgreSQL pour Kong
- **Cache**: Redis pour rate limiting
- **Monitoring**: Prometheus + Grafana

---
*Document créé lors de la migration Kong Gateway*