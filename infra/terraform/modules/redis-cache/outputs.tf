/**
 * @file        Outputs for Redis Cache Terraform module
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.cache.port
}

output "redis_auth_string" {
  description = "Redis AUTH string"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}

output "redis_url" {
  description = "Redis connection URL"
  value       = var.auth_enabled ? "redis://:${random_password.redis_auth[0].result}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}" : "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  sensitive   = true
}

output "redis_ssl_url" {
  description = "Redis SSL connection URL"
  value       = var.auth_enabled ? "rediss://:${random_password.redis_auth[0].result}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}" : "rediss://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  sensitive   = true
}

output "redis_tls_enabled" {
  description = "Whether TLS is enabled for Redis"
  value       = var.transit_encryption_mode == "SERVER_AUTHENTICATION"
}

output "redis_instance_id" {
  description = "Redis instance ID"
  value       = google_redis_instance.cache.id
}

output "redis_instance_name" {
  description = "Redis instance name"
  value       = google_redis_instance.cache.name
}

output "redis_region" {
  description = "Redis instance region"
  value       = google_redis_instance.cache.region
}

output "redis_tier" {
  description = "Redis instance tier"
  value       = google_redis_instance.cache.tier
}

output "redis_memory_size_gb" {
  description = "Redis instance memory size in GB"
  value       = google_redis_instance.cache.memory_size_gb
}

output "secret_manager_secret_id" {
  description = "Secret Manager secret ID for Redis connection details"
  value       = google_secret_manager_secret.redis_connection.secret_id
}

output "uptime_check_id" {
  description = "Uptime check ID for Redis monitoring"
  value       = google_monitoring_uptime_check_config.redis_uptime.uptime_check_id
}