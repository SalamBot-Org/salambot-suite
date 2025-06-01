/**
 * @file        Main configuration for Redis Cache Terraform module
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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Generate a random password for Redis AUTH
resource "random_password" "redis_auth" {
  count   = var.auth_enabled ? 1 : 0
  length  = 32
  special = true
}

# Google Cloud Memorystore Redis instance
resource "google_redis_instance" "cache" {
  name           = var.name
  tier           = var.plan_tier
  memory_size_gb = var.memory_size_gb
  region         = var.region

  location_id             = "${var.region}-a"
  alternative_location_id = var.plan_tier == "STANDARD_HA" ? "${var.region}-b" : null

  redis_version     = var.redis_version
  display_name      = "${var.name} Redis Cache"
  reserved_ip_range = "10.0.0.0/29"

  auth_enabled            = var.auth_enabled
  transit_encryption_mode = var.transit_encryption_mode
  connect_mode            = var.connect_mode

  authorized_network = var.network

  labels = var.labels

  maintenance_policy {
    weekly_maintenance_window {
      day = var.maintenance_window.day
      start_time {
        hours   = tonumber(split(":", var.maintenance_window.start_time)[0])
        minutes = tonumber(split(":", var.maintenance_window.start_time)[1])
      }
    }
  }

  # Enable persistence for production workloads
  persistence_config {
    persistence_mode    = "RDB"
    rdb_snapshot_period = "TWENTY_FOUR_HOURS"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Use the network ID directly (no data source needed)
# The network variable should contain the network ID or self_link

# Secret Manager secret for Redis connection details
resource "google_secret_manager_secret" "redis_connection" {
  secret_id = "${var.name}-redis-connection"

  labels = var.labels

  replication {
    auto {}
  }
}

# Store Redis connection details in Secret Manager
resource "google_secret_manager_secret_version" "redis_connection" {
  secret = google_secret_manager_secret.redis_connection.id

  secret_data = jsonencode({
    host    = google_redis_instance.cache.host
    port    = google_redis_instance.cache.port
    auth    = var.auth_enabled ? random_password.redis_auth[0].result : null
    tls     = var.transit_encryption_mode == "SERVER_AUTHENTICATION"
    url     = var.auth_enabled ? "redis://:${random_password.redis_auth[0].result}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}" : "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
    ssl_url = var.auth_enabled ? "rediss://:${random_password.redis_auth[0].result}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}" : "rediss://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  })
}

# Monitoring: Uptime check for Redis instance
resource "google_monitoring_uptime_check_config" "redis_uptime" {
  display_name = "${var.name} Redis Uptime Check"
  timeout      = "10s"
  period       = "300s"

  tcp_check {
    port = google_redis_instance.cache.port
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host       = google_redis_instance.cache.host
      project_id = data.google_client_config.current.project
    }
  }

  content_matchers {
    content = "PONG"
    matcher = "CONTAINS_STRING"
  }
}

# Data source for current GCP project
data "google_client_config" "current" {}