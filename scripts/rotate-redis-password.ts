#!/usr/bin/env tsx
/**
 * @path        scripts/rotate-redis-password.ts
 * @file        Script de rotation automatique du mot de passe Redis
 * @author      SalamBot Team contact: info@salambot.ma
 * @created     01/06/2025
 * @updated     01/06/2025
 * @project     SalamBot Suite
 * @description Script planifié pour renouveler mensuellement les credentials Redis
 *              et mettre à jour la configuration dans Firestore
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';
import { getEnvConfig } from '../libs/config/src/env';

// Configuration
const CONFIG = {
  // Longueur du nouveau mot de passe
  PASSWORD_LENGTH: 32,
  // Nom du secret dans Google Secret Manager
  SECRET_NAME: 'redis-auth-password',
  // Collection Firestore pour la configuration runtime
  FIRESTORE_COLLECTION: 'runtime-config',
  FIRESTORE_DOC: 'redis',
  // Délai d'attente pour les opérations (ms)
  TIMEOUT: 30000,
};

/**
 * Interface pour la configuration Redis dans Firestore
 */
interface RedisConfig {
  host: string;
  port: number;
  password: string;
  tls: boolean;
  lastPasswordRotation: string;
  rotationVersion: number;
}

/**
 * Classe principale pour la rotation des mots de passe Redis
 */
class RedisPasswordRotator {
  private secretClient: SecretManagerServiceClient;
  private firestore: FirebaseFirestore.Firestore;
  private projectId: string;

  constructor() {
    const envConfig = getEnvConfig();

    if (!envConfig.gcpProjectId) {
      throw new Error(
        'GCP_PROJECT_ID environment variable is required for Redis password rotation'
      );
    }

    this.projectId = envConfig.gcpProjectId;

    // Initialisation de Firebase Admin
    this.initializeFirebase();

    // Initialisation du client Secret Manager
    this.secretClient = new SecretManagerServiceClient();
    this.firestore = getFirestore();
  }

  /**
   * Initialise Firebase Admin SDK
   */
  private initializeFirebase(): void {
    if (getApps().length === 0) {
      const envConfig = getEnvConfig();

      if (envConfig.googleApplicationCredentials) {
        initializeApp({
          credential: cert(JSON.parse(envConfig.googleApplicationCredentials)),
          projectId: this.projectId,
        });
      } else {
        // Utilise les credentials par défaut en production
        initializeApp({ projectId: this.projectId });
      }
    }
  }

  /**
   * Génère un nouveau mot de passe sécurisé
   */
  private generateSecurePassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < CONFIG.PASSWORD_LENGTH; i++) {
      const randomIndex = randomBytes(1)[0] % chars.length;
      password += chars[randomIndex];
    }

    return password;
  }

  /**
   * Récupère la configuration Redis actuelle depuis Firestore
   */
  private async getCurrentRedisConfig(): Promise<RedisConfig | null> {
    try {
      const doc = await this.firestore
        .collection(CONFIG.FIRESTORE_COLLECTION)
        .doc(CONFIG.FIRESTORE_DOC)
        .get();

      if (!doc.exists) {
        console.warn('Configuration Redis non trouvée dans Firestore');
        return null;
      }

      return doc.data() as RedisConfig;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de la config Redis:',
        error
      );
      throw error;
    }
  }

  /**
   * Met à jour le secret dans Google Secret Manager
   */
  private async updateSecretManager(newPassword: string): Promise<void> {
    try {
      const secretName = `projects/${this.projectId}/secrets/${CONFIG.SECRET_NAME}`;

      // Ajouter une nouvelle version du secret
      const [version] = await this.secretClient.addSecretVersion({
        parent: secretName,
        payload: {
          data: Buffer.from(newPassword, 'utf8'),
        },
      });

      console.log(`Nouvelle version du secret créée: ${version.name}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du Secret Manager:', error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration Redis dans Firestore
   */
  private async updateFirestoreConfig(
    currentConfig: RedisConfig,
    newPassword: string
  ): Promise<void> {
    try {
      const updatedConfig: RedisConfig = {
        ...currentConfig,
        password: newPassword,
        lastPasswordRotation: new Date().toISOString(),
        rotationVersion: (currentConfig.rotationVersion || 0) + 1,
      };

      await this.firestore
        .collection(CONFIG.FIRESTORE_COLLECTION)
        .doc(CONFIG.FIRESTORE_DOC)
        .set(updatedConfig);

      console.log('Configuration Redis mise à jour dans Firestore');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de Firestore:', error);
      throw error;
    }
  }

  /**
   * Met à jour le mot de passe Redis via Terraform
   */
  private async updateRedisPassword(): Promise<void> {
    try {
      console.log('Mise à jour du mot de passe Redis via Terraform...');

      // Exécuter terraform apply pour mettre à jour l'instance Redis
      const terraformDir = './infra/terraform';

      execSync('terraform plan -out=tfplan', {
        cwd: terraformDir,
        stdio: 'inherit',
        timeout: CONFIG.TIMEOUT,
      });

      execSync('terraform apply tfplan', {
        cwd: terraformDir,
        stdio: 'inherit',
        timeout: CONFIG.TIMEOUT,
      });

      console.log('Mot de passe Redis mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour Terraform:', error);
      throw error;
    }
  }

  /**
   * Vérifie la connectivité Redis avec le nouveau mot de passe
   */
  private async verifyRedisConnection(config: RedisConfig): Promise<boolean> {
    try {
      // Import dynamique pour éviter les problèmes de dépendances
      const Redis = (await import('ioredis')).default;

      const client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        tls: config.tls ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 5000,
        lazyConnect: true,
      });

      await client.ping();
      await client.quit();

      console.log('Connexion Redis vérifiée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur de vérification Redis:', error);
      return false;
    }
  }

  /**
   * Envoie une notification de succès/échec
   */
  private async sendNotification(
    success: boolean,
    details: string
  ): Promise<void> {
    try {
      // Log pour GitHub Actions
      if (success) {
        console.log(`✅ Rotation du mot de passe Redis réussie: ${details}`);
      } else {
        console.error(
          `❌ Échec de la rotation du mot de passe Redis: ${details}`
        );
      }

      // TODO: Intégrer avec un service de notification (Slack, email, etc.)
      // await this.sendSlackNotification(success, details);
    } catch (error) {
      console.error("Erreur lors de l'envoi de notification:", error);
    }
  }

  /**
   * Exécute la rotation complète du mot de passe
   */
  public async rotatePassword(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔄 Début de la rotation du mot de passe Redis...');

      // 1. Récupérer la configuration actuelle
      const currentConfig = await this.getCurrentRedisConfig();
      if (!currentConfig) {
        throw new Error('Configuration Redis non trouvée');
      }

      console.log(
        `Configuration actuelle: version ${currentConfig.rotationVersion || 0}`
      );

      // 2. Générer un nouveau mot de passe
      const newPassword = this.generateSecurePassword();
      console.log('Nouveau mot de passe généré');

      // 3. Mettre à jour Secret Manager
      await this.updateSecretManager(newPassword);

      // 4. Mettre à jour Firestore
      await this.updateFirestoreConfig(currentConfig, newPassword);

      // 5. Appliquer les changements via Terraform
      await this.updateRedisPassword();

      // 6. Vérifier la connexion
      const updatedConfig = { ...currentConfig, password: newPassword };
      const connectionOk = await this.verifyRedisConnection(updatedConfig);

      if (!connectionOk) {
        throw new Error('Échec de la vérification de connexion Redis');
      }

      const duration = Date.now() - startTime;
      const successMessage = `Rotation terminée en ${duration}ms, version ${
        (currentConfig.rotationVersion || 0) + 1
      }`;

      await this.sendNotification(true, successMessage);
      console.log(`✅ ${successMessage}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = `Erreur après ${duration}ms: ${error.message}`;

      await this.sendNotification(false, errorMessage);
      console.error(`❌ ${errorMessage}`);

      // Re-lancer l'erreur pour que le script échoue
      throw error;
    }
  }
}

/**
 * Point d'entrée principal
 */
async function main(): Promise<void> {
  try {
    // Vérifier les variables d'environnement requises
    const envConfig = getEnvConfig();

    if (!envConfig.gcpProjectId) {
      throw new Error('GCP_PROJECT_ID est requis');
    }

    console.log(`Rotation Redis pour le projet: ${envConfig.gcpProjectId}`);
    console.log(`Environnement: ${envConfig.nodeEnv}`);

    // Exécuter la rotation
    const rotator = new RedisPasswordRotator();
    await rotator.rotatePassword();

    console.log('🎉 Rotation du mot de passe Redis terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale lors de la rotation:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

export { RedisPasswordRotator, main };
