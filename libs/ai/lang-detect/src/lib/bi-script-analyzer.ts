/**
 * 🚀 SalamBot | Analyseur Bi-Script
 *
 * @description  Analyse des textes mélangeant scripts Latin et Arabe
 * @author       SalamBot AI Research Team <ai@salambot.ma>
 * @version      2.1.0-neural
 * @created      2025-01-27
 * @license      Propriétaire - SalamBot Team
 *
 * 🎯 Spécialité: Textes Darija en translittération + script arabe
 */

import { SupportedScript } from './types';

/**
 * Résultat de l'analyse bi-script
 */
export interface BiScriptAnalysisResult {
  /** Script dominant détecté */
  dominantScript: SupportedScript;
  /** Ratio de caractères latins (0-1) */
  latinRatio: number;
  /** Ratio de caractères arabes (0-1) */
  arabicRatio: number;
  /** Ratio de caractères numériques (0-1) */
  numericRatio: number;
  /** Ratio d'autres caractères (0-1) */
  otherRatio: number;
  /** Tokens contenant un mélange de scripts */
  mixedTokens: string[];
  /** Indique si le texte est bi-script */
  isBiScript: boolean;
  /** Patterns de translittération détectés */
  transliterationPatterns: string[];
}

/**
 * Patterns de translittération Darija courants
 */
const TRANSLITERATION_PATTERNS = [
  // Patterns phonétiques Darija -> Latin
  { arabic: /خ/g, latin: /kh/gi, pattern: 'kh' },
  { arabic: /غ/g, latin: /gh/gi, pattern: 'gh' },
  { arabic: /ش/g, latin: /ch/gi, pattern: 'ch' },
  { arabic: /ج/g, latin: /j/gi, pattern: 'j' },
  { arabic: /ع/g, latin: /3/gi, pattern: '3' },
  { arabic: /ح/g, latin: /7/gi, pattern: '7' },
  { arabic: /ق/g, latin: /9/gi, pattern: '9' },
  { arabic: /ض/g, latin: /d/gi, pattern: 'd' },
  { arabic: /ط/g, latin: /t/gi, pattern: 't' },
  { arabic: /ظ/g, latin: /z/gi, pattern: 'z' },
  
  // Voyelles longues
  { arabic: /ا/g, latin: /a/gi, pattern: 'a' },
  { arabic: /و/g, latin: /ou|w/gi, pattern: 'ou' },
  { arabic: /ي/g, latin: /i|y/gi, pattern: 'i' },
  
  // Patterns spécifiques Darija
  { arabic: /لا/g, latin: /la/gi, pattern: 'la' },
  { arabic: /ما/g, latin: /ma/gi, pattern: 'ma' },
  { arabic: /هاد/g, latin: /had/gi, pattern: 'had' },
  { arabic: /واش/g, latin: /wach/gi, pattern: 'wach' }
];

/**
 * Analyseur bi-script pour textes Darija
 */
export class BiScriptAnalyzer {
  /**
   * Analyse un texte pour détecter les scripts utilisés
   * @param text Texte à analyser
   * @returns Résultat détaillé de l'analyse
   */
  analyze(text: string): BiScriptAnalysisResult {
    const cleanText = this.preprocessText(text);
    const tokens = this.tokenize(cleanText);
    
    // Analyse des caractères par script
    const scriptStats = this.analyzeCharacterScripts(cleanText);
    
    // Détection des tokens mixtes
    const mixedTokens = this.findMixedTokens(tokens);
    
    // Détection des patterns de translittération
    const transliterationPatterns = this.detectTransliterationPatterns(cleanText);
    
    // Détermination du script dominant
    const dominantScript = this.determineDominantScript(scriptStats);
    
    // Vérification si le texte est bi-script
    const isBiScript = this.isBiScriptText(scriptStats, mixedTokens);
    
    return {
      dominantScript,
      latinRatio: scriptStats.latin,
      arabicRatio: scriptStats.arabic,
      numericRatio: scriptStats.numeric,
      otherRatio: scriptStats.other,
      mixedTokens,
      isBiScript,
      transliterationPatterns
    };
  }
  
  /**
   * Préprocesse le texte pour l'analyse
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalise les espaces
      .trim();
  }
  
  /**
   * Tokenise le texte en mots
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }
  
  /**
   * Analyse la distribution des caractères par script
   */
  private analyzeCharacterScripts(text: string): {
    latin: number;
    arabic: number;
    numeric: number;
    other: number;
  } {
    const chars = Array.from(text);
    const totalChars = chars.length;
    
    if (totalChars === 0) {
      return { latin: 0, arabic: 0, numeric: 0, other: 0 };
    }
    
    let latinCount = 0;
    let arabicCount = 0;
    let numericCount = 0;
    let otherCount = 0;
    
    for (const char of chars) {
      const code = char.charCodeAt(0);
      
      if (this.isLatinChar(code)) {
        latinCount++;
      } else if (this.isArabicChar(code)) {
        arabicCount++;
      } else if (this.isNumericChar(code)) {
        numericCount++;
      } else if (char !== ' ') { // Ignore les espaces
        otherCount++;
      }
    }
    
    return {
      latin: latinCount / totalChars,
      arabic: arabicCount / totalChars,
      numeric: numericCount / totalChars,
      other: otherCount / totalChars
    };
  }
  
  /**
   * Vérifie si un caractère est latin
   */
  private isLatinChar(charCode: number): boolean {
    return (
      (charCode >= 0x0041 && charCode <= 0x005A) || // A-Z
      (charCode >= 0x0061 && charCode <= 0x007A) || // a-z
      (charCode >= 0x00C0 && charCode <= 0x024F) || // Latin Extended
      (charCode >= 0x1E00 && charCode <= 0x1EFF)    // Latin Extended Additional
    );
  }
  
  /**
   * Vérifie si un caractère est arabe
   */
  private isArabicChar(charCode: number): boolean {
    return (
      (charCode >= 0x0600 && charCode <= 0x06FF) || // Arabic
      (charCode >= 0x0750 && charCode <= 0x077F) || // Arabic Supplement
      (charCode >= 0x08A0 && charCode <= 0x08FF) || // Arabic Extended-A
      (charCode >= 0xFB50 && charCode <= 0xFDFF) || // Arabic Presentation Forms-A
      (charCode >= 0xFE70 && charCode <= 0xFEFF)    // Arabic Presentation Forms-B
    );
  }
  
  /**
   * Vérifie si un caractère est numérique
   */
  private isNumericChar(charCode: number): boolean {
    return (
      (charCode >= 0x0030 && charCode <= 0x0039) || // 0-9
      (charCode >= 0x0660 && charCode <= 0x0669)    // Arabic-Indic digits
    );
  }
  
  /**
   * Trouve les tokens contenant un mélange de scripts
   */
  private findMixedTokens(tokens: string[]): string[] {
    const mixedTokens: string[] = [];
    
    for (const token of tokens) {
      const hasLatin = /[a-zA-Z]/.test(token);
      const hasArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(token);
      
      if (hasLatin && hasArabic) {
        mixedTokens.push(token);
      }
    }
    
    return mixedTokens;
  }
  
  /**
   * Détecte les patterns de translittération
   */
  private detectTransliterationPatterns(text: string): string[] {
    const detectedPatterns: string[] = [];
    
    for (const pattern of TRANSLITERATION_PATTERNS) {
      const hasArabic = pattern.arabic.test(text);
      const hasLatin = pattern.latin.test(text);
      
      if (hasArabic || hasLatin) {
        detectedPatterns.push(pattern.pattern);
      }
    }
    
    return [...new Set(detectedPatterns)]; // Supprime les doublons
  }
  
  /**
   * Détermine le script dominant
   */
  private determineDominantScript(stats: {
    latin: number;
    arabic: number;
    numeric: number;
    other: number;
  }): SupportedScript {
    const threshold = 0.3; // Seuil minimum pour considérer un script dominant
    
    if (stats.latin > stats.arabic && stats.latin > threshold) {
      return stats.arabic > 0.1 ? 'mixed' : 'latin';
    }
    
    if (stats.arabic > stats.latin && stats.arabic > threshold) {
      return stats.latin > 0.1 ? 'mixed' : 'arabic';
    }
    
    if (stats.latin > 0.1 && stats.arabic > 0.1) {
      return 'mixed';
    }
    
    return 'unknown';
  }
  
  /**
   * Détermine si le texte est bi-script
   */
  private isBiScriptText(
    stats: { latin: number; arabic: number; numeric: number; other: number },
    mixedTokens: string[]
  ): boolean {
    const minScriptRatio = 0.1; // Ratio minimum pour considérer un script présent
    const hasSignificantLatin = stats.latin > minScriptRatio;
    const hasSignificantArabic = stats.arabic > minScriptRatio;
    const hasMixedTokens = mixedTokens.length > 0;
    
    return (hasSignificantLatin && hasSignificantArabic) || hasMixedTokens;
  }
  
  /**
   * Convertit un texte arabe en translittération latine (approximative)
   */
  convertArabicToLatin(text: string): string {
    let result = text;
    
    for (const pattern of TRANSLITERATION_PATTERNS) {
      result = result.replace(pattern.arabic, pattern.pattern);
    }
    
    return result;
  }
  
  /**
   * Détecte si un texte contient des patterns Darija bi-script typiques
   */
  detectDarijaBiScriptPatterns(text: string): {
    hasPatterns: boolean;
    patterns: string[];
    confidence: number;
  } {
    const patterns: string[] = [];
    let confidence = 0;
    
    // Patterns de code-switching typiques
    const codeSwitchPatterns = [
      /\b(ana|nta|nti)\s+[a-zA-Z]+/gi, // Pronoms arabes + mots latins
      /\b[a-zA-Z]+\s+(dyal|ta|li)\b/gi, // Mots latins + particules arabes
      /\b(bghit|bgha)\s+[a-zA-Z]+/gi,   // Verbes arabes + compléments latins
      /\b[a-zA-Z]+\s+(zwina?|mezyan)\b/gi // Adjectifs arabes après noms latins
    ];
    
    for (const pattern of codeSwitchPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        patterns.push(...matches);
        confidence += matches.length * 0.2;
      }
    }
    
    // Patterns de translittération
    const translitPatterns = this.detectTransliterationPatterns(text);
    if (translitPatterns.length > 0) {
      patterns.push(...translitPatterns.map(p => `translit:${p}`));
      confidence += translitPatterns.length * 0.1;
    }
    
    return {
      hasPatterns: patterns.length > 0,
      patterns: [...new Set(patterns)],
      confidence: Math.min(confidence, 1.0)
    };
  }
}

/**
 * Instance par défaut de l'analyseur bi-script
 */
export const defaultBiScriptAnalyzer = new BiScriptAnalyzer();