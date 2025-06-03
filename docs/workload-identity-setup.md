# Configuration Workload Identity Federation pour GitHub Actions

Ce guide explique comment configurer l'authentification OIDC entre GitHub Actions et Google Cloud Platform en utilisant Workload Identity Federation, éliminant le besoin de stocker des clés de service account dans les secrets GitHub.

## Prérequis

- Accès administrateur au projet GCP
- Accès administrateur au repository GitHub
- Google Cloud CLI installé et configuré
- Permissions pour créer des Workload Identity Pools et des Service Accounts

## Étape 1 : Configuration côté GCP

### Option A : Script automatisé

Utilisez le script fourni :

```bash
# Rendre le script exécutable
chmod +x scripts/setup-wif.sh

# Exécuter le script
./scripts/setup-wif.sh YOUR_PROJECT_ID YOUR_GITHUB_USERNAME/salambot-suite
```

### Option B : Configuration manuelle

#### 1. Activer les APIs nécessaires

```bash
gcloud services enable iamcredentials.googleapis.com
gcloud services enable sts.googleapis.com
```

#### 2. Créer le Service Account

```bash
gcloud iam service-accounts create terraform-github-actions \
    --display-name="Terraform GitHub Actions" \
    --description="Service account for Terraform operations via GitHub Actions"
```

#### 3. Attribuer les rôles nécessaires

```bash
# Rôle pour Redis
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/redis.admin"

# Rôle pour le réseau
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.networkAdmin"

# Rôle pour le stockage (Terraform state)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

#### 4. Créer le Workload Identity Pool

```bash
gcloud iam workload-identity-pools create github-actions-pool \
    --location="global" \
    --display-name="GitHub Actions Pool" \
    --description="Workload Identity Pool for GitHub Actions"
```

#### 5. Créer le Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc github-actions-provider \
    --workload-identity-pool="github-actions-pool" \
    --location="global" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='YOUR_GITHUB_USERNAME/salambot-suite'"
```

#### 6. Lier le Service Account au Workload Identity Pool

```bash
# Obtenir le numéro de projet
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Lier le service account
gcloud iam service-accounts add-iam-policy-binding \
    terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/YOUR_GITHUB_USERNAME/salambot-suite"
```

## Étape 2 : Configuration des secrets GitHub

Ajoutez ces secrets dans votre repository GitHub (Settings > Secrets and variables > Actions) :

### Secrets requis

| Secret                | Valeur                                                                                                                 | Description                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `WIF_PROVIDER`        | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | Identifiant du provider OIDC          |
| `WIF_SERVICE_ACCOUNT` | `terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`                                                     | Email du service account              |
| `GCP_PROJECT_ID`      | `YOUR_PROJECT_ID`                                                                                                      | ID du projet GCP                      |
| `TF_STATE_BUCKET`     | `your-terraform-state-bucket`                                                                                          | Nom du bucket pour le state Terraform |

### Obtenir les valeurs

```bash
# Obtenir le numéro de projet
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Afficher les valeurs pour les secrets
echo "WIF_PROVIDER: projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider"
echo "WIF_SERVICE_ACCOUNT: terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com"
echo "GCP_PROJECT_ID: YOUR_PROJECT_ID"
```

## Étape 3 : Vérification

### Tester la configuration

```bash
# Vérifier le Workload Identity Pool
gcloud iam workload-identity-pools describe github-actions-pool \
    --location="global"

# Vérifier le provider
gcloud iam workload-identity-pools providers describe github-actions-provider \
    --workload-identity-pool="github-actions-pool" \
    --location="global"

# Vérifier les liaisons IAM
gcloud iam service-accounts get-iam-policy \
    terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Tester le workflow

1. Poussez une modification dans le dossier `infra/`
2. Vérifiez que le workflow GitHub Actions s'exécute sans erreur d'authentification
3. Consultez les logs pour confirmer l'authentification OIDC

## Avantages de Workload Identity Federation

- ✅ **Sécurité améliorée** : Pas de clés de service account stockées dans GitHub
- ✅ **Rotation automatique** : Les tokens sont générés à la demande
- ✅ **Principe du moindre privilège** : Accès limité au repository spécifique
- ✅ **Audit trail** : Traçabilité complète des accès
- ✅ **Pas d'expiration** : Contrairement aux clés de service account

## Dépannage

### Erreur "workload_identity_provider not found"

- Vérifiez que le PROJECT_NUMBER est correct (pas PROJECT_ID)
- Vérifiez que le pool et le provider existent

### Erreur "permission denied"

- Vérifiez les rôles IAM du service account
- Vérifiez la liaison workloadIdentityUser

### Erreur "attribute condition not met"

- Vérifiez que le nom du repository dans la condition correspond exactement
- Format : `owner/repository-name`

## Nettoyage (si nécessaire)

```bash
# Supprimer le provider
gcloud iam workload-identity-pools providers delete github-actions-provider \
    --workload-identity-pool="github-actions-pool" \
    --location="global"

# Supprimer le pool
gcloud iam workload-identity-pools delete github-actions-pool \
    --location="global"

# Supprimer le service account
gcloud iam service-accounts delete \
    terraform-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```
