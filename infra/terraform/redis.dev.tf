/**
 * @file        Redis development environment configuration
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Local values for common configurations
locals {
  environment = "dev"
  project     = "salambot"

  common_labels = {
    project     = local.project
    environment = local.environment
    managed_by  = "terraform"
    team        = "salambot-dev"
  }
}

# Create VPC network for Redis
resource "google_compute_network" "redis_network" {
  name                    = "salambot-${local.environment}-network"
  auto_create_subnetworks = true
  mtu                     = 1460
}

# Redis cache instance for development
module "redis_cache_dev" {
  source = "./modules/redis-cache"

  project_id     = var.gcp_project_id
  name           = "salambot-cache-${local.environment}"
  region         = var.gcp_region
  plan_tier      = "BASIC"
  memory_size_gb = 1

  # Security settings
  auth_enabled            = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  network      = google_compute_network.redis_network.id
  connect_mode = "DIRECT_PEERING"

  # Maintenance window (Sunday 2 AM UTC)
  maintenance_window = {
    day        = "SUNDAY"
    start_time = "02:00"
  }

  labels = local.common_labels
}

# Output Redis connection details for use by applications
output "redis_dev_host" {
  description = "Redis development instance host"
  value       = module.redis_cache_dev.redis_host
}

output "redis_dev_port" {
  description = "Redis development instance port"
  value       = module.redis_cache_dev.redis_port
}

output "redis_dev_url" {
  description = "Redis development connection URL"
  value       = module.redis_cache_dev.redis_url
  sensitive   = true
}

output "redis_dev_ssl_url" {
  description = "Redis development SSL connection URL"
  value       = module.redis_cache_dev.redis_ssl_url
  sensitive   = true
}

output "redis_dev_tls_enabled" {
  description = "Whether TLS is enabled for Redis development instance"
  value       = module.redis_cache_dev.redis_tls_enabled
}

output "redis_dev_secret_id" {
  description = "Secret Manager secret ID for Redis development connection"
  value       = module.redis_cache_dev.secret_manager_secret_id
}