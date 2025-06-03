/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * @file        Script to update Firestore with Redis configuration from Terraform outputs
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Try to get credentials from environment variable
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountKey && fs.existsSync(serviceAccountKey)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountKey, 'utf8')
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
 * Get Terraform outputs
 */
function getTerraformOutputs() {
  try {
    console.log('📊 Getting Terraform outputs...');

    const terraformDir = path.join(__dirname, '..', 'infra', 'terraform');
    const outputJson = execSync('terraform output -json', {
      cwd: terraformDir,
      encoding: 'utf8',
    });

    return JSON.parse(outputJson);
  } catch (error) {
    console.error('❌ Failed to get Terraform outputs:', error.message);
    console.error('Make sure you have run "terraform apply" first.');
    process.exit(1);
  }
}

/**
 * Parse Redis URL to extract connection details
 */
function parseRedisUrl(redisUrl) {
  try {
    // Handle URLs with special characters in password by manually parsing
    const urlPattern = /^(redis[s]?):\/\/:?([^@]*?)@([^:]+):(\d+)$/;
    const match = redisUrl.match(urlPattern);

    if (match) {
      const [, protocol, password, host, port] = match;
      return {
        host: host,
        port: parseInt(port) || (protocol === 'rediss' ? 6380 : 6379),
        auth: password || undefined,
        tls: protocol === 'rediss',
      };
    }

    // Fallback to URL constructor for standard URLs
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
async function updateRedisConfig(outputs) {
  const db = initializeFirebase();

  try {
    // Extract Redis configuration from Terraform outputs
    const redisUrl = outputs.redis_dev_url?.value;
    const tlsEnabled = outputs.redis_dev_tls_enabled?.value;
    const secretId = outputs.redis_dev_secret_id?.value;

    if (!redisUrl) {
      throw new Error('Redis URL not found in Terraform outputs');
    }

    const parsedUrl = parseRedisUrl(redisUrl);

    const redisConfig = {
      url: redisUrl,
      tls: tlsEnabled || false,
      ...parsedUrl,
      secretId: secretId,
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
    console.log(`   Secret ID: ${redisConfig.secretId}`);
    console.log(`   Environment: ${redisConfig.environment}`);
    console.log(`   Updated: ${redisConfig.updatedAt}`);
  } catch (error) {
    console.error('❌ Failed to update Redis configuration:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Firestore configuration update...');

  try {
    // Get Terraform outputs
    const outputs = getTerraformOutputs();

    // Update Firestore with Redis configuration
    await updateRedisConfig(outputs);

    console.log('🎉 Firestore configuration update completed successfully!');
  } catch (error) {
    console.error('❌ Configuration update failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  updateRedisConfig,
  getTerraformOutputs,
  parseRedisUrl,
};
