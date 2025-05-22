import { detectLanguageOffline } from './offline';
import { detectLanguageCloud } from './cloud';
import { LangResult, DetectLanguageOptions } from './index';
import { traceFallback, traceDetectionResult } from './telemetry';

/**
 * Implémentation complète de la détection de langue avec fallback automatique
 * 
 * @param text Texte à analyser
 * @param options Options de détection
 * @returns Promise avec le résultat de détection
 */
export async function detectLanguageImpl(
  text: string,
  options: DetectLanguageOptions = {}
): Promise<LangResult> {
  const { offline = false, timeout = 400 } = options;
  
  // Si le mode offline est explicitement demandé, utiliser uniquement la détection offline
  if (offline) {
    const offlineResult = await detectLanguageOffline(text);
    // Ajouter le champ source
    const resultWithSource = {
      ...offlineResult,
      source: 'offline' as const
    };
    traceDetectionResult(resultWithSource);
    return resultWithSource;
  }
  
  // Sinon, tenter d'abord la détection cloud avec fallback vers offline
  try {
    // Utiliser Promise.race pour implémenter le timeout
    const cloudDetectionWithTimeout = Promise.race([
      detectLanguageCloud(text),
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), timeout);
      })
    ]);
    
    const cloudResult = await cloudDetectionWithTimeout as LangResult | undefined;
    
    // Si le timeout a été atteint ou la confiance est faible, fallback vers offline
    if (!cloudResult || cloudResult.confidence < 0.85) {
      const reason = !cloudResult ? 'timeout' : 'low_confidence';
      traceFallback(reason);
      console.log(`Fallback to offline detection: ${reason}`);
      
      const offlineResult = await detectLanguageOffline(text);
      const resultWithFallback = {
        ...offlineResult,
        fallback: true,
        source: 'offline' as const
      };
      traceDetectionResult(resultWithFallback);
      return resultWithFallback;
    }
    
    // Assurer que le champ source est bien défini
    const resultWithSource = {
      ...cloudResult,
      source: 'cloud' as const
    };
    traceDetectionResult(resultWithSource);
    return resultWithSource;
  } catch (error) {
    traceFallback('error', String(error));
    console.error('Error in cloud detection, falling back to offline', error);
    
    const offlineResult = await detectLanguageOffline(text);
    const resultWithFallback = {
      ...offlineResult,
      fallback: true,
      source: 'offline' as const
    };
    traceDetectionResult(resultWithFallback);
    return resultWithFallback;
  }
}
