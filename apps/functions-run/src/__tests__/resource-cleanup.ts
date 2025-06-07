/**
 * Gestion du Nettoyage des Ressources pour les Tests
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Utilitaires pour nettoyer proprement toutes les ressources
 *              après l'exécution des tests (handles, timers, connexions)
 * @author SalamBot Platform Team
 * @created 2025-06-05
 */

import { MetricsCollector } from '../gateway/middleware/metrics';

// Registre des ressources ouvertes
interface OpenResource {
  type: 'timer' | 'interval' | 'connection' | 'handle';
  id: string | number | NodeJS.Timeout | { close?: () => Promise<void> | void; quit?: () => Promise<void> | void; destroy?: () => void };
  description?: string;
}

const openResources: OpenResource[] = [];

/**
 * Enregistre une ressource ouverte
 */
export function registerResource(type: OpenResource['type'], id: string | number | NodeJS.Timeout | { close?: () => Promise<void> | void; quit?: () => Promise<void> | void; destroy?: () => void }, description?: string): void {
  openResources.push({ type, id, description });
}

/**
 * Désenregistre une ressource fermée
 */
export function unregisterResource(id: string | number | NodeJS.Timeout | { close?: () => Promise<void> | void; quit?: () => Promise<void> | void; destroy?: () => void }): void {
  const index = openResources.findIndex(r => r.id === id);
  if (index !== -1) {
    openResources.splice(index, 1);
  }
}

/**
 * Nettoie toutes les ressources ouvertes
 */
export async function cleanupAllResources(): Promise<void> {
  console.log(`🧹 Nettoyage de ${openResources.length} ressources ouvertes...`);
  
  // Nettoyer les timers et intervals
  const timersAndIntervals = openResources.filter(r => r.type === 'timer' || r.type === 'interval');
  timersAndIntervals.forEach(resource => {
    try {
      if (resource.type === 'timer' && (typeof resource.id === 'object' || typeof resource.id === 'string' || typeof resource.id === 'number')) {
        clearTimeout(resource.id as NodeJS.Timeout);
      } else if (resource.type === 'interval' && (typeof resource.id === 'object' || typeof resource.id === 'string' || typeof resource.id === 'number')) {
        clearInterval(resource.id as NodeJS.Timeout);
      }
      console.log(`✅ ${resource.type} nettoyé: ${resource.description || resource.id}`);
    } catch (error) {
      console.warn(`⚠️ Erreur lors du nettoyage du ${resource.type}:`, error);
    }
  });
  
  // Nettoyer les connexions
  const connections = openResources.filter(r => r.type === 'connection');
  for (const connection of connections) {
    try {
      const connectionId = connection.id as { close?: () => Promise<void> | void; quit?: () => Promise<void> | void; destroy?: () => void };
      if (connectionId && typeof connectionId.close === 'function') {
        await connectionId.close();
      } else if (connectionId && typeof connectionId.quit === 'function') {
        await connectionId.quit();
      } else if (connectionId && typeof connectionId.destroy === 'function') {
        connectionId.destroy();
      }
      console.log(`✅ Connexion fermée: ${connection.description || 'Unknown'}`);
    } catch (error) {
      console.warn(`⚠️ Erreur lors de la fermeture de connexion:`, error);
    }
  }
  
  // Vider le registre
  openResources.length = 0;
}

/**
 * Nettoie les singletons et instances globales
 */
export function cleanupSingletons(): void {
  try {
    // Reset du MetricsCollector
    if (MetricsCollector && typeof MetricsCollector.resetInstance === 'function') {
      MetricsCollector.resetInstance();
      console.log('✅ MetricsCollector reseté');
    }
    
    // Nettoyer les variables globales de test
    if (global && (global as Record<string, unknown>)['__MOCK_SERVICES__']) {
      delete (global as Record<string, unknown>)['__MOCK_SERVICES__'];
    }
    
    if (global && (global as Record<string, unknown>)['testUtils']) {
      delete (global as Record<string, unknown>)['testUtils'];
    }
    
    console.log('✅ Singletons nettoyés');
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage des singletons:', error);
  }
}

/**
 * Force la collecte des déchets (garbage collection)
 */
export function forceGarbageCollection(): void {
  try {
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection forcée');
    } else {
      console.log('⚠️ Garbage collection non disponible (utilisez --expose-gc)');
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors de la garbage collection:', error);
  }
}

/**
 * Nettoyage complet pour les tests
 */
export async function performCompleteCleanup(): Promise<void> {
  console.log('🧹 Début du nettoyage complet des ressources...');
  
  try {
    // Nettoyer toutes les ressources enregistrées
    await cleanupAllResources();
    
    // Nettoyer les singletons
    cleanupSingletons();
    
    // Attendre un peu pour que les ressources se libèrent
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force garbage collection si disponible
    forceGarbageCollection();
    
    console.log('✅ Nettoyage complet terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage complet:', error);
  }
}

/**
 * Wrapper pour setTimeout qui s'enregistre automatiquement
 */
export function managedSetTimeout(callback: () => void, delay: number, description?: string): NodeJS.Timeout {
  const timerId = setTimeout(() => {
    unregisterResource(timerId);
    callback();
  }, delay);
  
  registerResource('timer', timerId, description);
  return timerId;
}

/**
 * Wrapper pour setInterval qui s'enregistre automatiquement
 */
export function managedSetInterval(callback: () => void, delay: number, description?: string): NodeJS.Timeout {
  const intervalId = setInterval(callback, delay);
  registerResource('interval', intervalId, description);
  return intervalId;
}

/**
 * Obtient le nombre de ressources ouvertes
 */
export function getOpenResourcesCount(): number {
  return openResources.length;
}

/**
 * Obtient la liste des ressources ouvertes
 */
export function getOpenResources(): ReadonlyArray<OpenResource> {
  return [...openResources];
}