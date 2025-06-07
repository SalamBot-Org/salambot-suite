# 🚀 Guide de Développement - SalamBot Functions-Run

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Architecture du Projet](#architecture-du-projet)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Structure des Tests](#structure-des-tests)
5. [Services Mock](#services-mock)
6. [Développement Local](#développement-local)
7. [Bonnes Pratiques](#bonnes-pratiques)
8. [Débogage](#débogage)
9. [Contribution](#contribution)
10. [FAQ](#faq)

## Introduction

Bienvenue dans le projet **SalamBot Functions-Run** ! Ce guide vous aidera à comprendre l'architecture, configurer votre environnement de développement et contribuer efficacement au projet.

### 🎯 Objectifs du Projet

- **API Gateway Enterprise** : Point d'entrée centralisé pour tous les microservices
- **Support Multilingue** : Arabe, Français, Anglais, Darija marocaine
- **Intelligence Artificielle** : Intégration avec Genkit AI pour la détection de langue et génération de réponses
- **Scalabilité** : Architecture microservices avec Redis, WebSocket, et monitoring Prometheus

## Architecture du Projet

### 🏗️ Structure Générale

```
functions-run/
├── src/
│   ├── gateway/           # Code principal de l'API Gateway
│   ├── __tests__/         # Tests et environnement de test
│   │   ├── integration/   # Tests d'intégration
│   │   ├── unit/          # Tests unitaires
│   │   └── mocks/         # Services mock pour les tests
│   └── __mocks__/         # Mocks pour les dépendances externes
├── monitoring/            # Configuration monitoring (Prometheus, Grafana)
├── nginx/                 # Configuration reverse proxy
└── scripts/              # Scripts d'automatisation
```

### 🔧 Technologies Utilisées

- **Runtime** : Node.js + TypeScript
- **Framework** : Express.js
- **Base de données** : Redis (cache et sessions)
- **Tests** : Jest avec configurations multiples
- **AI** : Genkit AI (Google)
- **Monitoring** : Prometheus + Grafana
- **Communication** : WebSocket pour temps réel
- **Containerisation** : Docker + Docker Compose

## Configuration de l'Environnement

### 📦 Prérequis

```bash
# Node.js (version 18+)
node --version

# pnpm (gestionnaire de paquets)
npm install -g pnpm

# Docker (pour les services externes)
docker --version
docker-compose --version
```

### 🚀 Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd salambot-suite/apps/functions-run

# 2. Installer les dépendances
pnpm install

# 3. Copier la configuration d'environnement
cp .env.example .env.test

# 4. Construire le projet
pnpm run build
```

### ⚙️ Variables d'Environnement

Créez un fichier `.env.test` avec :

```env
# Configuration de base
NODE_ENV=test
LOG_LEVEL=error
PORT=8080

# Redis (sera remplacé par Redis en mémoire pour les tests)
REDIS_URL=redis://localhost:6379
REDIS_DB=15
REDIS_KEY_PREFIX=salambot:test:gateway:

# Services Mock
MOCK_GENKIT_PORT=3001
MOCK_REST_API_PORT=3002
MOCK_WEBSOCKET_PORT=3003
MOCK_PROMETHEUS_PORT=9090

# Configuration des mocks
MOCK_RESPONSE_DELAY_MS=50
MOCK_ERROR_RATE_PERCENT=5
MOCK_TIMEOUT_RATE_PERCENT=2
```

## Structure des Tests

### 🧪 Types de Tests

#### 1. Tests Unitaires
```bash
# Exécuter tous les tests unitaires
pnpm run test:unit

# Tests avec surveillance
pnpm run test:watch

# Couverture de code
pnpm run test:coverage
```

#### 2. Tests d'Intégration
```bash
# Tests d'intégration complets
pnpm run test:integration

# Tests d'intégration avec surveillance
pnpm run test:integration:watch
```

### 📁 Organisation des Tests

```
__tests__/
├── integration/
│   └── gateway.integration.test.ts    # Tests bout-en-bout
├── unit/
│   ├── redis-memory.unit.test.ts      # Tests Redis
│   └── mocks.unit.test.ts             # Tests des mocks
├── mocks/                             # Services mock
│   ├── genkit-mock.js                 # Mock Genkit AI
│   ├── rest-api-mock.js               # Mock API REST
│   ├── websocket-mock.js              # Mock WebSocket
│   └── prometheus-mock.js             # Mock Prometheus
├── global-setup.ts                    # Setup global des tests
├── global-teardown.ts                 # Nettoyage global
├── redis-memory-setup.ts              # Configuration Redis mémoire
└── setup-integration.ts               # Setup tests d'intégration
```

### 🔧 Configuration Jest

Le projet utilise plusieurs configurations Jest :

- **`jest.config.ts`** : Configuration principale (tests unitaires)
- **`jest.integration.final.config.js`** : Tests d'intégration optimisés
- **`jest.integration.simple.config.js`** : Tests d'intégration simplifiés

## Services Mock

### 🎭 Genkit Mock (Port 3001)

**Endpoints disponibles :**
- `GET /health` : Vérification de santé
- `POST /langDetect` : Détection de langue
- `POST /generateReply` : Génération de réponses IA

**Exemple d'utilisation :**
```javascript
// Détection de langue
const response = await axios.post('http://localhost:3001/langDetect', {
  text: 'مرحبا كيف حالك؟'
});
// Résultat : { language: 'ar', confidence: 0.95, dialect: null }

// Génération de réponse
const reply = await axios.post('http://localhost:3001/generateReply', {
  message: 'مرحبا',
  language: 'ar',
  context: { userId: 'user123' }
});
```

### 🌐 REST API Mock (Port 3002)

**Endpoints disponibles :**
- `GET /api/users` : Liste des utilisateurs
- `POST /api/users` : Créer un utilisateur
- `GET /api/conversations` : Liste des conversations
- `POST /api/conversations` : Créer une conversation
- `GET /api/conversations/:id/messages` : Messages d'une conversation

### 🔌 WebSocket Mock (Port 3003)

**Fonctionnalités :**
- Connexions WebSocket temps réel
- Gestion des rooms/salles
- Événements : `connection`, `message`, `room_join`, `room_leave`
- API REST pour la gestion : `GET /api/connections`, `GET /api/rooms`

### 📊 Prometheus Mock (Port 9090)

**Endpoints :**
- `GET /metrics` : Métriques au format Prometheus
- `GET /api/v1/query` : Requêtes PromQL
- `GET /-/healthy` : Health check

## Développement Local

### 🏃‍♂️ Démarrage Rapide

```bash
# 1. Démarrer tous les services mock
pnpm run mock:all

# 2. Dans un autre terminal, démarrer l'API Gateway
pnpm run gateway:dev

# 3. Dans un troisième terminal, exécuter les tests
pnpm run test:integration
```

### 🔄 Workflow de Développement

1. **Créer une branche** :
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. **Développer avec tests** :
   ```bash
   # Mode surveillance pour les tests
   pnpm run test:watch
   
   # Mode surveillance pour l'application
   pnpm run gateway:dev
   ```

3. **Vérifier la qualité** :
   ```bash
   # Linting
   pnpm run lint
   
   # Vérification TypeScript
   pnpm run type-check
   
   # Tests complets
   pnpm run test:all
   ```

4. **Commit et push** :
   ```bash
   git add .
   git commit -m "feat: ajouter nouvelle fonctionnalité"
   git push origin feature/nouvelle-fonctionnalite
   ```

### 🐳 Développement avec Docker

```bash
# Démarrer l'environnement complet
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter l'environnement
docker-compose down
```

## Bonnes Pratiques

### 📝 Code Style

- **TypeScript strict** : Toujours typer les variables et fonctions
- **ESLint** : Utiliser la configuration ESLint v9 flat config
- **Prettier** : Formatage automatique du code
- **Conventions de nommage** :
  - Fichiers : `kebab-case.ts`
  - Classes : `PascalCase`
  - Fonctions/variables : `camelCase`
  - Constantes : `UPPER_SNAKE_CASE`

### 🧪 Tests

- **Couverture minimale** : 80% pour les nouvelles fonctionnalités
- **Tests unitaires** : Pour la logique métier
- **Tests d'intégration** : Pour les interactions entre services
- **Mocks** : Utiliser les services mock fournis
- **Nettoyage** : Toujours nettoyer les ressources après les tests

### 🔒 Sécurité

- **Pas de secrets** : Jamais de clés API ou mots de passe dans le code
- **Variables d'environnement** : Utiliser `.env` pour la configuration
- **Validation** : Valider toutes les entrées utilisateur
- **Logs** : Ne pas logger d'informations sensibles

### 🚀 Performance

- **Redis** : Utiliser Redis pour le cache et les sessions
- **Async/Await** : Préférer aux callbacks
- **Timeouts** : Définir des timeouts pour toutes les requêtes externes
- **Monitoring** : Utiliser les métriques Prometheus

## Débogage

### 🔍 Logs

```bash
# Logs de l'application
tail -f logs/gateway.log

# Logs des tests
LOG_LEVEL=debug pnpm run test:integration

# Logs des services mock
pnpm run mock:genkit  # Dans un terminal séparé
```

### 🛠️ Outils de Debug

```bash
# Debug avec Node.js inspector
node --inspect-brk dist/gateway/index.js

# Debug des tests Jest
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 🚨 Problèmes Courants

#### Redis Connection Refused
```bash
# Vérifier que Redis en mémoire est utilisé
echo $REDIS_URL
# Devrait afficher : redis://127.0.0.1:6380

# Redémarrer les tests
pnpm run test:integration
```

#### Ports Occupés
```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/macOS
lsof -ti:3001 | xargs kill -9
```

#### ESLint Errors
```bash
# Utiliser la nouvelle configuration
npx eslint src/**/*.ts --config eslint.config.js

# Auto-fix
npx eslint src/**/*.ts --config eslint.config.js --fix
```

## Contribution

### 📋 Checklist avant PR

- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration passent
- [ ] Couverture de code ≥ 80%
- [ ] ESLint sans erreurs
- [ ] TypeScript sans erreurs
- [ ] Documentation mise à jour
- [ ] Variables d'environnement documentées

### 🔄 Process de Review

1. **Auto-review** : Relire son propre code
2. **Tests** : Vérifier que tous les tests passent
3. **Documentation** : Mettre à jour si nécessaire
4. **PR Description** : Décrire clairement les changements

### 📝 Template de PR

```markdown
## 🎯 Objectif
Description claire de ce qui est implémenté/corrigé

## 🔧 Changements
- [ ] Fonctionnalité A ajoutée
- [ ] Bug B corrigé
- [ ] Tests C ajoutés

## 🧪 Tests
- [ ] Tests unitaires ajoutés
- [ ] Tests d'intégration passent
- [ ] Couverture maintenue

## 📋 Checklist
- [ ] Code review auto effectué
- [ ] Documentation mise à jour
- [ ] Variables d'environnement documentées
```

## FAQ

### ❓ Questions Fréquentes

**Q: Pourquoi Redis en mémoire pour les tests ?**
R: Pour éviter les dépendances externes et garantir l'isolation des tests.

**Q: Comment ajouter un nouveau service mock ?**
R: 
1. Créer le fichier dans `src/__tests__/mocks/`
2. Ajouter la configuration dans `global-setup.ts`
3. Mettre à jour les tests d'intégration

**Q: Que faire si les tests d'intégration échouent ?**
R: 
1. Vérifier que tous les services mock sont démarrés
2. Vérifier les ports disponibles
3. Consulter les logs des services

**Q: Comment déboguer un problème de performance ?**
R: 
1. Utiliser les métriques Prometheus
2. Activer les logs de debug
3. Profiler avec Node.js inspector

**Q: Comment contribuer à la documentation ?**
R: 
1. Mettre à jour ce guide
2. Ajouter des commentaires JSDoc
3. Créer des exemples d'utilisation

### 📞 Support

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Discussions** : Pour les questions générales
- **Wiki** : Pour la documentation détaillée

---

**Bonne contribution ! 🚀**

*Ce guide est maintenu par l'équipe SalamBot Platform. N'hésitez pas à le mettre à jour selon vos besoins.*