/**
 * @file        Système de cache pour les configurations
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-01-27
 * @updated     2025-01-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { CacheConfig } from './types';

/**
 * Interface pour un élément de cache
 */
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache en mémoire simple avec TTL
 */
class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: config.defaultTtl || 300, // 5 minutes par défaut
      maxSize: config.maxSize || 100,
      enabled: config.enabled !== false,
    };

    // Nettoyage périodique du cache
    if (this.config.enabled) {
      setInterval(() => this.cleanup(), 60000); // Nettoyage toutes les minutes
    }
  }

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (!this.config.enabled) {
      return;
    }

    // Vérifier la taille maximale
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const ttl = ttlSeconds || this.config.defaultTtl;
    const now = Date.now();

    this.cache.set(key, {
      value,
      expiresAt: now + ttl * 1000,
      createdAt: now,
    });
  }

  /**
   * Supprime une valeur du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [, item] of this.cache) {
      if (now > item.expiresAt) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      expiredItems: expiredCount,
      enabled: this.config.enabled,
      defaultTtl: this.config.defaultTtl,
    };
  }

  /**
   * Nettoie les éléments expirés
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Supprime l'élément le plus ancien
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Instance globale du cache
const globalCache = new MemoryCache();

/**
 * Récupère une valeur du cache global
 */
export function getCached<T>(key: string): T | null {
  return globalCache.get<T>(key);
}

/**
 * Stocke une valeur dans le cache global
 */
export function setCached<T>(key: string, value: T, ttlSeconds?: number): void {
  globalCache.set(key, value, ttlSeconds);
}

/**
 * Supprime une valeur du cache global
 */
export function deleteCached(key: string): boolean {
  return globalCache.delete(key);
}

/**
 * Vide le cache global
 */
export function clearConfigCache(): void {
  globalCache.clear();
}

/**
 * Retourne les statistiques du cache global
 */
export function getCacheStats() {
  return globalCache.getStats();
}

/**
 * Crée une nouvelle instance de cache
 */
export function createCache(config?: Partial<CacheConfig>): MemoryCache {
  return new MemoryCache(config);
}

export { MemoryCache };
