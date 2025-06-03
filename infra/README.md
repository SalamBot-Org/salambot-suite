# Infrastructure SalamBot

Ce répertoire contient l'infrastructure as code (IaC) pour le projet SalamBot, utilisant Terraform pour gérer les ressources Google Cloud Platform.

## Structure

```
infra/
├── terraform/
│   ├── modules/
│   │   └── redis-cache/          # Module Terraform réutilisable pour Redis
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── outputs.tf
│   │       └── README.md
│   ├── redis.dev.tf             # Configuration Redis pour l'environnement dev
│   ├── variables.tf              # Variables globales
│   ├── terraform.tfvars.example  # Exemple de configuration
│   └── .gitignore
└── README.md                     # Ce fichier
```

## Prérequis

### 1. Outils requis

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [pnpm](https://pnpm.io/installation) (pour les scripts npm)

### 2. Configuration Google Cloud

```bash
# Authentification
gcloud auth login
gcloud auth application-default login

# Configuration du projet
gcloud config set project YOUR_PROJECT_ID
```

### 3. Configuration Terraform

1. Copier le fichier d'exemple :

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Éditer `terraform.tfvars` avec vos valeurs :
   ```hcl
   gcp_project_id = "your-project-id"
   gcp_region     = "europe-west1"
   environment    = "dev"
   project_name   = "salambot"
   team          = "salambot-team"
   ```

## Utilisation

### Commandes rapides (via pnpm)

```bash
# Initialiser Terraform
pnpm infra:redis:init

# Planifier les changements
pnpm infra:redis:plan

# Appliquer l'infrastructure
pnpm infra:redis:apply

# Mettre à jour la configuration Firestore
pnpm infra:update-config

# Détruire l'infrastructure (attention !)
pnpm infra:redis:destroy
```

### Commandes Terraform directes

```bash
cd infra/terraform

# Initialisation
terraform init

# Planification
terraform plan

# Application
terraform apply

# Destruction
terraform destroy
```

## Module Redis Cache

Le module `redis-cache` crée une instance Google Cloud Memorystore pour Redis avec :

### Fonctionnalités

- **Instance Redis managée** : Google Cloud Memorystore
- **Haute disponibilité** : Configuration multi-zone
- **Sécurité** : Authentification et chiffrement en transit
- **Monitoring** : Métriques et alertes intégrées
- **Secret Management** : Stockage sécurisé des credentials
- **Réseau privé** : Connexion via VPC peering

### Variables du module

| Variable                  | Description              | Type          | Défaut                    |
| ------------------------- | ------------------------ | ------------- | ------------------------- |
| `name`                    | Nom de l'instance Redis  | `string`      | -                         |
| `region`                  | Région GCP               | `string`      | -                         |
| `plan_tier`               | Niveau de service        | `string`      | `"BASIC"`                 |
| `memory_size_gb`          | Taille mémoire en GB     | `number`      | `1`                       |
| `redis_version`           | Version Redis            | `string`      | `"REDIS_7_0"`             |
| `auth_enabled`            | Authentification activée | `bool`        | `true`                    |
| `transit_encryption_mode` | Chiffrement en transit   | `string`      | `"SERVER_AUTHENTICATION"` |
| `labels`                  | Labels GCP               | `map(string)` | `{}`                      |
| `authorized_network`      | Réseau VPC autorisé      | `string`      | `"default"`               |
| `connect_mode`            | Mode de connexion        | `string`      | `"DIRECT_PEERING"`        |
| `maintenance_window`      | Fenêtre de maintenance   | `object`      | Dimanche 2h UTC           |

### Outputs du module

- `redis_host` : Adresse IP de l'instance Redis
- `redis_port` : Port de connexion
- `redis_url` : URL de connexion complète
- `redis_url_tls` : URL de connexion avec TLS
- `auth_string` : Chaîne d'authentification
- `tls_enabled` : Statut du TLS
- `instance_*` : Détails de l'instance
- `secret_id` : ID du secret dans Secret Manager
- `uptime_check_id` : ID du check de monitoring

## Environnements

### Développement (dev)

Configuration dans `redis.dev.tf` :

- Instance Redis 1GB
- Région : `europe-west1`
- Mode : `BASIC` (single zone)
- Authentification et TLS activés

### Production (à venir)

Configuration prévue :

- Instance Redis haute disponibilité
- Mode : `STANDARD_HA` (multi-zone)
- Taille mémoire adaptée à la charge
- Backup automatique

## Monitoring et Alertes

### Métriques disponibles

- Utilisation mémoire
- Connexions actives
- Latence des opérations
- Débit réseau
- Disponibilité

### Alertes configurées

- Utilisation mémoire > 80%
- Instance indisponible
- Latence élevée
- Échec des health checks

## Sécurité

### Bonnes pratiques implémentées

1. **Authentification** : Mot de passe généré automatiquement
2. **Chiffrement** : TLS en transit
3. **Réseau** : Accès via VPC privé uniquement
4. **Secrets** : Stockage dans Google Secret Manager
5. **IAM** : Permissions minimales requises

### Permissions GCP requises

```json
{
  "roles": ["roles/redis.admin", "roles/secretmanager.admin", "roles/monitoring.editor", "roles/compute.networkViewer"]
}
```

## Dépannage

### Erreurs courantes

1. **Erreur d'authentification**

   ```bash
   gcloud auth application-default login
   ```

2. **Projet GCP non configuré**

   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **APIs non activées**

   ```bash
   gcloud services enable redis.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable monitoring.googleapis.com
   ```

4. **Réseau VPC inexistant**
   - Vérifier que le réseau `default` existe
   - Ou spécifier un réseau existant dans `authorized_network`

### Logs et debugging

```bash
# Logs Terraform détaillés
export TF_LOG=DEBUG
terraform apply

# État Terraform
terraform show
terraform state list

# Outputs
terraform output
```

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/infra-apply.yml`) :

1. **Validation** : `terraform validate`
2. **Planification** : `terraform plan` (sur PR)
3. **Application** : `terraform apply` (sur push main)
4. **Configuration** : Mise à jour Firestore automatique

### Variables d'environnement requises

- `GCP_PROJECT_ID` : ID du projet Google Cloud
- `GCP_SA_KEY` : Clé du service account (JSON)
- `FIREBASE_SERVICE_ACCOUNT_KEY` : Clé pour Firestore

## Support

Pour toute question ou problème :

1. Vérifier la [documentation Terraform GCP](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
2. Consulter les [logs Google Cloud](https://console.cloud.google.com/logs)
3. Ouvrir une issue sur le repository
4. Contacter l'équipe @salambot-team
