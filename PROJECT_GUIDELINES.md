# Directives du Projet SalamBot Suite

## Standards de Développement

### Gestionnaire de Paquets
- **TOUJOURS utiliser `pnpm`** pour la gestion des dépendances
- Ne jamais utiliser `npm` ou `yarn`

### Standards de Documentation
- **Format JSDoc Standard** pour tous les nouveaux fichiers
- Pour les fichiers existants : mettre à jour les commentaires lors des modifications
- Structure JSDoc recommandée :
  ```javascript
  /**
   * Description de la fonction
   * @param {type} paramName - Description du paramètre
   * @returns {type} Description du retour
   * @example
   * // Exemple d'utilisation
   */
  ```

## Architecture Actuelle

### Migration Kong Gateway
- **Statut** : En cours de migration depuis l'ancienne API Gateway Express
- **Objectif** : Remplacer complètement l'ancienne logique API Gateway

### Plan d'Implémentation Kong
1. **Setup Kong Gateway + migration services core** ✅
   - Docker Compose configuration créée
   - Services SalamBot configurés
   - Script d'automatisation Kong setup
2. **Sécurité et authentification** (JWT, rate limiting) ✅
   - JWT plugin configuré
   - Rate limiting avec Redis
   - CORS policy
3. **Monitoring et observabilité** (Prometheus + Grafana) ✅
   - Prometheus metrics collection
   - Grafana dashboard pour Kong
   - Health checks configurés
4. **Tests de performance + déploiement production** 🔄
   - À implémenter : tests de charge
   - À implémenter : configuration Kubernetes
   - À implémenter : CI/CD pipeline

## Structure du Projet
- **Type** : Nx Workspace monorepo
- **Apps principales** :
  - `functions-run` : Genkit flows
  - `agent-desk` : Interface agent
  - `widget-web` : Widget web

## Erreurs à Éviter

### Gestion des Dépendances
- ❌ Ne pas utiliser `npm install` ou `yarn add`
- ✅ Utiliser `pnpm add` ou `pnpm install`

### Documentation
- ❌ Laisser du code sans documentation JSDoc
- ✅ Documenter toutes les nouvelles fonctions avec JSDoc

### Architecture
- ❌ Référencer l'ancienne API Gateway Express
- ✅ Utiliser Kong Gateway pour les nouvelles implémentations

### Kong Gateway
- ❌ Modifier directement la configuration Kong via l'interface
- ✅ Utiliser le script `scripts/kong-setup.js` pour la configuration
- ❌ Oublier de copier `.env.example` vers `.env`
- ✅ Configurer les variables d'environnement avant le démarrage

### Docker
- ❌ Utiliser `docker-compose.yml` pour Kong
- ✅ Utiliser `docker-compose.kong.yml` spécifiquement pour Kong
- ❌ Démarrer les services sans vérifier les health checks
- ✅ Attendre que tous les services soient healthy avant la configuration

## Commandes Utiles

```bash
# Installation des dépendances
pnpm install

# Ajout d'une dépendance
pnpm add <package-name>

# Développement
pnpm dev

# Tests
pnpm test

# Build
pnpm build

# Kong Gateway - Démarrage complet
docker-compose -f docker-compose.kong.yml up -d

# Kong Gateway - Configuration automatique
node scripts/kong-setup.js

# Kong Gateway - Vérification status
curl http://localhost:8001/status

# Kong Gateway - Arrêt
docker-compose -f docker-compose.kong.yml down

# Monitoring - Accès Grafana
# http://localhost:3001 (admin/admin)

# Monitoring - Accès Prometheus
# http://localhost:9090
```

## Notes de Migration
- L'ancienne logique API Gateway a été supprimée
- Les tests ont été simplifiés
- Le répertoire `coverage` contient des rapports obsolètes
- Le répertoire `node_modules` local dans `apps/functions-run` n'est plus nécessaire

---
*Dernière mise à jour : Migration Kong Gateway - Suppression ancienne API Gateway*