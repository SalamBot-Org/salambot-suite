/**
 * 🚀 SalamBot | Détection de Langue IA
 *
 * @description  Détection avancée de langues avec spécialisation Darija
 * @author       SalamBot AI Research Team <ai@salambot.ma>
 * @version      2.1.0-neural
 * @created      2025-01-27
 * @license      Propriétaire - SalamBot Team
 *
 * 🎯 Objectif: >88% précision pour Darija, <200ms performance
 */

import { loadModule } from 'cld3-asm';
import { DarijaDetector } from './darija-detector';
import { BiScriptAnalyzer, BiScriptAnalysisResult } from './bi-script-analyzer';
import {
  LanguageDetectionResult,
  DetectionOptions,
  SupportedLanguage,
  DetectionSource,
  PerformanceMetrics
} from './types';

// Types for CLD3 results - matching cld3-asm actual return type
interface CLD3Result {
  language: string;
  probability: number;
  is_reliable: boolean;
}

// Types for Darija detection results
interface DarijaDetectionResult {
  isDarija: boolean;
  confidence: number;
  details: {
    keywordScore: number;
    codeSwitchingScore: number;
    morphologicalScore: number;
    idiomaticScore: number;
    scriptMixingScore: number;
    detectedIndicators: string[];
  };
}

// CLD3 Factory interface - matching cld3-asm actual types
interface CLD3Factory {
  create(): {
    findLanguage(text: string): {
      language: string;
      probability: number;
      is_reliable: boolean;
    } | null;
    dispose(): void;
  };
}

/**
 * Cache entry pour optimiser les performances
 */
interface CacheEntry {
  result: LanguageDetectionResult;
  timestamp: number;
  hitCount: number;
}

/**
 * Détecteur principal de langue avec spécialisation Darija - OPTIMISÉ PHASE 1
 * Améliorations: cache LRU, pipeline optimisé, seuils ajustés
 */
export class LanguageDetector {
  private darijaDetector: DarijaDetector;
  private biScriptAnalyzer: BiScriptAnalyzer;
  private performanceMetrics: PerformanceMetrics;
  private cld3Factory: CLD3Factory | null = null;
  
  // Cache LRU pour améliorer les performances (Phase 1)
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.darijaDetector = new DarijaDetector();
    this.biScriptAnalyzer = new BiScriptAnalyzer();
    this.performanceMetrics = {
      totalDetections: 0,
      averageProcessingTime: 0,
      languageDistribution: {} as Record<SupportedLanguage, number>,
      averageConfidence: 0,
      errors: 0
    };
  }

  private async initializeCld3(): Promise<void> {
    if (!this.cld3Factory) {
      try {
        this.cld3Factory = await loadModule();
      } catch (error) {
        console.warn('Failed to initialize CLD3:', error);
        this.cld3Factory = null;
      }
    }
  }

  /**
   * Détecte la langue d'un texte avec approche hybride - OPTIMISÉ PHASE 1
   * Améliorations: cache intelligent, seuils ajustés, pipeline optimisé
   * @param text Texte à analyser
   * @param options Options de détection
   * @returns Résultat de détection avec confiance
   */
  async detectLanguage(
    text: string,
    options: DetectionOptions = {}
  ): Promise<LanguageDetectionResult> {
    const startTime = performance.now();
    
    try {
      // Validation d'entrée
      if (!text || text.trim().length === 0) {
        return this.createErrorResult('Texte vide ou invalide', startTime);
      }

      if (text.trim().length < 3) {
        return this.createErrorResult('Texte trop court pour détection fiable', startTime);
      }

      // Préprocessing optimisé
      const cleanText = this.preprocessText(text);
      
      // Vérification cache (Phase 1 - amélioration performance)
      const cacheKey = this.generateCacheKey(cleanText, options);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult && !options.bypassCache) {
        // Mise à jour du temps de traitement pour le cache hit
        cachedResult.processingTime = performance.now() - startTime;
        this.updateMetrics(cachedResult, startTime);
        return cachedResult;
      }
      
      // Analyse bi-script optimisée
      const biScriptAnalysis = this.biScriptAnalyzer.analyze(cleanText);
      
      // Détection Darija prioritaire avec seuil optimisé (0.7 → 0.6)
      const darijaResult = await this.darijaDetector.detectDarija(cleanText);
      
      // Seuil abaissé pour capturer plus de variantes Darija (Phase 1)
      if (darijaResult.isDarija && darijaResult.confidence > 0.6) {
        const result = this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
        this.cacheResult(cacheKey, result);
        this.updateMetrics(result, startTime);
        return result;
      }

      // Fallback CLD3 pour autres langues
      const cld3Result = await this.detectWithCLD3(cleanText, options);
      
      // Fusion des résultats avec logique améliorée
      const finalResult = this.mergeResults(
        cld3Result,
        darijaResult,
        biScriptAnalysis,
        startTime
      );
      
      // Cache du résultat final
      this.cacheResult(cacheKey, finalResult);
      this.updateMetrics(finalResult, startTime);
      return finalResult;
      
    } catch (error) {
      const errorResult = this.createErrorResult(
        `Erreur de détection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        startTime
      );
      this.updateMetrics(errorResult, startTime);
      return errorResult;
    }
  }

  /**
   * Préprocesse le texte pour optimiser la détection - OPTIMISÉ PHASE 1
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalise les espaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Supprime les caractères invisibles
      .replace(/[\u064B-\u065F]/g, '') // Supprime diacritiques arabes pour normalisation
      .trim();
  }

  /**
   * Génère une clé de cache pour un texte et des options
   */
  private generateCacheKey(text: string, options: DetectionOptions): string {
    const optionsStr = JSON.stringify({
      offline: options.offline || false,
      minConfidence: options.minConfidence || 0
    });
    // Hash simple pour éviter les clés trop longues
    const textHash = this.simpleHash(text.substring(0, 100));
    return `${textHash}_${optionsStr}`;
  }

  /**
   * Hash simple pour les clés de cache
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Récupère un résultat du cache s'il est valide
   */
  private getCachedResult(cacheKey: string): LanguageDetectionResult | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Mise à jour du compteur de hits
    entry.hitCount++;
    return { ...entry.result };
  }

  /**
   * Met en cache un résultat avec gestion LRU
   */
  private cacheResult(cacheKey: string, result: LanguageDetectionResult): void {
    // Nettoyage du cache si trop plein
    if (this.cache.size >= this.CACHE_SIZE) {
      this.evictLeastUsed();
    }

    this.cache.set(cacheKey, {
      result: { ...result },
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  /**
   * Éviction LRU du cache
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minHitCount = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hitCount < minHitCount || 
          (entry.hitCount === minHitCount && entry.timestamp < oldestTimestamp)) {
        leastUsedKey = key;
        minHitCount = entry.hitCount;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * Détection avec CLD3
   */
  private async detectWithCLD3(
    text: string,
    options: DetectionOptions
  ): Promise<{
    language: SupportedLanguage;
    confidence: number;
    source: DetectionSource;
  }> {
    try {
      if (options.offline) {
        // Mode hors ligne - utilise seulement les patterns locaux
        return {
          language: 'unknown',
          confidence: 0.1,
          source: 'offline-fallback'
        };
      }

      await this.initializeCld3();
      
      if (!this.cld3Factory) {
        return {
          language: 'unknown',
          confidence: 0.1,
          source: 'cld3-failed'
        };
      }

      const languageIdentifier = this.cld3Factory.create();
      const cld3Result = languageIdentifier.findLanguage(text);
      languageIdentifier.dispose();
      
      if (!cld3Result || !cld3Result.language) {
        return {
          language: 'unknown',
          confidence: 0.1,
          source: 'cld3-failed'
        };
      }

      // Mapping CLD3 vers nos langues supportées
      const mappedLanguage = this.mapCLD3Language(cld3Result.language);
      
      return {
        language: mappedLanguage,
        confidence: cld3Result.probability || 0.5,
        source: 'cld3'
      };
      
    } catch (_error) {
      return {
        language: 'unknown',
        confidence: 0.1,
        source: 'cld3-error'
      };
    }
  }

  /**
   * Mappe les codes langue CLD3 vers nos langues supportées
   */
  private mapCLD3Language(cld3Lang: string): SupportedLanguage {
    const mapping: Record<string, SupportedLanguage> = {
      'ar': 'arabic',
      'fr': 'french',
      'en': 'english',
      'es': 'spanish',
      'de': 'german',
      'it': 'italian',
      'pt': 'portuguese',
      'nl': 'dutch',
      'ru': 'russian',
      'zh': 'chinese',
      'ja': 'japanese',
      'ko': 'korean'
    };
    
    return mapping[cld3Lang] || 'unknown';
  }

  /**
   * Crée un résultat pour Darija détecté
   */
  private createDarijaResult(
    darijaResult: DarijaDetectionResult,
    biScriptAnalysis: BiScriptAnalysisResult,
    startTime: number
  ): LanguageDetectionResult {
    return {
      language: 'darija',
      confidence: darijaResult.confidence,
      source: 'darija-detector',
      script: biScriptAnalysis.dominantScript,
      processingTime: performance.now() - startTime,
      metadata: {
        darijaIndicators: darijaResult.details.detectedIndicators,
        biScriptAnalysis: {
          isBiScript: biScriptAnalysis.isBiScript,
          latinRatio: biScriptAnalysis.latinRatio,
          arabicRatio: biScriptAnalysis.arabicRatio,
          mixedTokens: biScriptAnalysis.mixedTokens
        },
        detectionMethod: 'hybrid-darija-specialized'
      }
    };
  }

  /**
   * Fusionne les résultats de différents détecteurs - OPTIMISÉ PHASE 1
   * Logique améliorée pour mieux capturer les variantes Darija
   */
  private mergeResults(
    cld3Result: { language: SupportedLanguage; confidence: number; source: DetectionSource; },
    darijaResult: DarijaDetectionResult,
    biScriptAnalysis: BiScriptAnalysisResult,
    startTime: number
  ): LanguageDetectionResult {
    // Logique améliorée Phase 1: seuils abaissés et conditions étendues
    
    // Cas 1: Darija avec confiance modérée + CLD3 arabe + bi-script
    if (
      darijaResult.confidence > 0.35 && // Seuil abaissé: 0.4 → 0.35
      cld3Result.language === 'arabic' &&
      biScriptAnalysis.isBiScript
    ) {
      return this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
    }

    // Cas 2: Darija avec confiance faible mais indicateurs forts
    if (
      darijaResult.confidence > 0.25 &&
      darijaResult.details.detectedIndicators.length >= 3 && // Au moins 3 indicateurs
      (biScriptAnalysis.isBiScript || cld3Result.language === 'arabic')
    ) {
      return this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
    }

    // Cas 3: CLD3 incertain mais Darija détecte des patterns
    if (
      cld3Result.confidence < 0.6 &&
      darijaResult.confidence > 0.3 &&
      darijaResult.details.detectedIndicators.length >= 2
    ) {
      return this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
    }

    // Cas 4: PHASE 1 - Darija avec beaucoup d'indicateurs (priorité haute)
    if (
      darijaResult.details.detectedIndicators.length >= 5 && // 5+ indicateurs = très probable Darija
      darijaResult.confidence > 0.2 // Seuil très bas car indicateurs nombreux
    ) {
      return this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
    }

    // Cas 5: PHASE 1 - Darija avec indicateurs modérés mais confiance raisonnable
    if (
      darijaResult.details.detectedIndicators.length >= 3 &&
      darijaResult.confidence > 0.25
    ) {
      return this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
    }

    // Sinon, utiliser le résultat CLD3
    return {
      language: cld3Result.language,
      confidence: cld3Result.confidence,
      source: cld3Result.source,
      script: biScriptAnalysis.dominantScript,
      processingTime: performance.now() - startTime,
      metadata: {
        cld3Result,
        darijaAnalysis: {
          confidence: darijaResult.confidence,
          indicators: darijaResult.details.detectedIndicators
        },
        biScriptAnalysis: {
           isBiScript: biScriptAnalysis.isBiScript,
           latinRatio: biScriptAnalysis.latinRatio,
           arabicRatio: biScriptAnalysis.arabicRatio,
           mixedTokens: biScriptAnalysis.mixedTokens
         },
        detectionMethod: 'hybrid-cld3-primary'
      }
    };
  }

  /**
   * Crée un résultat d'erreur
   */
  private createErrorResult(message: string, startTime?: number): LanguageDetectionResult {
    return {
      language: 'unknown',
      confidence: 0,
      source: 'error',
      script: 'unknown',
      processingTime: startTime ? performance.now() - startTime : 0,
      error: message
    };
  }

  /**
   * Met à jour les métriques de performance
   */
  private updateMetrics(result: LanguageDetectionResult, startTime: number): void {
    this.performanceMetrics.totalDetections++;
    
    const processingTime = performance.now() - startTime;
    this.performanceMetrics.averageProcessingTime = 
      (this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.totalDetections - 1) + processingTime) /
      this.performanceMetrics.totalDetections;
    
    // Mise à jour de la distribution des langues
    if (!this.performanceMetrics.languageDistribution[result.language]) {
      this.performanceMetrics.languageDistribution[result.language] = 0;
    }
    this.performanceMetrics.languageDistribution[result.language]++;
    
    // Mise à jour de la confiance moyenne
    this.performanceMetrics.averageConfidence = 
      (this.performanceMetrics.averageConfidence * (this.performanceMetrics.totalDetections - 1) + result.confidence) /
      this.performanceMetrics.totalDetections;
    
    // Comptage des erreurs
    if (result.source === 'error') {
      this.performanceMetrics.errors++;
    }
  }

  /**
   * Retourne les métriques de performance
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      totalDetections: 0,
      averageProcessingTime: 0,
      languageDistribution: {} as Record<SupportedLanguage, number>,
      averageConfidence: 0,
      errors: 0
    };
  }
}

/**
 * Instance par défaut du détecteur
 */
export const defaultLanguageDetector = new LanguageDetector();

/**
 * Fonction principale de détection (interface simplifiée)
 * @param text Texte à analyser
 * @param options Options de détection
 * @returns Résultat de détection
 */
export async function detectLanguage(
  text: string,
  options: DetectionOptions = {}
): Promise<LanguageDetectionResult> {
  return defaultLanguageDetector.detectLanguage(text, options);
}

/**
 * Fonction legacy pour compatibilité
 * @deprecated Utiliser detectLanguage à la place
 */
export function aiLangDetect(): string {
  return 'ai-lang-detect-v2.1.0';
}
