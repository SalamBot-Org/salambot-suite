export interface LangResult {
  /**
   * Code de langue détectée
   * - 'fr' - Français
   * - 'ar' - Arabe standard
   * - 'ar-ma' - Darija (dialecte marocain)
   * - 'unknown' - Langue non reconnue
   */
  lang: 'fr' | 'ar' | 'ar-ma' | 'unknown';
  
  /**
   * Niveau de confiance de la détection (0.0 à 1.0)
   */
  confidence: number;
  
  /**
   * Mode de détection utilisé
   */
  mode: 'cloud' | 'offline';
  
  /**
   * Latence de détection en millisecondes
   */
  latency: number;
  
  /**
   * Indique si un fallback a été utilisé
   */
  fallback: boolean;
  
  /**
   * Source de la détection
   */
  source: 'cloud' | 'offline';
}

export interface DetectLanguageOptions {
  /**
   * Force l'utilisation du mode offline
   * @default false
   */
  offline?: boolean;
  
  /**
   * Timeout pour la détection cloud en millisecondes
   * @default 400
   */
  timeout?: number;
}

/**
 * Détecte la langue d'un texte avec fallback automatique cloud → offline
 * 
 * @param text Texte à analyser
 * @param options Options de détection (optionnel)
 * @returns Promise avec le résultat de détection
 * 
 * @example
 * ```typescript
 * const result = await detectLanguage("مرحبا بكم في المغرب");
 * // { lang: 'ar', confidence: 0.98, mode: 'cloud', latency: 320, fallback: false, source: 'cloud' }
 * 
 * const resultOffline = await detectLanguage("السلام عليكم", { offline: true });
 * // { lang: 'ar', confidence: 0.92, mode: 'offline', latency: 2, fallback: false, source: 'offline' }
 * 
 * const resultDarijaLatin = await detectLanguage("labas 3lik khouya");
 * // { lang: 'ar-ma', confidence: 0.85, mode: 'offline', latency: 1, fallback: true, source: 'offline' }
 * ```
 */
export async function detectLanguage(
  text: string,
  options: DetectLanguageOptions = {}
): Promise<LangResult> {
  // Import dynamique pour éviter les dépendances circulaires
  const { detectLanguageImpl } = await import('./implementation');
  return detectLanguageImpl(text, options);
}
