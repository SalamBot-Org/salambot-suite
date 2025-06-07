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
import { stopRedisMemoryServer } from './redis-memory-setup';

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
async function cleanupRedisTestData(): Promise<void> {
  try {
    // Utiliser le client Redis en mémoire si disponible
    const { getRedisTestClient, cleanRedisTestData } = await import('./redis-memory-setup');
    
    const redisClient = getRedisTestClient();
    if (redisClient) {
      await cleanRedisTestData();
      console.log('🧹 Nettoyage Redis en mémoire terminé');
    } else {
      console.log('🧹 Aucun client Redis en mémoire à nettoyer');
    }
      
  } catch (error) {
    console.warn('⚠️  Erreur lors du nettoyage Redis (non critique):', (error as Error).message);
    // Ne pas faire échouer le teardown pour Redis
  }
}

/**
 * Nettoie les fichiers temporaires de test
 */
async function cleanupTempFiles(): Promise<void> {
  try {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
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
    
  } catch (error) {
    console.warn('⚠️  Erreur lors du nettoyage des fichiers temporaires (non critique):', (error as Error).message);
    // Ne pas faire échouer le teardown
  }
}

/**
 * Affiche un résumé des tests
 */
function displayTestSummary(): void {
  const testResults = (global as Record<string, unknown>)['__TEST_RESULTS__'] as {
    numPassedTests?: number;
    numFailedTests?: number;
    numPendingTests?: number;
    testExecTime?: number;
  } | undefined;
  
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
    const mockServices: MockService[] = (global as Record<string, unknown>)['__MOCK_SERVICES__'] as MockService[] || [];
    
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
    
    // Arrêter Redis en mémoire
    console.log('📦 Arrêt de Redis en mémoire...');
    await stopRedisMemoryServer();
    
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
    const mockServices: MockService[] = (global as Record<string, unknown>)['__MOCK_SERVICES__'] as MockService[] || [];
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
    delete (global as Record<string, unknown>)['__MOCK_SERVICES__'];
    delete (global as Record<string, unknown>)['__TEST_RESULTS__'];
  }
}