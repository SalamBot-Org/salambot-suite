#!/usr/bin/env node

/**
 * Kong Gateway Setup Script for SalamBot Suite
 * @fileoverview Automates Kong services, routes, and plugins configuration
 * @author SalamBot Team
 * @version 1.0.0
 */

const axios = require('axios');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

/**
 * Kong Admin API configuration
 * @constant {Object}
 */
const KONG_CONFIG = {
  adminUrl: process.env.KONG_ADMIN_URL || 'http://localhost:8001',
  timeout: 30000,
  retries: 5,
  retryDelay: 2000
};

/**
 * SalamBot services configuration for Kong
 * @constant {Array<Object>}
 */
const SALAMBOT_SERVICES = [
  {
    name: 'salambot-lang-detect',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/lang-detect',
    retries: 3,
    connect_timeout: 60000,
    write_timeout: 60000,
    read_timeout: 60000,
    tags: ['salambot', 'ai', 'language-detection']
  },
  {
    name: 'salambot-auth',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/auth',
    retries: 3,
    connect_timeout: 30000,
    write_timeout: 30000,
    read_timeout: 30000,
    tags: ['salambot', 'auth', 'security']
  },
  {
    name: 'salambot-genkit',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/genkit',
    retries: 3,
    connect_timeout: 60000,
    write_timeout: 60000,
    read_timeout: 60000,
    tags: ['salambot', 'genkit', 'ai']
  },
  {
    name: 'salambot-config',
    protocol: 'http',
    host: 'functions-run',
    port: 3000,
    path: '/config',
    retries: 3,
    connect_timeout: 30000,
    write_timeout: 30000,
    read_timeout: 30000,
    tags: ['salambot', 'config', 'management']
  }
];

/**
 * Routes configuration for SalamBot services
 * @constant {Array<Object>}
 */
const SALAMBOT_ROUTES = [
  {
    name: 'lang-detect-route',
    service: 'salambot-lang-detect',
    paths: ['/api/v1/lang-detect'],
    methods: ['POST'],
    strip_path: true,
    preserve_host: false,
    tags: ['salambot', 'api', 'v1']
  },
  {
    name: 'auth-route',
    service: 'salambot-auth',
    paths: ['/api/v1/auth'],
    methods: ['POST', 'GET'],
    strip_path: true,
    preserve_host: false,
    tags: ['salambot', 'api', 'v1']
  },
  {
    name: 'genkit-route',
    service: 'salambot-genkit',
    paths: ['/api/v1/genkit'],
    methods: ['POST'],
    strip_path: true,
    preserve_host: false,
    tags: ['salambot', 'api', 'v1']
  },
  {
    name: 'config-route',
    service: 'salambot-config',
    paths: ['/api/v1/config'],
    methods: ['GET', 'POST', 'PUT'],
    strip_path: true,
    preserve_host: false,
    tags: ['salambot', 'api', 'v1']
  }
];

/**
 * Global plugins configuration
 * @constant {Array<Object>}
 */
const GLOBAL_PLUGINS = [
  {
    name: 'prometheus',
    config: {
      per_consumer: true,
      status_code_metrics: true,
      latency_metrics: true,
      bandwidth_metrics: true,
      upstream_health_metrics: true
    },
    tags: ['monitoring', 'metrics']
  },
  {
    name: 'cors',
    config: {
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Auth-Token', 'Authorization'],
      exposed_headers: ['X-Auth-Token'],
      credentials: true,
      max_age: 3600
    },
    tags: ['cors', 'security']
  },
  {
    name: 'rate-limiting',
    config: {
      minute: 100,
      hour: 1000,
      day: 10000,
      policy: 'redis',
      redis_host: 'redis',
      redis_port: 6379,
      redis_password: process.env.REDIS_PASSWORD || 'salambot-redis-pass',
      redis_database: 0,
      redis_timeout: 2000,
      fault_tolerant: true,
      hide_client_headers: false
    },
    tags: ['rate-limiting', 'security']
  }
];

/**
 * Service-specific plugins configuration
 * @constant {Array<Object>}
 */
const SERVICE_PLUGINS = [
  {
    service: 'salambot-lang-detect',
    plugins: [
      {
        name: 'request-size-limiting',
        config: {
          allowed_payload_size: 1024 * 1024, // 1MB
          size_unit: 'bytes',
          require_content_length: false
        }
      }
    ]
  },
  {
    service: 'salambot-auth',
    plugins: [
      {
        name: 'jwt',
        config: {
          secret_is_base64: false,
          key_claim_name: 'iss',
          algorithm: 'HS256',
          claims_to_verify: ['exp', 'iat'],
          anonymous: null
        }
      }
    ]
  }
];

/**
 * HTTP client with retry logic
 * @class
 */
class KongClient {
  constructor(baseURL, timeout = 30000) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Execute HTTP request with retry logic
   * @param {Function} requestFn - Request function to execute
   * @param {number} retries - Number of retries
   * @param {number} delay - Delay between retries in ms
   * @returns {Promise<Object>} Response data
   */
  async withRetry(requestFn, retries = KONG_CONFIG.retries, delay = KONG_CONFIG.retryDelay) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  /**
   * Check Kong Gateway health
   * @returns {Promise<boolean>} Kong health status
   */
  async checkHealth() {
    try {
      await this.withRetry(() => this.client.get('/status'));
      return true;
    } catch (error) {
      console.error('Kong health check failed:', error.message);
      return false;
    }
  }

  /**
   * Create or update Kong service
   * @param {Object} serviceConfig - Service configuration
   * @returns {Promise<Object>} Created/updated service
   */
  async createService(serviceConfig) {
    return this.withRetry(async () => {
      try {
        // Try to update existing service
        return await this.client.put(`/services/${serviceConfig.name}`, serviceConfig);
      } catch (error) {
        if (error.response?.status === 404) {
          // Create new service if not exists
          return await this.client.post('/services', serviceConfig);
        }
        throw error;
      }
    });
  }

  /**
   * Create or update Kong route
   * @param {Object} routeConfig - Route configuration
   * @returns {Promise<Object>} Created/updated route
   */
  async createRoute(routeConfig) {
    return this.withRetry(async () => {
      try {
        // Try to update existing route
        return await this.client.put(`/routes/${routeConfig.name}`, routeConfig);
      } catch (error) {
        if (error.response?.status === 404) {
          // Create new route if not exists
          return await this.client.post('/routes', routeConfig);
        }
        throw error;
      }
    });
  }

  /**
   * Create or update Kong plugin
   * @param {Object} pluginConfig - Plugin configuration
   * @param {string} [scope] - Plugin scope (global, service, route)
   * @param {string} [scopeId] - Scope ID for service/route plugins
   * @returns {Promise<Object>} Created/updated plugin
   */
  async createPlugin(pluginConfig, scope = 'global', scopeId = null) {
    return this.withRetry(async () => {
      let endpoint = '/plugins';
      if (scope === 'service' && scopeId) {
        endpoint = `/services/${scopeId}/plugins`;
      } else if (scope === 'route' && scopeId) {
        endpoint = `/routes/${scopeId}/plugins`;
      }

      try {
        // Check if plugin already exists
        const existingPlugins = await this.client.get(endpoint);
        const existing = existingPlugins.data.data.find(p => p.name === pluginConfig.name);
        
        if (existing) {
          // Update existing plugin
          return await this.client.put(`/plugins/${existing.id}`, pluginConfig);
        } else {
          // Create new plugin
          return await this.client.post(endpoint, pluginConfig);
        }
      } catch (error) {
        // If listing fails, try to create directly
        return await this.client.post(endpoint, pluginConfig);
      }
    });
  }
}

/**
 * Main setup function
 * @returns {Promise<void>}
 */
async function setupKong() {
  console.log('🚀 Starting SalamBot Kong Gateway setup...');
  
  const kong = new KongClient(KONG_CONFIG.adminUrl, KONG_CONFIG.timeout);
  
  try {
    // Check Kong health
    console.log('🔍 Checking Kong Gateway health...');
    const isHealthy = await kong.checkHealth();
    if (!isHealthy) {
      throw new Error('Kong Gateway is not healthy');
    }
    console.log('✅ Kong Gateway is healthy');

    // Create services
    console.log('🔧 Creating Kong services...');
    for (const service of SALAMBOT_SERVICES) {
      try {
        await kong.createService(service);
        console.log(`✅ Service '${service.name}' configured`);
      } catch (error) {
        console.error(`❌ Failed to create service '${service.name}':`, error.message);
        throw error;
      }
    }

    // Create routes
    console.log('🛣️  Creating Kong routes...');
    for (const route of SALAMBOT_ROUTES) {
      try {
        await kong.createRoute(route);
        console.log(`✅ Route '${route.name}' configured`);
      } catch (error) {
        console.error(`❌ Failed to create route '${route.name}':`, error.message);
        throw error;
      }
    }

    // Create global plugins
    console.log('🔌 Creating global plugins...');
    for (const plugin of GLOBAL_PLUGINS) {
      try {
        await kong.createPlugin(plugin);
        console.log(`✅ Global plugin '${plugin.name}' configured`);
      } catch (error) {
        console.error(`❌ Failed to create global plugin '${plugin.name}':`, error.message);
        throw error;
      }
    }

    // Create service-specific plugins
    console.log('🎯 Creating service-specific plugins...');
    for (const servicePlugin of SERVICE_PLUGINS) {
      for (const plugin of servicePlugin.plugins) {
        try {
          await kong.createPlugin(plugin, 'service', servicePlugin.service);
          console.log(`✅ Plugin '${plugin.name}' configured for service '${servicePlugin.service}'`);
        } catch (error) {
          console.error(`❌ Failed to create plugin '${plugin.name}' for service '${servicePlugin.service}':`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 Kong Gateway setup completed successfully!');
    console.log('📊 Access Kong Manager at: http://localhost:8002');
    console.log('🔧 Kong Admin API at: http://localhost:8001');
    console.log('🌐 Kong Proxy at: http://localhost:8000');
    
  } catch (error) {
    console.error('💥 Kong setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupKong();
}

module.exports = {
  setupKong,
  KongClient,
  SALAMBOT_SERVICES,
  SALAMBOT_ROUTES,
  GLOBAL_PLUGINS,
  SERVICE_PLUGINS
};