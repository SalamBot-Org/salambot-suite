terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  backend "gcs" {
    bucket = "salambot-terraform-state"
    prefix = "state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "ID du projet GCP"
  type        = string
}

variable "region" {
  description = "Région GCP pour les ressources"
  type        = string
  default     = "europe-west1"
}

variable "service_name" {
  description = "Nom du service Cloud Run"
  type        = string
  default     = "salambot-functions-run"
}

# Service Account pour Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "salambot-cloud-run-sa"
  display_name = "Service Account pour SalamBot Cloud Run"
  description  = "Utilisé par le service Cloud Run pour accéder à Firestore et autres services GCP"
}

# Attribution des rôles au Service Account
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "trace_agent" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Secret Manager pour les secrets d'environnement
resource "google_secret_manager_secret" "firebase_api_key" {
  secret_id = "FIREBASE_API_KEY"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "firebase_project_id" {
  secret_id = "FIREBASE_PROJECT_ID"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "jwt_private_key" {
  secret_id = "JWT_PRIVATE_KEY"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "jwt_public_key" {
  secret_id = "JWT_PUBLIC_KEY"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "otlp_endpoint" {
  secret_id = "OTLP_ENDPOINT"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "otlp_headers" {
  secret_id = "OTLP_HEADERS"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "wa_verify_token" {
  secret_id = "WA_VERIFY_TOKEN"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "wa_phone_id" {
  secret_id = "WA_PHONE_ID"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "wa_access_token" {
  secret_id = "WA_ACCESS_TOKEN"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "app_secret" {
  secret_id = "APP_SECRET"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "redis_url" {
  secret_id = "REDIS_URL"
  replication {
    automatic = true
  }
}

# Accès aux secrets pour le Service Account
resource "google_secret_manager_secret_iam_member" "cloud_run_sa_secret_access" {
  for_each = toset([
    google_secret_manager_secret.firebase_api_key.id,
    google_secret_manager_secret.firebase_project_id.id,
    google_secret_manager_secret.jwt_private_key.id,
    google_secret_manager_secret.jwt_public_key.id,
    google_secret_manager_secret.otlp_endpoint.id,
    google_secret_manager_secret.otlp_headers.id,
    google_secret_manager_secret.wa_verify_token.id,
    google_secret_manager_secret.wa_phone_id.id,
    google_secret_manager_secret.wa_access_token.id,
    google_secret_manager_secret.app_secret.id,
    google_secret_manager_secret.redis_url.id
  ])
  
  project   = var.project_id
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Service Cloud Run
resource "google_cloud_run_service" "salambot_api" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      containers {
        image = "gcr.io/${var.project_id}/${var.service_name}:latest"
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }
        
        env {
          name  = "PORT"
          value = "8080"
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "CORS_ORIGINS"
          value = "https://widget.salambot.app,https://desk.salambot.app"
        }
        
        env {
          name  = "PERSISTENCE_DRIVER"
          value = "firestore"
        }
        
        env {
          name  = "SERVICE_NAME"
          value = var.service_name
        }
        
        env {
          name  = "SERVICE_VERSION"
          value = "0.9.0"
        }
        
        # Secrets
        dynamic "env" {
          for_each = toset([
            "FIREBASE_API_KEY",
            "FIREBASE_PROJECT_ID",
            "JWT_PRIVATE_KEY",
            "JWT_PUBLIC_KEY",
            "OTLP_ENDPOINT",
            "OTLP_HEADERS",
            "WA_VERIFY_TOKEN",
            "WA_PHONE_ID",
            "WA_ACCESS_TOKEN",
            "APP_SECRET",
            "REDIS_URL"
          ])
          
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.key
                key  = "latest"
              }
            }
          }
        }
      }
      
      timeout_seconds      = 300
      container_concurrency = 80
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Accès public au service Cloud Run
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.salambot_api.name
  location = google_cloud_run_service.salambot_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Index Firestore pour les conversations
resource "google_firestore_index" "conversations_by_status" {
  collection = "conversations"
  
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "lastMessageAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "conversations_by_language" {
  collection = "conversations"
  
  fields {
    field_path = "lang"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "lastMessageAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "conversations_by_channel" {
  collection = "conversations"
  
  fields {
    field_path = "channel"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "lastMessageAt"
    order      = "DESCENDING"
  }
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.salambot_api.status[0].url
  description = "URL du service Cloud Run"
}

output "service_account_email" {
  value = google_service_account.cloud_run_sa.email
  description = "Email du Service Account pour Cloud Run"
}
