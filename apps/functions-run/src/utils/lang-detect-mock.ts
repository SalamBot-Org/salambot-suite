/**
 * @file        Mock local du module de détection de langue pour SalamBot Functions-Run.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { logger } from './logger';
import { getTracer } from './tracing';

// Tracer pour le composant de détection de langue
const tracer = getTracer('lang-detect');

export interface LangResult {
  lang: 'fr' | 'ar' | 'ar-ma' | 'unknown';
  confidence: number;
  mode: 'cloud' | 'offline';
  latency: number;
  fallback: boolean;
  source: 'cloud' | 'offline';
}

/**
 * Fonction mock pour la détection de langue
 * Simule le comportement de @salambot/ai/lang-detect
 */
export async function detectLanguage(text: string): Promise<LangResult> {
  const span = tracer.startSpan('lang.detect.process');
  span.setAttribute('lang.detect.text.length', text.length);
  
  try {
    // Simuler un délai réseau
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 300));
    const latency = Date.now() - startTime;
    
    // Mots-clés pour la détection
    const frKeywords = ['bonjour', 'merci', 'comment', 'salut', 'je', 'tu', 'nous', 'vous', 'problème', 'commande', 'agent'];
    const arKeywords = ['مرحبا', 'شكرا', 'كيف', 'السلام', 'أنا', 'أنت', 'نحن', 'أنتم', 'مشكلة', 'طلب', 'وكيل'];
    const darijaKeywords = ['labas', 'wach', 'chno', 'kifach', '3lik', 'bghit', 'dyal', 'zwin', 'mochkil', 'commande', 'agent'];
    
    // Convertir en minuscules pour la comparaison
    const lowerText = text.toLowerCase();
    
    // Compter les occurrences de mots-clés
    let frCount = 0;
    let arCount = 0;
    let darijaCount = 0;
    
    frKeywords.forEach(word => {
      if (lowerText.includes(word)) frCount++;
    });
    
    arKeywords.forEach(word => {
      if (lowerText.includes(word)) arCount++;
    });
    
    darijaKeywords.forEach(word => {
      if (lowerText.includes(word)) darijaCount++;
    });
    
    // Simuler une décision de fallback basée sur la latence
    const useCloud = latency < 400;
    const fallback = !useCloud;
    
    // Déterminer la langue en fonction du nombre de mots-clés trouvés
    let result: LangResult;
    
    if (frCount > arCount && frCount > darijaCount) {
      result = {
        lang: 'fr',
        confidence: 0.8 + (frCount * 0.05),
        mode: useCloud ? 'cloud' : 'offline',
        latency,
        fallback,
        source: useCloud ? 'cloud' : 'offline'
      };
    } else if (arCount > frCount && arCount > darijaCount) {
      result = {
        lang: 'ar',
        confidence: 0.85 + (arCount * 0.03),
        mode: useCloud ? 'cloud' : 'offline',
        latency,
        fallback,
        source: useCloud ? 'cloud' : 'offline'
      };
    } else if (darijaCount > 0) {
      result = {
        lang: 'ar-ma',
        confidence: 0.75 + (darijaCount * 0.05),
        mode: 'offline',  // Darija toujours en offline
        latency: 50,
        fallback: true,
        source: 'offline'
      };
    } else {
      // Si aucun mot-clé n'est trouvé ou texte vide
      result = {
        lang: 'unknown',
        confidence: 0.5,
        mode: 'offline',
        latency: 10,
        fallback: true,
        source: 'offline'
      };
    }
    
    // Journaliser le résultat
    logger.debug({
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      result
    }, 'lang.detect.result');
    
    // Ajouter les attributs au span
    span.setAttribute('lang.detect.lang', result.lang);
    span.setAttribute('lang.detect.confidence', result.confidence);
    span.setAttribute('lang.detect.mode', result.mode);
    span.setAttribute('lang.detect.latency', result.latency);
    span.setAttribute('lang.detect.fallback', result.fallback);
    span.setAttribute('lang.detect.source', result.source);
    
    return result;
  } catch (error) {
    // Journaliser l'erreur
    logger.error({ error }, 'Erreur lors de la détection de langue');
    
    // Ajouter l'erreur au span
    span.setAttribute('error', true);
    span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
    
    // Retourner une valeur par défaut en cas d'erreur
    return {
      lang: 'unknown',
      confidence: 0,
      mode: 'offline',
      latency: 0,
      fallback: true,
      source: 'offline'
    };
  } finally {
    span.end();
  }
}
