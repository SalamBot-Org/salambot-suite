#!/bin/bash

# Script pour configurer Workload Identity Federation pour GitHub Actions
# Ce script doit être exécuté avec des privilèges d'administrateur GCP

set -e

# Variables à configurer
PROJECT_ID="${1:-your-gcp-project-id}"
GITHUB_REPO="${2:-your-github-username/salambot-suite}"
SERVICE_ACCOUNT_NAME="terraform-github-actions"
WIF_POOL_ID="github-actions-pool"
WIF_PROVIDER_ID="github-actions-provider"

echo "🚀 Configuration de Workload Identity Federation pour GitHub Actions"
echo "Project ID: $PROJECT_ID"
echo "GitHub Repository: $GITHUB_REPO"
echo ""

# 1. Activer les APIs nécessaires
echo "📋 Activation des APIs nécessaires..."
gcloud services enable iamcredentials.googleapis.com --project="$PROJECT_ID"
gcloud services enable sts.googleapis.com --project="$PROJECT_ID"

# 2. Créer le service account s'il n'existe pas
echo "👤 Création du service account..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Terraform GitHub Actions" \
        --description="Service account for Terraform operations via GitHub Actions" \
        --project="$PROJECT_ID"
else
    echo "Service account already exists"
fi

# 3. Attribuer les rôles nécessaires au service account
echo "🔐 Attribution des rôles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/redis.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.networkAdmin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# 4. Créer le Workload Identity Pool
echo "🏊 Création du Workload Identity Pool..."
if ! gcloud iam workload-identity-pools describe "$WIF_POOL_ID" --location="global" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools create "$WIF_POOL_ID" \
        --location="global" \
        --display-name="GitHub Actions Pool" \
        --description="Workload Identity Pool for GitHub Actions" \
        --project="$PROJECT_ID"
else
    echo "Workload Identity Pool already exists"
fi

# 5. Créer le Workload Identity Provider
echo "🔗 Création du Workload Identity Provider..."
if ! gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" --workload-identity-pool="$WIF_POOL_ID" --location="global" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER_ID" \
        --workload-identity-pool="$WIF_POOL_ID" \
        --location="global" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
        --project="$PROJECT_ID"
else
    echo "Workload Identity Provider already exists"
fi

# 6. Lier le service account au Workload Identity Pool
echo "🔗 Liaison du service account..."
gcloud iam service-accounts add-iam-policy-binding \
    "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$WIF_POOL_ID/attribute.repository/$GITHUB_REPO" \
    --project="$PROJECT_ID"

# 7. Afficher les informations pour GitHub Secrets
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📝 Ajoutez ces secrets dans votre repository GitHub :"
echo ""
echo "WIF_PROVIDER: projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$WIF_POOL_ID/providers/$WIF_PROVIDER_ID"
echo "WIF_SERVICE_ACCOUNT: $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo "GCP_PROJECT_ID: $PROJECT_ID"
echo "TF_STATE_BUCKET: <votre-bucket-terraform-state>"
echo ""
echo "🔧 Pour tester la configuration :"
echo "gcloud iam workload-identity-pools providers describe $WIF_PROVIDER_ID --workload-identity-pool=$WIF_POOL_ID --location=global --project=$PROJECT_ID"