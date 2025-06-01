# Rotation Automatique des Mots de Passe Redis

## Vue d'ensemble

Ce document décrit le système de rotation automatique des mots de passe Redis mis en place pour améliorer la sécurité de l'infrastructure SalamBot.

## Architecture

### Composants

1. **Script de Rotation** (`scripts/rotate-redis-password.ts`)
   - Génère de nouveaux mots de passe sécurisés
   - Met à jour Google Secret Manager
   - Synchronise la configuration Firestore
   - Applique les changements via Terraform
   - Vérifie la connectivité Redis

2. **Workflow GitHub Actions** (`.github/workflows/redis-password-rotation.yml`)
   - Exécution planifiée mensuelle (1er de chaque mois à 02:00 UTC)
   - Déclenchement manuel possible
   - Support multi-environnements (dev, staging, production)
   - Mode simulation (dry-run)

3. **Tests Unitaires** (`libs/config/__tests__/redis.spec.ts`)
   - Validation des erreurs TLS
   - Tests de retry et reconnexion
   - Métriques et monitoring

## Processus de Rotation

### Étapes Automatiques

1. **Préparation**
   - Vérification des variables d'environnement
   - Initialisation des clients (Firebase, Secret Manager)
   - Récupération de la configuration actuelle

2. **Génération du Nouveau Mot de Passe**
   - Longueur: 32 caractères
   - Caractères: lettres, chiffres, symboles spéciaux
   - Génération cryptographiquement sécurisée

3. **Mise à Jour des Secrets**
   - Création d'une nouvelle version dans Google Secret Manager
   - Mise à jour de la configuration Firestore
   - Incrémentation du numéro de version

4. **Application Infrastructure**
   - Exécution de `terraform plan`
   - Application des changements via `terraform apply`
   - Mise à jour de l'instance Redis

5. **Vérification**
   - Test de connectivité Redis
   - Validation du nouveau mot de passe
   - Vérification de la santé du service

6. **Notification**
   - Logs détaillés dans GitHub Actions
   - Métriques de performance
   - Alertes en cas d'échec

## Configuration

### Variables d'Environnement Requises

```bash
# Projet Google Cloud
GCP_PROJECT_ID=your-project-id

# Environnement
NODE_ENV=production|staging|development

# Credentials (optionnel en production avec Workload Identity)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Secrets GitHub Actions

```yaml
# Authentification Google Cloud
WIF_PROVIDER: projects/123456789/locations/global/workloadIdentityPools/github/providers/github
WIF_SERVICE_ACCOUNT: github-actions@project.iam.gserviceaccount.com

# Configuration Terraform
TERRAFORM_STATE_BUCKET: your-terraform-state-bucket

# Projet
GCP_PROJECT_ID: your-project-id
```

## Utilisation

### Exécution Manuelle

```bash
# Installation des dépendances
npm install

# Rotation manuelle (développement)
npm run infra:rotate-redis-password

# Avec tsx directement
npx tsx scripts/rotate-redis-password.ts
```

### Déclenchement GitHub Actions

1. **Automatique**: Le 1er de chaque mois à 02:00 UTC
2. **Manuel**: Via l'interface GitHub Actions
   - Sélection de l'environnement
   - Mode simulation disponible

### Mode Simulation (Dry Run)

```bash
# Via GitHub Actions (interface web)
# Cocher "Dry run mode" lors du déclenchement manuel

# Le mode simulation affiche les étapes sans les exécuter
```

## Monitoring et Alertes

### Métriques Disponibles

- **Durée de rotation**: Temps total du processus
- **Version de rotation**: Numéro incrémental
- **Statut de santé Redis**: Avant/après rotation
- **Latence de connexion**: Performance Redis

### Grafana Cloud Integration

Le module Terraform exporte maintenant l'annotation `prometheus_target_tag` pour faciliter l'intégration avec Grafana Cloud:

```hcl
output "prometheus_target_tag" {
  description = "Prometheus target tag for Grafana Cloud monitoring"
  value       = "redis-${var.environment}-${var.instance_name}"
}
```

### Alertes Recommandées

1. **Échec de Rotation**
   - Déclencheur: Exit code != 0
   - Action: Notification équipe DevOps

2. **Santé Redis Dégradée**
   - Déclencheur: Health check failed
   - Action: Investigation immédiate

3. **Rotation en Retard**
   - Déclencheur: Pas de rotation depuis > 35 jours
   - Action: Vérification du workflow

## Sécurité

### Bonnes Pratiques Implémentées

1. **Mots de Passe Forts**
   - 32 caractères minimum
   - Caractères spéciaux inclus
   - Génération cryptographique

2. **Gestion des Secrets**
   - Google Secret Manager pour le stockage
   - Versioning automatique
   - Accès contrôlé par IAM

3. **Authentification**
   - Workload Identity pour GitHub Actions
   - Service accounts dédiés
   - Permissions minimales

4. **Audit Trail**
   - Logs détaillés de chaque rotation
   - Horodatage précis
   - Traçabilité complète

### Permissions IAM Requises

```yaml
# Service Account pour GitHub Actions
roles:
  - roles/secretmanager.admin
  - roles/datastore.user
  - roles/redis.admin
  - roles/compute.instanceAdmin
```

## Dépannage

### Erreurs Communes

#### 1. Échec d'Authentification Google Cloud

```bash
Erreur: "Application Default Credentials not found"

Solution:
- Vérifier WIF_PROVIDER et WIF_SERVICE_ACCOUNT
- Valider les permissions IAM
- Tester l'authentification localement
```

#### 2. Échec Terraform

```bash
Erreur: "Error applying plan"

Solution:
- Vérifier l'état Terraform
- Valider les permissions GCP
- Examiner les logs détaillés
```

#### 3. Connexion Redis Échouée

```bash
Erreur: "Redis connection failed after rotation"

Solution:
- Vérifier la propagation du mot de passe
- Tester la connectivité réseau
- Examiner les logs Redis
```

### Commandes de Diagnostic

```bash
# Vérifier la configuration actuelle
node -e "console.log(require('./libs/config/dist/redis').getRedisMetrics())"

# Tester la connectivité Redis
node -e "require('./libs/config/dist/redis').checkRedisHealth().then(console.log)"

# Valider la configuration Terraform
npm run infra:validate

# Vérifier l'état Terraform
cd infra/terraform && terraform show
```

## Roadmap

### Améliorations Prévues

1. **Notifications Avancées**
   - Intégration Slack/Teams
   - Alertes email personnalisées
   - Dashboard de statut

2. **Rotation Intelligente**
   - Détection automatique des problèmes
   - Rollback automatique en cas d'échec
   - Rotation basée sur les métriques

3. **Multi-Cloud Support**
   - Support AWS Secrets Manager
   - Intégration Azure Key Vault
   - Rotation cross-cloud

4. **Tests d'Intégration**
   - Tests end-to-end automatisés
   - Validation de performance
   - Tests de charge post-rotation

## Support

Pour toute question ou problème:

- **Documentation**: Ce fichier et `infra/README.md`
- **Issues**: GitHub Issues du projet
- **Contact**: info@salambot.ma
- **Monitoring**: Grafana Cloud dashboard