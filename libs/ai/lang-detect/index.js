import { __awaiter } from "tslib";
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
export function detectLanguage(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        // Import dynamique pour éviter les dépendances circulaires
        const { detectLanguageImpl } = yield import('./implementation');
        return detectLanguageImpl(text, options);
    });
}
//# sourceMappingURL=index.js.map