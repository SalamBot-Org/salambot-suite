/**
 * Teardown Global pour les Tests d'Intégration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Arrête proprement tous les services mock après l'exécution
 *              de la suite de tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import { ChildProcess } from 'child_process';

// Interface pour les services mock (doit correspondre à global-setup.ts)
interface MockService {
  name: string;
  port: number;
  process?: ChildProcess;
  scriptPath: string;
  healthEndpoint?: string;
}

// Timeout pour l'arrêt des services
const SERVICE_SHUTDOWN_TIMEOUT = 10000; // 10 secondes
const FORCE_KILL_DELAY = 5000; // 5 secondes avant kill forcé

/**
 * Arrête un service mock proprement
 */
function stopMockService(service: MockService): Promise<boolean> {
  return new Promise((resolve) => {
    if (!service.process) {
      console.log(`⚠️  Service ${service.name}: Aucun processus à arrêter`);
      resolve(true);
      return;
    }
    
    console.log(`🛑 Arrêt du service ${service.name} (PID: ${service.process.pid})...`);
    
    let isResolved = false;
    
    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (!isResolved) {
        console.warn(`⚠️  Timeout lors de l'arrêt de ${service.name}, kill forcé...`);
        service.process?.kill('SIGKILL');
        isResolved = true;
        resolve(false);
      }
    }, SERVICE_SHUTDOWN_TIMEOUT);
    
    // Écouter la fin du processus
    service.process.on('exit', (code, signal) => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        
        if (code === 0 || signal === 'SIGTERM') {
          console.log(`✅ Service ${service.name} arrêté proprement`);
          resolve(true);
        } else {
          console.warn(`⚠️  Service ${service.name} arrêté avec le code ${code} (signal: ${signal})`);
          resolve(false);
        }
      }
    });
    
    service.process.on('error', (error) => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        console.error(`❌ Erreur lors de l'arrêt de ${service.name}:`, error.message);
        resolve(false);
      }
    });
    
    // Tentative d'arrêt gracieux
    try {
      service.process.kill('SIGTERM');
      
      // Si pas d'arrêt gracieux après 5 secondes, kill forcé
      setTimeout(() => {
        if (!isResolved && service.process && !service.process.killed) {
          console.warn(`⚠️  Arrêt gracieux échoué pour ${service.name}, kill forcé...`);
          service.process.kill('SIGKILL');
        }
      }, FORCE_KILL_DELAY);
      
    } catch (error) {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        console.error(`❌ Erreur lors de l'envoi du signal SIGTERM à ${service.name}:`, error);
        resolve(false);
      }
    }
  });
}

/**
 * Nettoie les ressources Redis de test
 */
function cleanupRedisTestData(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      // Importer Redis seulement si nécessaire
      const Redis = require('ioredis');
      
      const redis = new Redis({
        host: 'localhost',
        port: 6379,
        db: 15, // Base de données de test
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true
      });
      
      // Nettoyer les clés de test
      const keys = await redis.keys('salambot:test:gateway:*');
      
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🧹 Nettoyage Redis: ${keys.length} clé(s) supprimée(s)`);
      } else {
        console.log('🧹 Nettoyage Redis: Aucune clé de test trouvée');
      }
      
      await redis.quit();
      resolve();
      
    } catch (error) {
      console.warn('⚠️  Erreur lors du nettoyage Redis (non critique):', (error as Error).message);
      resolve(); // Ne pas faire échouer le teardown pour Redis
    }
  });
}

/**
 * Nettoie les fichiers temporaires de test
 */
function cleanupTempFiles(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Nettoyer les logs de test
      const logPath = path.resolve(__dirname, '../../logs/test-gateway.log');
      try {
        await fs.unlink(logPath);
        console.log('🧹 Fichier de log de test supprimé');
      } catch (error) {
        // Fichier n'existe pas, pas grave
      }
      
      // Nettoyer les fichiers de couverture temporaires
      const coveragePath = path.resolve(__dirname, '../../coverage');
      try {
        await fs.rmdir(coveragePath, { recursive: true });
        console.log('🧹 Dossier de couverture temporaire supprimé');
      } catch (error) {
        // Dossier n'existe pas, pas grave
      }
      
      resolve();
      
    } catch (error) {
      console.warn('⚠️  Erreur lors du nettoyage des fichiers temporaires (non critique):', (error as Error).message);
      resolve(); // Ne pas faire échouer le teardown
    }
  });
}

/**
 * Affiche un résumé des tests
 */
function displayTestSummary(): void {
  const testResults = (global as any).__TEST_RESULTS__;
  
  if (testResults) {
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    console.log(`✅ Tests réussis: ${testResults.numPassedTests || 0}`);
    console.log(`❌ Tests échoués: ${testResults.numFailedTests || 0}`);
    console.log(`⏭️  Tests ignorés: ${testResults.numPendingTests || 0}`);
    console.log(`⏱️  Durée totale: ${testResults.testExecTime || 0}ms`);
  }
}

/**
 * Teardown global - Point d'entrée
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🧪 === TEARDOWN GLOBAL DES TESTS D\'INTÉGRATION ===');
  
  const startTime = Date.now();
  
  try {
    // Récupérer les services depuis le setup global
    const mockServices: MockService[] = (global as any).__MOCK_SERVICES__ || [];
    
    if (mockServices.length === 0) {
      console.log('⚠️  Aucun service mock à arrêter');
    } else {
      console.log(`🛑 Arrêt de ${mockServices.length} service(s) mock...`);
      
      // Arrêter tous les services en parallèle
      const stopPromises = mockServices.map(service => stopMockService(service));
      const results = await Promise.all(stopPromises);
      
      // Compter les succès et échecs
      const successCount = results.filter(Boolean).length;
      const failureCount = results.length - successCount;
      
      if (failureCount > 0) {
        console.warn(`⚠️  ${failureCount} service(s) n'ont pas pu être arrêtés proprement`);
      }
      
      console.log(`✅ ${successCount}/${mockServices.length} service(s) arrêté(s) avec succès`);
    }
    
    // Nettoyer les données Redis de test
    console.log('🧹 Nettoyage des données de test...');
    await cleanupRedisTestData();
    
    // Nettoyer les fichiers temporaires
    await cleanupTempFiles();
    
    // Afficher le résumé des tests
    displayTestSummary();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Teardown global terminé (${duration}ms)`);
    console.log('🎯 Environnement de test nettoyé');
    
  } catch (error) {
    console.error('❌ Erreur lors du teardown global:', error);
    
    // Tentative de nettoyage forcé en cas d'erreur
    const mockServices: MockService[] = (global as any).__MOCK_SERVICES__ || [];
    for (const service of mockServices) {
      if (service.process && !service.process.killed) {
        try {
          service.process.kill('SIGKILL');
          console.log(`🔪 Kill forcé du service ${service.name}`);
        } catch (killError) {
          console.error(`❌ Impossible de tuer le service ${service.name}:`, killError);
        }
      }
    }
    
    throw error;
  } finally {
    // Nettoyer les références globales
    delete (global as any).__MOCK_SERVICES__;
    delete (global as any).__TEST_RESULTS__;
  }
}