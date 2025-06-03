/**
 * 🚀 SalamBot | Types pour Détection Darija Bi-Script
 *
 * @description  Types et interfaces pour la détection linguistique
 * @author       SalamBot AI Research Team <ai@salambot.ma>
 * @version      2.1.0-neural
 * @created      2025-01-27
 * @license      Propriétaire - SalamBot Team
 */

/**
 * Langues supportées par le système de détection
 */
export type SupportedLanguage = 'french' | 'arabic' | 'darija' | 'english' | 'spanish' | 'german' | 'italian' | 'portuguese' | 'dutch' | 'russian' | 'chinese' | 'japanese' | 'korean' | 'unknown';

/**
 * Scripts supportés pour l'analyse bi-script
 */
export type SupportedScript = 'latin' | 'arabic' | 'mixed' | 'unknown';

/**
 * Source de détection utilisée
 */
export type DetectionSource = 'cld3' | 'darija-detector' | 'bi-script' | 'fallback' | 'hybrid' | 'error' | 'offline-fallback' | 'cld3-failed' | 'cld3-error';

/**
 * Résultat de détection de langue
 */
export interface LanguageDetectionResult {
  /** Langue détectée */
  language: SupportedLanguage;
  /** Niveau de confiance (0-1) */
  confidence: number;
  /** Source de détection utilisée */
  source: DetectionSource;
  /** Script détecté */
  script: SupportedScript;
  /** Temps de traitement en millisecondes */
  processingTime: number;
  /** Métadonnées supplémentaires */
  metadata?: {
    /** Résultats CLD3 bruts */
    cld3Result?: any;
    /** Indicateurs Darija détectés */
    darijaIndicators?: any;
    /** Analyse bi-script */
    biScriptAnalysis?: {
      isBiScript: boolean;
      latinRatio: number;
      arabicRatio: number;
      mixedTokens: string[];
    };
    /** Méthode de détection utilisée */
    detectionMethod?: string;
    /** Analyse Darija */
    darijaAnalysis?: {
      confidence: number;
      indicators: any;
    };
  };
  /** Message d'erreur si applicable */
  error?: string;
}

/**
 * Options de configuration pour la détection
 */
export interface DetectionOptions {
  /** Mode hors ligne (utilise uniquement les règles locales) */
  offline?: boolean;
  /** Seuil de confiance minimum */
  minConfidence?: number;
  /** Activer l'analyse bi-script */
  enableBiScript?: boolean;
  /** Activer les métriques de performance */
  enableMetrics?: boolean;
  /** Activer les détails de debugging */
  enableDetails?: boolean;
  /** Longueur minimale de texte pour une détection fiable */
  minTextLength?: number;
}

/**
 * Indicateurs spécifiques au Darija
 */
export interface DarijaIndicators {
  /** Mots-clés Darija courants */
  keywords: string[];
  /** Patterns de code-switching FR/AR */
  codeSwitchingPatterns: RegExp[];
  /** Suffixes et préfixes typiques */
  morphologicalPatterns: RegExp[];
  /** Expressions idiomatiques */
  idiomaticExpressions: string[];
}

/**
 * Configuration du détecteur Darija
 */
export interface DarijaDetectorConfig {
  /** Seuil pour considérer un texte comme Darija */
  darijaThreshold: number;
  /** Poids des différents indicateurs */
  weights: {
    keywords: number;
    codeSwitching: number;
    morphological: number;
    idiomatic: number;
    scriptMixing: number;
  };
  /** Indicateurs Darija */
  indicators: DarijaIndicators;
}

/**
 * Métriques de performance du système
 */
export interface PerformanceMetrics {
  /** Nombre total de détections */
  totalDetections: number;
  /** Temps moyen de traitement */
  averageProcessingTime: number;
  /** Distribution des langues détectées */
  languageDistribution: Record<SupportedLanguage, number>;
  /** Taux de confiance moyen */
  averageConfidence: number;
  /** Erreurs rencontrées */
  errors: number;
}