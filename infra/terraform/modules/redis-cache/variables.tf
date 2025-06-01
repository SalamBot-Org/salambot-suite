/**
 * @file        Variables for Redis Cache Terraform module
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "name" {
  description = "Name of the Redis instance"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.name))
    error_message = "Name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "region" {
  description = "Region where the Redis instance will be deployed"
  type        = string
  default     = "europe-west1"
}

variable "plan_tier" {
  description = "Redis plan tier (BASIC, STANDARD_HA)"
  type        = string
  default     = "BASIC"
  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.plan_tier)
    error_message = "Plan tier must be either BASIC or STANDARD_HA."
  }
}

variable "memory_size_gb" {
  description = "Memory size in GB for the Redis instance"
  type        = number
  default     = 1
  validation {
    condition     = var.memory_size_gb >= 1 && var.memory_size_gb <= 300
    error_message = "Memory size must be between 1 and 300 GB."
  }
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "auth_enabled" {
  description = "Enable Redis AUTH"
  type        = bool
  default     = true
}

variable "transit_encryption_mode" {
  description = "Transit encryption mode (SERVER_AUTHENTICATION, DISABLED)"
  type        = string
  default     = "SERVER_AUTHENTICATION"
}

variable "labels" {
  description = "Labels to apply to the Redis instance"
  type        = map(string)
  default = {
    project     = "salambot"
    environment = "dev"
    managed_by  = "terraform"
  }
}

variable "network" {
  description = "VPC network ID or self_link for the Redis instance"
  type        = string
  default     = "default"
}

variable "connect_mode" {
  description = "Connection mode (DIRECT_PEERING, PRIVATE_SERVICE_ACCESS)"
  type        = string
  default     = "DIRECT_PEERING"
}

variable "maintenance_window" {
  description = "Maintenance window configuration"
  type = object({
    day        = string
    start_time = string
  })
  default = {
    day        = "SUNDAY"
    start_time = "02:00"
  }
}