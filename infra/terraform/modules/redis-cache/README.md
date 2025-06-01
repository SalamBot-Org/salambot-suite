# Redis Cache Terraform Module

This module creates a managed Redis cache instance using Google Cloud Memorystore with monitoring and security features.

## Features

- **Google Cloud Memorystore Redis**: Fully managed Redis service
- **High Availability**: Optional STANDARD_HA tier for production workloads
- **Security**: AUTH enabled by default with TLS encryption
- **Monitoring**: Built-in uptime checks and alerting
- **Secret Management**: Connection details stored in Google Secret Manager
- **Persistence**: RDB snapshots for data durability

## Usage

```hcl
module "redis_cache" {
  source = "./modules/redis-cache"
  
  name         = "salambot-cache-dev"
  region       = "europe-west1"
  plan_tier    = "BASIC"
  memory_size_gb = 1
  
  labels = {
    project     = "salambot"
    environment = "dev"
    managed_by  = "terraform"
  }
}
```

## Requirements

| Name | Version |
|------|------|
| terraform | >= 1.0 |
| google | ~> 5.0 |

## Providers

| Name | Version |
|------|------|
| google | ~> 5.0 |
| random | n/a |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| name | Name of the Redis instance | `string` | n/a | yes |
| region | Region where the Redis instance will be deployed | `string` | `"europe-west1"` | no |
| plan_tier | Redis plan tier (BASIC, STANDARD_HA) | `string` | `"BASIC"` | no |
| memory_size_gb | Memory size in GB for the Redis instance | `number` | `1` | no |
| redis_version | Redis version | `string` | `"REDIS_7_0"` | no |
| auth_enabled | Enable Redis AUTH | `bool` | `true` | no |
| transit_encryption_mode | Transit encryption mode | `string` | `"SERVER_AUTHENTICATION"` | no |
| labels | Labels to apply to the Redis instance | `map(string)` | `{...}` | no |
| network | VPC network for the Redis instance | `string` | `"default"` | no |
| connect_mode | Connection mode | `string` | `"DIRECT_PEERING"` | no |
| maintenance_window | Maintenance window configuration | `object({...})` | `{...}` | no |

## Outputs

| Name | Description |
|------|-------------|
| redis_host | Redis instance host |
| redis_port | Redis instance port |
| redis_url | Redis connection URL (non-TLS) |
| redis_ssl_url | Redis connection URL with TLS |
| redis_auth_string | Redis AUTH string |
| redis_tls_enabled | Whether TLS is enabled for Redis |
| redis_instance_id | Redis instance ID |
| redis_instance_name | Redis instance name |
| redis_region | Redis instance region |
| redis_tier | Redis instance tier |
| redis_memory_size_gb | Redis instance memory size in GB |
| secret_manager_secret_id | Secret Manager secret ID for Redis connection details |
| uptime_check_id | Uptime check ID for Redis monitoring |

## Security

- **Authentication**: Redis AUTH is enabled by default with a randomly generated 32-character password
- **Encryption**: TLS encryption in transit is enabled by default
- **Network**: Redis instance is deployed in a private VPC network
- **Secrets**: Connection details are stored securely in Google Secret Manager

## Monitoring

- **Uptime Checks**: Automatic monitoring of Redis availability
- **Persistence**: RDB snapshots every 24 hours for data durability
- **Maintenance Windows**: Configurable maintenance windows to minimize disruption

## Examples

### Development Environment

```hcl
module "redis_dev" {
  source = "./modules/redis-cache"
  
  name           = "salambot-cache-dev"
  region         = "europe-west1"
  plan_tier      = "BASIC"
  memory_size_gb = 1
  
  labels = {
    project     = "salambot"
    environment = "dev"
    managed_by  = "terraform"
  }
}
```

### Production Environment

```hcl
module "redis_prod" {
  source = "./modules/redis-cache"
  
  name           = "salambot-cache-prod"
  region         = "europe-west1"
  plan_tier      = "STANDARD_HA"
  memory_size_gb = 4
  
  maintenance_window = {
    day        = "SUNDAY"
    start_time = "03:00"
  }
  
  labels = {
    project     = "salambot"
    environment = "prod"
    managed_by  = "terraform"
  }
}
```