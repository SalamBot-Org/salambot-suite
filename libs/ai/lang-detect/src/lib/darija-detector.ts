/**
 * 🚀 SalamBot | Détecteur Darija Spécialisé
 *
 * @description  Détection avancée du dialecte marocain (Darija)
 * @author       SalamBot AI Research Team <ai@salambot.ma>
 * @version      2.1.0-neural
 * @created      2025-01-27
 * @license      Propriétaire - SalamBot Team
 *
 * 🎯 Objectif: >88% précision Darija vs 60% concurrents
 * 🔬 Méthode: Patterns linguistiques + code-switching + morphologie
 */

import { DarijaDetectorConfig } from './types';

/**
 * Mots-clés Darija les plus discriminants
 * Source: Corpus SalamBot 2023-2025 + recherche MoroccoAI
 */
const DARIJA_KEYWORDS = [
  // Salutations et expressions courantes
  'salam', 'ahlan', 'labas', 'bikhir', 'hamdullah', 'inchallah', 'machakil',
  'wakha', 'zwina', 'mezyan', 'mzyan', 'daba', 'ghadi', 'gha', 'rah',
  
  // Pronoms et particules Darija
  'hna', 'nta', 'nti', 'huma', 'ana', 'rah', 'gha', 'li', 'dyal', 'ta',
  'bach', 'ila', 'walakin', 'hit', 'chno', 'fin', 'fuqash', 'kifash',
  
  // Verbes conjugués typiques
  'bghit', 'bgha', 'bghina', 'kan', 'knt', 'kanu', 'gals', 'galsa', 'mcha',
  'ja', 'jat', 'jaw', 'dar', 'drt', 'daru', 'qra', 'qrat', 'kteb', 'ktbt',
  
  // Expressions idiomatiques
  'allah', 'yallah', 'makayn', 'makach', 'walu', 'bzaf', 'chwiya', 'baraka',
  'zwin', 'zwina', 'khayb', 'khayba', 'sahel', 'sahla', 'safi', 'yak',
  
  // Code-switching FR/AR typique
  'wach', 'ach', 'achno', 'chhal', 'fhmt', 'fhmti', 'smhli', 'smh',
  'haja', 'haja', 'khdma', 'khdmt', 'flus', 'drham', 'euro', 'riyal'
];

/**
 * Patterns de code-switching Français-Darija
 */
const CODE_SWITCHING_PATTERNS = [
  // Mélange FR + particules Darija
  /\b(je|tu|il|elle|nous|vous|ils|elles)\s+(rah|gha|li|dyal)\b/gi,
  /\b(c'est|c'était|il y a)\s+(zwina?|mezyan|khayb)\b/gi,
  /\b(très|trop|assez)\s+(zwina?|mezyan|sahel)\b/gi,
  
  // Structures mixtes typiques
  /\b(ana|nta|nti)\s+(je|tu)\b/gi,
  /\b(bghit|bgha)\s+(que|de|à)\b/gi,
  /\b(wakha|safi)\s+(mais|donc|alors)\b/gi,
  
  // Expressions temporelles mixtes
  /\b(daba|ghadi)\s+(maintenant|après|demain)\b/gi,
  /\b(hier|aujourd'hui|demain)\s+(kan|gha|rah)\b/gi
];

/**
 * Patterns morphologiques Darija
 */
const MORPHOLOGICAL_PATTERNS = [
  // Suffixes verbaux Darija
  /\w+(it|at|u|na|tu|w)\b/g,
  
  // Préfixes verbaux
  /\b(ka|ta|ma|la)\w+/g,
  
  // Patterns possessifs
  /\w+(i|k|ha|hum|na|kum)\b/g,
  
  // Diminutifs et augmentatifs
  /\w+(iya|iyya|awi|awa)\b/g
];

/**
 * Expressions idiomatiques Darija
 */
const IDIOMATIC_EXPRESSIONS = [
  'allah yhdik', 'allah ysahel', 'allah yster', 'baraka allah fik',
  'la bas alik', 'chno akhbar', 'kifash dayer', 'wach labas',
  'safi haka', 'wakha haka', 'makayn mushkil', 'bzaf zwina',
  'chwiya chwiya', 'yallah bina', 'allah ma3ak', 'inchallah ghadi'
];

/**
 * Configuration par défaut du détecteur Darija
 */
const DEFAULT_CONFIG: DarijaDetectorConfig = {
  darijaThreshold: 0.75,
  weights: {
    keywords: 0.35,
    codeSwitching: 0.25,
    morphological: 0.20,
    idiomatic: 0.15,
    scriptMixing: 0.05
  },
  indicators: {
    keywords: DARIJA_KEYWORDS,
    codeSwitchingPatterns: CODE_SWITCHING_PATTERNS,
    morphologicalPatterns: MORPHOLOGICAL_PATTERNS,
    idiomaticExpressions: IDIOMATIC_EXPRESSIONS
  }
};

/**
 * Détecteur Darija spécialisé
 * 
 * Utilise une approche multi-critères pour identifier le dialecte marocain:
 * 1. Analyse lexicale (mots-clés spécifiques)
 * 2. Détection code-switching FR/AR
 * 3. Patterns morphologiques
 * 4. Expressions idiomatiques
 * 5. Analyse bi-script (Latin/Arabe)
 */
export class DarijaDetector {
  private config: DarijaDetectorConfig;
  
  constructor(config: Partial<DarijaDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Détecte si un texte est en Darija
   * @param text Texte à analyser
   * @returns Score de confiance (0-1) et détails
   */
  detectDarija(text: string): {
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
  } {
    const normalizedText = this.normalizeText(text);
    const words = this.tokenize(normalizedText);
    
    // 1. Analyse des mots-clés Darija
    const keywordScore = this.analyzeKeywords(words);
    
    // 2. Détection code-switching
    const codeSwitchingScore = this.analyzeCodeSwitching(normalizedText);
    
    // 3. Analyse morphologique
    const morphologicalScore = this.analyzeMorphology(normalizedText);
    
    // 4. Expressions idiomatiques
    const idiomaticScore = this.analyzeIdiomaticExpressions(normalizedText);
    
    // 5. Analyse bi-script
    const scriptMixingScore = this.analyzeScriptMixing(text);
    
    // Calcul du score pondéré
    const weightedScore = (
      keywordScore * this.config.weights.keywords +
      codeSwitchingScore * this.config.weights.codeSwitching +
      morphologicalScore * this.config.weights.morphological +
      idiomaticScore * this.config.weights.idiomatic +
      scriptMixingScore * this.config.weights.scriptMixing
    );
    
    const detectedIndicators = this.getDetectedIndicators(normalizedText);
    
    return {
      isDarija: weightedScore >= this.config.darijaThreshold,
      confidence: Math.min(weightedScore, 1.0),
      details: {
        keywordScore,
        codeSwitchingScore,
        morphologicalScore,
        idiomaticScore,
        scriptMixingScore,
        detectedIndicators
      }
    };
  }
  
  /**
   * Normalise le texte pour l'analyse
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u064B-\u065F]/g, '') // Supprime les diacritiques arabes
      .replace(/[^\u0600-\u06FF\u0750-\u077F\w\s]/g, ' ') // Garde arabe et latin
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Tokenise le texte en mots
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 1);
  }
  
  /**
   * Analyse la présence de mots-clés Darija
   */
  private analyzeKeywords(words: string[]): number {
    const darijaWords = words.filter(word => 
      this.config.indicators.keywords.includes(word)
    );
    
    return words.length > 0 ? darijaWords.length / words.length : 0;
  }
  
  /**
   * Détecte les patterns de code-switching
   */
  private analyzeCodeSwitching(text: string): number {
    let matches = 0;
    
    for (const pattern of this.config.indicators.codeSwitchingPatterns) {
      const patternMatches = text.match(pattern);
      if (patternMatches) {
        matches += patternMatches.length;
      }
    }
    
    // Normalise par la longueur du texte
    return Math.min(matches / (text.length / 100), 1.0);
  }
  
  /**
   * Analyse les patterns morphologiques
   */
  private analyzeMorphology(text: string): number {
    let matches = 0;
    
    for (const pattern of this.config.indicators.morphologicalPatterns) {
      const patternMatches = text.match(pattern);
      if (patternMatches) {
        matches += patternMatches.length;
      }
    }
    
    return Math.min(matches / (text.length / 50), 1.0);
  }
  
  /**
   * Détecte les expressions idiomatiques
   */
  private analyzeIdiomaticExpressions(text: string): number {
    let score = 0;
    
    for (const expression of this.config.indicators.idiomaticExpressions) {
      if (text.includes(expression)) {
        score += 0.1; // Chaque expression idiomatique ajoute 10%
      }
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Analyse le mélange de scripts (Latin/Arabe)
   */
  private analyzeScriptMixing(text: string): number {
    const arabicChars = text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || [];
    const latinChars = text.match(/[a-zA-Z]/g) || [];
    
    if (arabicChars.length === 0 || latinChars.length === 0) {
      return 0; // Pas de mélange
    }
    
    const totalChars = arabicChars.length + latinChars.length;
    const mixingRatio = Math.min(arabicChars.length, latinChars.length) / totalChars;
    
    // Le Darija utilise souvent un mélange équilibré
    return mixingRatio > 0.2 ? mixingRatio : 0;
  }
  
  /**
   * Récupère les indicateurs détectés pour le debugging
   */
  private getDetectedIndicators(text: string): string[] {
    const indicators: string[] = [];
    
    // Mots-clés détectés
    for (const keyword of this.config.indicators.keywords) {
      if (text.includes(keyword)) {
        indicators.push(`keyword:${keyword}`);
      }
    }
    
    // Expressions idiomatiques détectées
    for (const expression of this.config.indicators.idiomaticExpressions) {
      if (text.includes(expression)) {
        indicators.push(`idiom:${expression}`);
      }
    }
    
    return indicators.slice(0, 10); // Limite pour éviter la verbosité
  }
  
  /**
   * Met à jour la configuration du détecteur
   */
  updateConfig(newConfig: Partial<DarijaDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Obtient la configuration actuelle
   */
  getConfig(): DarijaDetectorConfig {
    return { ...this.config };
  }
}

/**
 * Instance par défaut du détecteur Darija
 */
export const defaultDarijaDetector = new DarijaDetector();