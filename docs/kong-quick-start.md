# Kong Gateway Quick Start Guide

## Vue d'Ensemble

Ce guide vous permet de démarrer rapidement Kong Gateway pour SalamBot Suite avec tous les services configurés.

## Prérequis

- Docker et Docker Compose installés
- Node.js 18+ et pnpm installés
- Ports disponibles : 8000, 8001, 8002, 3000, 3001, 6379, 9090

## Démarrage Rapide

### 1. Configuration de l'Environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables si nécessaire
# Les valeurs par défaut fonctionnent pour le développement local
```

### 2. Démarrage des Services

```bash
# Démarrer tous les services Kong Gateway
docker-compose -f docker-compose.kong.yml up -d

# Vérifier que tous les services sont démarrés
docker-compose -f docker-compose.kong.yml ps
```

### 3. Configuration Automatique de Kong

```bash
# Installer les dépendances pour le script de setup
pnpm install

# Attendre que Kong soit prêt (environ 30-60 secondes)
# Puis configurer automatiquement les services
node scripts/kong-setup.js
```

### 4. Vérification de l'Installation

```bash
# Vérifier le statut de Kong
curl http://localhost:8001/status

# Lister les services configurés
curl http://localhost:8001/services

# Lister les routes configurées
curl http://localhost:8001/routes
```

## Accès aux Interfaces

| Service | URL | Credentials |
|---------|-----|-------------|
| Kong Proxy | http://localhost:8000 | - |
| Kong Admin API | http://localhost:8001 | - |
| Kong Manager | http://localhost:8002 | - |
| Grafana Dashboard | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| SalamBot Functions | http://localhost:3000 | - |

## Test des APIs

### Language Detection API

```bash
# Test via Kong Gateway
curl -X POST http://localhost:8000/api/v1/lang-detect \
  -H "Content-Type: application/json" \
  -d '{"text": "مرحبا كيف حالك؟ Hello how are you?"}'
```

### Authentication API

```bash
# Test via Kong Gateway
curl -X POST http://localhost:8000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

### Configuration API

```bash
# Test via Kong Gateway
curl http://localhost:8000/api/v1/config
```

## Monitoring et Métriques

### Grafana Dashboard

1. Accéder à http://localhost:3001
2. Se connecter avec admin/admin
3. Le dashboard "SalamBot Kong Gateway" est pré-configuré

### Prometheus Metrics

1. Accéder à http://localhost:9090
2. Exemples de requêtes :
   - `rate(kong_http_requests_total[5m])` - Taux de requêtes
   - `histogram_quantile(0.95, rate(kong_request_latency_ms_bucket[5m]))` - Latence 95e percentile

## Dépannage

### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.kong.yml logs kong
docker-compose -f docker-compose.kong.yml logs kong-database

# Redémarrer les services
docker-compose -f docker-compose.kong.yml restart
```

### Kong setup échoue

```bash
# Vérifier que Kong est accessible
curl http://localhost:8001/status

# Attendre plus longtemps et réessayer
sleep 30
node scripts/kong-setup.js
```

### Ports déjà utilisés

```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :8000
netstat -tulpn | grep :8001

# Modifier les ports dans docker-compose.kong.yml si nécessaire
```

### Reset complet

```bash
# Arrêter et supprimer tous les conteneurs et volumes
docker-compose -f docker-compose.kong.yml down -v

# Supprimer les images (optionnel)
docker-compose -f docker-compose.kong.yml down --rmi all

# Redémarrer proprement
docker-compose -f docker-compose.kong.yml up -d
```

## Architecture des Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│  Kong Gateway   │───▶│ SalamBot Funcs  │
│                 │    │   (Port 8000)   │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │  (Rate Limit)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Prometheus    │───▶│     Grafana     │
                       │   (Metrics)     │    │  (Dashboard)    │
                       └─────────────────┘    └─────────────────┘
```

## Services Configurés

### Kong Services
- `salambot-lang-detect` - Service de détection de langue
- `salambot-auth` - Service d'authentification
- `salambot-genkit` - Service Genkit AI
- `salambot-config` - Service de configuration

### Kong Routes
- `/api/v1/lang-detect` → `salambot-lang-detect`
- `/api/v1/auth` → `salambot-auth`
- `/api/v1/genkit` → `salambot-genkit`
- `/api/v1/config` → `salambot-config`

### Plugins Globaux
- **Prometheus** - Collecte de métriques
- **CORS** - Gestion des requêtes cross-origin
- **Rate Limiting** - Limitation du taux de requêtes

### Plugins par Service
- **JWT** sur `salambot-auth` - Authentification JWT
- **Request Size Limiting** sur `salambot-lang-detect` - Limite de taille des requêtes

## Prochaines Étapes

1. **Tests de Performance** - Implémenter des tests de charge avec Artillery
2. **Configuration Production** - Créer les configurations Kubernetes
3. **CI/CD Pipeline** - Intégrer Kong dans le pipeline de déploiement
4. **SSL/TLS** - Configurer les certificats pour la production
5. **Monitoring Avancé** - Ajouter des alertes et dashboards supplémentaires

---

**Note**: Ce setup est optimisé pour le développement local. Pour la production, consultez le [guide de déploiement](./deployment-guide.md).