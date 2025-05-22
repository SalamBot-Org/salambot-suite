import { __awaiter } from "tslib";
/**
 * Détecte la langue d'un texte en utilisant Gemini Pro via Genkit
 *
 * @param text Texte à analyser
 * @returns Résultat de la détection
 */
export function detectWithGemini(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = performance.now();
        try {
            // Simulation de l'appel à Gemini Pro (à remplacer par l'intégration réelle)
            // Dans l'implémentation réelle, nous utiliserons @genkit-ai/vertex ou l'API REST
            const result = yield simulateGeminiCall(text);
            const endTime = performance.now();
            const latency = endTime - startTime;
            return {
                lang: mapGeminiLangCode(result.lang),
                confidence: result.confidence,
                mode: 'cloud',
                latency,
                fallback: false,
                source: 'cloud'
            };
        }
        catch (error) {
            console.error('Error calling Gemini Pro:', error);
            throw error;
        }
    });
}
/**
 * Simulation temporaire de l'appel à Gemini Pro
 * À remplacer par l'intégration réelle avec @genkit-ai/vertex
 */
function simulateGeminiCall(text) {
    return __awaiter(this, void 0, void 0, function* () {
        // Simuler un délai réseau
        yield new Promise(resolve => setTimeout(resolve, 200));
        // Détection basée sur l'alphabet arabe
        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(text)) {
            return {
                lang: 'ar',
                confidence: 0.98
            };
        }
        // Détection du français
        const frenchPattern = /[àáâäæçèéêëîïôœùûüÿ]/i;
        const frenchWords = ['bonjour', 'merci', 'parler', 'conseiller', 'voudrais', 'j\'aimerais'];
        const hasFrenchWords = frenchWords.some(word => text.toLowerCase().includes(word));
        if (frenchPattern.test(text) || hasFrenchWords) {
            return {
                lang: 'fr',
                confidence: 0.97
            };
        }
        // Si aucune langue n'est détectée avec confiance
        return {
            lang: 'unknown',
            confidence: 0.5
        };
    });
}
/**
 * Convertit les codes de langue Gemini en codes standardisés
 */
function mapGeminiLangCode(geminiLang) {
    switch (geminiLang) {
        case 'fr':
            return 'fr';
        case 'ar':
            return 'ar';
        case 'unknown':
            return 'unknown';
        default:
            return 'unknown';
    }
}
//# sourceMappingURL=gemini.js.map