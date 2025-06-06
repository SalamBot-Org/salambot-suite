# Plan de Résolution des Échecs de Tests - SalamBot Functions-Run

## 📋 Contexte du Projet

**Projet** : SalamBot API Gateway Enterprise  
**Module** : functions-run (API Gateway + Genkit AI Flows)  
**Gestionnaire de paquets** : pnpm 9.1.2  
**Stack** : Node.js 20.18.0 LTS, TypeScript 5.4.5, Express.js, Genkit 0.5.8  

### État Actuel des Tests
- ✅ Tests simples : 6/6 passent
- ❌ Tests complets : 25/56 échouent (55% d'échec)
- 🔍 Cause principale : Services externes non disponibles

## 🎯 Objectifs

1. **Résoudre les échecs de tests d'intégration** liés aux services externes
2. **Configurer un environnement de test complet** avec tous les services mock
3. **Optimiser la configuration Jest** pour les tests d'intégration
4. **Documenter les procédures de test** pour l'équipe

## 🔧 Plan d'Action Détaillé

### Phase 1 : Analyse et Configuration de Base

#### 1.1 Audit des Services Externes Requis

D'après l'analyse du code, les services suivants sont nécessaires :

- **Genkit AI Flows Service** (port 3001) - ✅ Mock existant
- **REST API Service** (port 3002) - ❌ Mock manquant
- **WebSocket Service** (port 3003) - ❌ Mock manquant
- **Redis Cache** (port 6379) - ❌ Service requis
- **Prometheus Metrics** (port 9090) - ❌ Mock manquant

#### 1.2 Configuration des Variables d'Environnement de Test

```bash
# Créer .env.test basé sur .env.example
cp .env.example .env.test
```

Variables spécifiques aux tests :
```env
NODE_ENV=test
PORT=3000
REDIS_URL=redis://localhost:6379
GENKIT_SERVICE_URL=http://localhost:3001
REST_API_SERVICE_URL=http://localhost:3002
WEBSOCKET_SERVICE_URL=http://localhost:3003
METRICS_ENABLED=true
LOG_LEVEL=error
```

### Phase 2 : Création des Services Mock

#### 2.1 Amélioration du Mock Genkit Existant

Le fichier `genkit-mock.js` existe déjà mais nécessite des améliorations :

```javascript
// Ajouter plus d'endpoints pour couvrir tous les cas de test
// Améliorer la gestion des erreurs
// Ajouter des logs détaillés pour le debugging
```

#### 2.2 Création du Mock REST API Service

```javascript
// Créer rest-api-mock.js
// Port 3002
// Endpoints : /health, /api/*, /users/*, /conversations/*
```

#### 2.3 Création du Mock WebSocket Service

```javascript
// Créer websocket-mock.js
// Port 3003
// Support WebSocket + HTTP fallback
```

#### 2.4 Création du Mock Prometheus

```javascript
// Créer prometheus-mock.js
// Port 9090
// Endpoints : /metrics, /-/healthy
```

### Phase 3 : Configuration Redis pour les Tests

#### 3.1 Options pour Redis

**Option A : Redis en mémoire (Recommandée)**
```bash
pnpm add --save-dev redis-memory-server
```

**Option B : Redis Docker pour tests**
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  redis-test:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --save ""
```

**Option C : Mock Redis**
```bash
pnpm add --save-dev ioredis-mock
```

### Phase 4 : Configuration Jest Avancée

#### 4.1 Création de jest.integration.config.js

```javascript
module.exports = {
  ...require('./jest.config.ts').default,
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup-integration.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Tests séquentiels pour éviter les conflits de ports
  globalSetup: '<rootDir>/src/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts'
};
```

#### 4.2 Scripts de Setup/Teardown Globaux

```typescript
// src/__tests__/global-setup.ts
// Démarrer tous les services mock avant les tests

// src/__tests__/global-teardown.ts
// Arrêter tous les services mock après les tests
```

### Phase 5 : Orchestration avec Docker Compose

#### 5.1 Création de docker-compose.test.yml

```yaml
version: '3.8'
services:
  redis-test:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  genkit-mock:
    build:
      context: .
      dockerfile: Dockerfile.mock
    ports:
      - "3001:3001"
    
  rest-api-mock:
    build:
      context: .
      dockerfile: Dockerfile.mock
    ports:
      - "3002:3002"
    
  websocket-mock:
    build:
      context: .
      dockerfile: Dockerfile.mock
    ports:
      - "3003:3003"
```

### Phase 6 : Scripts pnpm Optimisés

#### 6.1 Mise à jour du package.json

```json
{
  "scripts": {
    "test:integration": "jest --config jest.integration.config.js",
    "test:integration:watch": "jest --config jest.integration.config.js --watch",
    "test:integration:coverage": "jest --config jest.integration.config.js --coverage",
    "test:setup": "node scripts/setup-test-services.js",
    "test:teardown": "node scripts/teardown-test-services.js",
    "test:docker": "docker-compose -f docker-compose.test.yml up -d",
    "test:docker:down": "docker-compose -f docker-compose.test.yml down",
    "test:full": "pnpm run test:setup && pnpm run test:integration && pnpm run test:teardown"
  }
}
```

### Phase 7 : Amélioration des Tests

#### 7.1 Séparation des Tests

```
src/__tests__/
├── unit/           # Tests unitaires (mocks complets)
├── integration/    # Tests d'intégration (services mock)
├── e2e/           # Tests end-to-end (services réels)
├── mocks/         # Services mock
├── fixtures/      # Données de test
└── utils/         # Utilitaires de test
```

#### 7.2 Configuration des Timeouts

```typescript
// Ajuster les timeouts dans les tests
describe('Integration Tests', () => {
  beforeAll(async () => {
    // Attendre que tous les services soient prêts
    await waitForServices();
  }, 60000); // 60s timeout pour le setup
  
  it('should handle AI requests', async () => {
    // Test avec timeout approprié
  }, 30000); // 30s timeout par test
});
```

## 🚀 Mise en Œuvre

### Étape 1 : Préparation de l'environnement

```bash
# 1. Installer les dépendances de test manquantes
pnpm add --save-dev redis-memory-server ioredis-mock

# 2. Créer les fichiers de configuration
cp .env.example .env.test

# 3. Créer la structure de test
mkdir -p src/__tests__/{unit,integration,e2e,mocks,fixtures,utils}
```

### Étape 2 : Création des services mock

```bash
# Créer les fichiers mock
touch src/__tests__/mocks/{rest-api-mock.js,websocket-mock.js,prometheus-mock.js}
touch src/__tests__/{global-setup.ts,global-teardown.ts,setup-integration.ts}
```

### Étape 3 : Configuration Jest

```bash
# Créer la configuration Jest d'intégration
touch jest.integration.config.js
```

### Étape 4 : Tests et validation

```bash
# Tester la configuration
pnpm run test:setup
pnpm run test:integration
pnpm run test:teardown
```

## 📊 Métriques de Succès

- ✅ **Taux de réussite des tests** : 95%+ (objectif 56/56)
- ✅ **Temps d'exécution** : <5 minutes pour la suite complète
- ✅ **Stabilité** : 0 test flaky
- ✅ **Couverture** : Maintenir >80%

## 🔍 Monitoring et Maintenance

### Surveillance Continue

1. **CI/CD Integration** : Tests automatiques sur chaque PR
2. **Performance Monitoring** : Alertes si les tests dépassent 10 minutes
3. **Flaky Test Detection** : Identification automatique des tests instables
4. **Coverage Reports** : Rapports de couverture automatiques

### Maintenance Préventive

1. **Mise à jour des mocks** : Synchronisation avec les vrais services
2. **Nettoyage des données de test** : Éviter l'accumulation
3. **Optimisation des performances** : Profiling régulier
4. **Documentation** : Mise à jour des procédures

## 📚 Documentation

### Pour les Développeurs

1. **Guide de contribution** : Comment ajouter de nouveaux tests
2. **Troubleshooting** : Solutions aux problèmes courants
3. **Best Practices** : Standards de test pour l'équipe
4. **Architecture** : Diagrammes des flux de test

### Pour l'Équipe QA

1. **Procédures de test** : Étapes de validation
2. **Scénarios de test** : Cas d'usage couverts
3. **Rapports** : Formats et fréquence
4. **Escalation** : Processus en cas d'échec

---

**Prochaines étapes** : Commencer par la Phase 1 (Analyse et Configuration de Base) et procéder séquentiellement selon ce plan.

**Estimation** : 2-3 jours de développement pour une implémentation complète.

**Responsable** : Équipe Platform SalamBot (platform@salambot.ma)