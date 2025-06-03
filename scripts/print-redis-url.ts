#!/usr/bin/env tsx
/**
 * @file        Script to update Firestore with Redis connection details
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

interface RedisConfig {
  url: string;
  tls: boolean;
  host?: string;
  port?: number;
  auth?: string;
  updatedAt: string;
  environment: string;
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Try to get credentials from environment variable
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountKey, 'utf8')
      );

      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      // Fallback to default credentials (for local development)
      initializeApp();
    }

    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    process.exit(1);
  }
}

/**
 * Parse Redis URL to extract connection details
 */
function parseRedisUrl(redisUrl: string): Partial<RedisConfig> {
  try {
    const url = new URL(redisUrl);

    return {
      host: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'rediss:' ? 6380 : 6379),
      auth: url.password || undefined,
      tls: url.protocol === 'rediss:',
    };
  } catch (error) {
    console.error('Failed to parse Redis URL:', error);
    return {};
  }
}

/**
 * Update Firestore with Redis configuration
 */
async function updateRedisConfig(redisUrl: string, tlsEnabled: string) {
  const db = initializeFirebase();

  try {
    const parsedUrl = parseRedisUrl(redisUrl);
    const isTlsEnabled = tlsEnabled.toLowerCase() === 'true';

    const redisConfig: RedisConfig = {
      url: redisUrl,
      tls: isTlsEnabled,
      ...parsedUrl,
      updatedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Update the configs/runtime collection
    const configRef = db.collection('configs').doc('runtime');

    await configRef.set(
      {
        redis: redisConfig,
      },
      { merge: true }
    );

    console.log('✅ Redis configuration updated successfully in Firestore');
    console.log('📊 Configuration details:');
    console.log(`   Host: ${redisConfig.host}`);
    console.log(`   Port: ${redisConfig.port}`);
    console.log(`   TLS: ${redisConfig.tls ? 'Enabled' : 'Disabled'}`);
    console.log(`   Auth: ${redisConfig.auth ? 'Enabled' : 'Disabled'}`);
    console.log(`   Environment: ${redisConfig.environment}`);
    console.log(`   Updated: ${redisConfig.updatedAt}`);
  } catch (error) {
    console.error('❌ Failed to update Redis configuration:', error);
    process.exit(1);
  }
}

/**
 * Validate environment and arguments
 */
function validateEnvironment() {
  const requiredEnvVars = ['GOOGLE_APPLICATION_CREDENTIALS'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      '⚠️  Warning: Missing environment variables:',
      missingVars.join(', ')
    );
    console.log('   Attempting to use default credentials...');
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '❌ Usage: pnpm tsx scripts/print-redis-url.ts <redis_url> <tls_enabled>'
    );
    console.error(
      '   Example: pnpm tsx scripts/print-redis-url.ts "redis://user:pass@host:6379" "true"'
    );
    process.exit(1);
  }

  const [redisUrl, tlsEnabled] = args;

  console.log('🚀 Starting Redis configuration update...');
  console.log(
    `   Redis URL: ${redisUrl.replace(/:\/\/[^@]*@/, '://***:***@')}`
  );
  console.log(`   TLS Enabled: ${tlsEnabled}`);

  validateEnvironment();

  await updateRedisConfig(redisUrl, tlsEnabled);

  console.log('✨ Redis configuration update completed!');
}

// Execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { updateRedisConfig, parseRedisUrl };
