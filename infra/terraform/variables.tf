/**
 * @file        Global variables for SalamBot Terraform infrastructure
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.gcp_project_id))
    error_message = "Project ID must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "gcp_region" {
  description = "Google Cloud region for resources"
  type        = string
  default     = "europe-west1"
  validation {
    condition = contains([
      "europe-west1", "europe-west2", "europe-west3", "europe-west4",
      "us-central1", "us-east1", "us-west1", "us-west2",
      "asia-east1", "asia-southeast1", "asia-northeast1"
    ], var.gcp_region)
    error_message = "Region must be a valid Google Cloud region."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "salambot"
}

variable "team" {
  description = "Team responsible for the infrastructure"
  type        = string
  default     = "salambot-dev"
}