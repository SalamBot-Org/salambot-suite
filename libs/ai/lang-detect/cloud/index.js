import { __awaiter } from "tslib";
import { detectWithGemini } from './gemini';
import { detectWithLlamaDarija } from './llamaDarija';
import { langDetectCache, generateCacheKey } from '../cache';
/**
 * Détection de langue cloud utilisant Gemini Pro et Llama 4 Darija
 * avec cache Redis (TTL 24h)
 *
 * @param text Texte à analyser
 * @returns Résultat de la détection
 */
export function detectLanguageCloud(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = performance.now();
        // Si le texte est vide, retourner unknown
        if (!text || text.trim() === '') {
            return {
                lang: 'unknown',
                confidence: 0,
                mode: 'cloud',
                latency: 0,
                fallback: false,
                source: 'cloud'
            };
        }
        try {
            // Vérifier d'abord dans le cache
            const cacheKey = generateCacheKey(text);
            const cachedResult = yield langDetectCache.get(cacheKey);
            // Si résultat en cache, le retourner directement
            if (cachedResult) {
                console.log('Cache hit for language detection');
                // Logger l'événement cache.hit via OpenTelemetry (à implémenter)
                // logger.log('lang.detect.cache.hit', { key: cacheKey });
                return Object.assign(Object.assign({}, cachedResult), { source: 'cloud' // Assurer que la source est bien 'cloud'
                 });
            }
            // Logger l'événement cloud.called via OpenTelemetry (à implémenter)
            // logger.log('lang.detect.cloud.called', { textLength: text.length });
            // Essayer d'abord avec Llama Darija pour la détection spécifique du darija
            const llamaResult = yield detectWithLlamaDarija(text);
            // Si Llama a détecté du darija avec confiance, utiliser ce résultat
            if (llamaResult && llamaResult.confidence >= 0.85) {
                // Mettre en cache le résultat
                yield langDetectCache.set(cacheKey, llamaResult);
                return llamaResult;
            }
            // Sinon, utiliser Gemini Pro pour la détection générale
            const geminiResult = yield detectWithGemini(text);
            // Si Llama a détecté du darija mais avec une confiance faible,
            // et que Gemini n'a pas détecté d'arabe avec une confiance élevée,
            // privilégier le résultat de Llama
            if (llamaResult && geminiResult.lang !== 'ar' && geminiResult.confidence < 0.95) {
                // Mettre en cache le résultat
                yield langDetectCache.set(cacheKey, llamaResult);
                return llamaResult;
            }
            // Mettre en cache le résultat de Gemini
            yield langDetectCache.set(cacheKey, geminiResult);
            return geminiResult;
        }
        catch (error) {
            console.error('Error in cloud detection:', error);
            // En cas d'erreur, retourner un résultat par défaut
            const endTime = performance.now();
            const latency = endTime - startTime;
            return {
                lang: 'unknown',
                confidence: 0,
                mode: 'cloud',
                latency,
                fallback: false,
                source: 'cloud'
            };
        }
    });
}
//# sourceMappingURL=index.js.map