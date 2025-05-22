# Guide de déploiement SalamBot MVP SaaS

Ce document détaille le processus de déploiement du MVP SalamBot sur une infrastructure SaaS utilisant Vercel pour le frontend et Google Cloud Run pour le backend.

## Architecture globale

```mermaid
graph TD
    subgraph "Frontend (Vercel)"
        A[Widget Web] --> |API Calls| C
        B[Agent Desk] --> |API Calls| C
    end
    
    subgraph "Backend (Cloud Run)"
        C[Functions Run API]
    end
    
    subgraph "Persistence"
        D[Firestore]
    end
    
    subgraph "Auth"
        E[Firebase Auth]
    end
    
    subgraph "Monitoring"
        F[OpenTelemetry]
        G[Grafana Cloud]
    end
    
    C --> D
    C --> E
    C --> F
    F --> G
    A --> E
    B --> E
```

## Prérequis

### Comptes et accès

- Compte GitHub avec accès au dépôt `salambot-suite`
- Compte Vercel avec accès à l'organisation `salambot`
- Compte Google Cloud Platform avec accès au projet `salambot-prod`
- Compte Grafana Cloud pour la télémétrie

### Outils locaux (pour le développement)

- Node.js 20+
- pnpm 8+
- Nx CLI
- Google Cloud SDK
- Terraform (optionnel)

## Pipeline CI/CD

Le déploiement est entièrement automatisé via GitHub Actions. Le workflow principal (`ci-cd.yml`) comprend les étapes suivantes :

1. **Lint** : Vérification de la qualité du code
2. **Test** : Exécution des tests unitaires
3. **Build** : Compilation des applications
4. **Deploy** : Déploiement sur Vercel et Cloud Run
5. **Smoke Test** : Validation post-déploiement

### Déclencheurs

- **Pull Request** vers `main` ou `release/*` : Lint, Test, Build
- **Push** vers `main` : Déploiement en production
- **Push** vers `release/*` : Déploiement en staging
- **Tag** `v*` : Déploiement en production avec version spécifique

## Configuration des environnements

### Variables d'environnement

#### GitHub Secrets (à configurer)

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VERCEL_TOKEN` | Token d'API Vercel | `vercel_token_xxxxx` |
| `VERCEL_ORG_ID` | ID de l'organisation Vercel | `team_xxxxxx` |
| `VERCEL_PROJECT_ID_WIDGET` | ID du projet Widget Web | `prj_xxxxxx` |
| `VERCEL_PROJECT_ID_DESK` | ID du projet Agent Desk | `prj_xxxxxx` |
| `GCP_PROJECT_ID` | ID du projet Google Cloud | `salambot-prod` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider OIDC pour GitHub Actions | `projects/123456/locations/global/workloadIdentityPools/github/providers/github-actions` |
| `GCP_SERVICE_ACCOUNT` | Email du compte de service | `github-actions@salambot-prod.iam.gserviceaccount.com` |
| `CLOUD_RUN_URL` | URL du service Cloud Run | `https://api.salambot.app` |
| `FIREBASE_API_KEY` | Clé API Firebase | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `FIREBASE_PROJECT_ID` | ID du projet Firebase | `salambot-prod` |
| `JWT_PRIVATE_KEY` | Clé privée RS256 pour JWT | `-----BEGIN PRIVATE KEY-----\nXXXX...` |
| `JWT_PUBLIC_KEY` | Clé publique RS256 pour JWT | `-----BEGIN PUBLIC KEY-----\nXXXX...` |
| `OTLP_ENDPOINT` | Endpoint OpenTelemetry | `https://otlp.grafana.net:443/v1/traces` |
| `OTLP_HEADERS` | En-têtes pour l'authentification OTLP | `Authorization=Basic base64(username:password)` |

### Fichiers de configuration

#### Vercel

Les fichiers `.vercel/widget-web.project.json` et `.vercel/agent-desk.project.json` définissent la configuration des projets Vercel.

#### Cloud Run

Le fichier `cloudrun/.env.prod` définit les variables d'environnement pour le service Cloud Run.

## Infrastructure (Terraform)

Le dossier `infra/terraform` contient les définitions Terraform pour :

- Service Account Cloud Run
- Secrets Manager pour les variables sensibles
- Service Cloud Run avec configuration
- Index Firestore pour les performances
- IAM pour la sécurité

### Déploiement de l'infrastructure

```bash
# Initialiser Terraform
cd infra/terraform
terraform init

# Planifier les changements
terraform plan -var="project_id=salambot-prod"

# Appliquer les changements
terraform apply -var="project_id=salambot-prod"
```

## Validation post-déploiement

Les smoke tests Playwright vérifient automatiquement :

1. L'accessibilité du Widget Web
2. L'accessibilité de l'Agent Desk
3. La fonctionnalité des endpoints API
4. La détection de langue
5. La persistance des conversations

## URLs de production

- **Widget** : https://widget.salambot.app
- **Agent Desk** : https://desk.salambot.app
- **API** : https://api.salambot.app

## Monitoring et observabilité

Les traces OpenTelemetry sont envoyées à Grafana Cloud et accessibles via :

- **Dashboard** : https://salambot.grafana.net/dashboards
- **Traces** : https://salambot.grafana.net/explore?orgId=1&left={"datasource":"tempo","queries":[{"query":"service.name=\"salambot-functions-run\""}]}

## Procédures de rollback

En cas de problème après déploiement :

1. **Rollback via GitHub** : Revert le commit problématique et push
2. **Rollback manuel** :
   - Vercel : Utiliser l'interface pour revenir à un déploiement précédent
   - Cloud Run : Utiliser `gcloud run services update-traffic` pour revenir à une révision précédente

## Génération des clés JWT

Pour générer une nouvelle paire de clés JWT :

```bash
# Générer la clé privée
openssl genrsa -out private.pem 2048

# Extraire la clé publique
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

# Formater pour les variables d'environnement
cat private.pem | awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}'
cat public.pem | awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}'
```

## Troubleshooting

### Problèmes courants

1. **Erreur 401 sur l'API** : Vérifier les clés JWT et la configuration Firebase
2. **Échec des smoke tests** : Vérifier les logs Cloud Run et Vercel
3. **Problèmes de build** : Vérifier les dépendances et la compatibilité Nx

### Logs

- **Cloud Run** : Console GCP > Cloud Run > salambot-functions-run > Logs
- **Vercel** : Dashboard Vercel > Projets > Déploiements > Logs
- **GitHub Actions** : Onglet Actions du dépôt GitHub

## Maintenance

### Rotation des clés

Planifier une rotation trimestrielle des clés sensibles :
- Clés JWT
- Tokens d'API
- Secrets WhatsApp

### Mises à jour de dépendances

Utiliser Renovate ou Dependabot pour automatiser les mises à jour de dépendances avec validation CI.

## Prochaines étapes

- Mise en place de 2FA pour l'authentification
- Rotation automatique des clés JWT
- Déploiement multi-régions pour la haute disponibilité
- Intégration CDN pour les assets statiques
