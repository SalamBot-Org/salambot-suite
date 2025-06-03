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
import { BiScriptAnalyzer } from './bi-script-analyzer';
import {
  LanguageDetectionResult,
  DetectionOptions,
  SupportedLanguage,
  DetectionSource,
  PerformanceMetrics
} from './types';

/**
 * Détecteur principal de langue avec spécialisation Darija
 */
export class LanguageDetector {
  private darijaDetector: DarijaDetector;
  private biScriptAnalyzer: BiScriptAnalyzer;
  private performanceMetrics: PerformanceMetrics;
  private cld3Factory: any = null;

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
   * Détecte la langue d'un texte avec approche hybride
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

      // Préprocessing
      const cleanText = this.preprocessText(text);
      
      // Analyse bi-script
      const biScriptAnalysis = this.biScriptAnalyzer.analyze(cleanText);
      
      // Détection Darija prioritaire
      const darijaResult = await this.darijaDetector.detectDarija(cleanText);
      
      if (darijaResult.isDarija && darijaResult.confidence > 0.7) {
        const result = this.createDarijaResult(darijaResult, biScriptAnalysis, startTime);
        this.updateMetrics(result, startTime);
        return result;
      }

      // Fallback CLD3 pour autres langues
      const cld3Result = await this.detectWithCLD3(cleanText, options);
      
      // Fusion des résultats
      const finalResult = this.mergeResults(
        cld3Result,
        darijaResult,
        biScriptAnalysis,
        startTime
      );
      
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
   * Préprocesse le texte pour optimiser la détection
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalise les espaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Supprime les caractères invisibles
      .trim();
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
      
    } catch (error) {
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
    darijaResult: any,
    biScriptAnalysis: any,
    startTime: number
  ): LanguageDetectionResult {
    return {
      language: 'darija',
      confidence: darijaResult.confidence,
      source: 'darija-detector',
      script: biScriptAnalysis.dominantScript,
      processingTime: performance.now() - startTime,
      metadata: {
        darijaIndicators: darijaResult.indicators,
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
   * Fusionne les résultats de différents détecteurs
   */
  private mergeResults(
    cld3Result: any,
    darijaResult: any,
    biScriptAnalysis: any,
    startTime: number
  ): LanguageDetectionResult {
    // Si Darija a une confiance modérée et CLD3 détecte arabe, privilégier Darija
    if (
      darijaResult.confidence > 0.4 &&
      cld3Result.language === 'arabic' &&
      biScriptAnalysis.isBiScript
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
          indicators: darijaResult.indicators
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
