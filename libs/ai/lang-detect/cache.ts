import { LangResult } from './index';

/**
 * Interface pour le cache Redis
 */
export interface CacheProvider {
  get(key: string): Promise<LangResult | null>;
  set(key: string, value: LangResult, ttlSeconds?: number): Promise<void>;
}

/**
 * Implémentation du cache Redis pour la détection de langue
 */
export class RedisCache implements CacheProvider {
  private readonly defaultTtl: number;
  
  /**
   * Constructeur du cache Redis
   * @param defaultTtl TTL par défaut en secondes (86400 = 24h)
   */
  constructor(defaultTtl: number = 86400) {
    this.defaultTtl = defaultTtl;
  }
  
  /**
   * Récupère un résultat de détection depuis le cache
   * @param key Clé de cache (hash du texte)
   * @returns Résultat de détection ou null si absent
   */
  async get(key: string): Promise<LangResult | null> {
    // Simulation du cache Redis (à remplacer par l'intégration réelle)
    // Dans l'implémentation réelle, nous utiliserons un client Redis
    
    // Pour la simulation, utiliser localStorage si disponible
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(`lang-detect:${key}`);
      if (cached) {
        try {
          const result = JSON.parse(cached) as LangResult;
          console.log(`Cache hit for key: ${key}`);
          return result;
        } catch (e) {
          console.error('Error parsing cached result:', e);
        }
      }
    }
    
    console.log(`Cache miss for key: ${key}`);
    return null;
  }
  
  /**
   * Stocke un résultat de détection dans le cache
   * @param key Clé de cache (hash du texte)
   * @param value Résultat de détection
   * @param ttlSeconds TTL en secondes (optionnel, utilise defaultTtl par défaut)
   */
  async set(key: string, value: LangResult, ttlSeconds: number = this.defaultTtl): Promise<void> {
    // Simulation du cache Redis (à remplacer par l'intégration réelle)
    // Dans l'implémentation réelle, nous utiliserons un client Redis avec TTL
    
    // Pour la simulation, utiliser localStorage si disponible
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`lang-detect:${key}`, JSON.stringify(value));
        console.log(`Cached result for key: ${key} with TTL: ${ttlSeconds}s`);
      } catch (e) {
        console.error('Error caching result:', e);
      }
    } else {
      console.log(`Would cache result for key: ${key} with TTL: ${ttlSeconds}s`);
    }
  }
}

/**
 * Génère une clé de cache à partir d'un texte
 * @param text Texte à hacher
 * @returns Clé de cache (hash simple)
 */
export function generateCacheKey(text: string): string {
  // Implémentation simple de hachage pour la simulation
  // Dans l'implémentation réelle, utiliser un algorithme de hachage plus robuste
  
  // Normaliser le texte (minuscules, sans espaces)
  const normalized = text.toLowerCase().trim();
  
  // Hachage simple pour la simulation
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Conversion en 32bit integer
  }
  
  return `text:${Math.abs(hash).toString(16)}`;
}

// Instance singleton du cache
export const langDetectCache = new RedisCache();
