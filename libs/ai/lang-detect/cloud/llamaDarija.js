import { __awaiter } from "tslib";
/**
 * Détecte si un texte est en darija en utilisant Llama 4 fine-tuné
 *
 * @param text Texte à analyser
 * @returns Résultat de la détection
 */
export function detectWithLlamaDarija(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = performance.now();
        try {
            // Simulation de l'appel à Llama 4 Darija (à remplacer par l'intégration réelle)
            // Dans l'implémentation réelle, nous utiliserons le provider local Llama 4 8B
            const result = yield simulateLlamaCall(text);
            // Si ce n'est pas du darija, retourner null pour laisser Gemini gérer
            if (!result.isDarija) {
                return null;
            }
            const endTime = performance.now();
            const latency = endTime - startTime;
            return {
                lang: 'ar-ma',
                confidence: result.confidence,
                mode: 'cloud',
                latency,
                fallback: false,
                source: 'cloud'
            };
        }
        catch (error) {
            console.error('Error calling Llama Darija:', error);
            return null; // En cas d'erreur, laisser Gemini gérer
        }
    });
}
/**
 * Simulation temporaire de l'appel à Llama 4 Darija
 * À remplacer par l'intégration réelle avec le provider local
 */
function simulateLlamaCall(text) {
    return __awaiter(this, void 0, void 0, function* () {
        // Simuler un délai réseau
        yield new Promise(resolve => setTimeout(resolve, 150));
        // Liste de mots darija pour la simulation
        const darijaWords = [
            'wach', 'labas', 'kif', 'chno', 'smeetk', '3lik', '3ndek', 'mzyan', 'bghit',
            'khoya', 'sahbi', 'daba', 'zwin', 'bzaf', 'shwiya', 'fhemti', 'ma3reft',
            'wakha', 'yallah', 'safi', 'ghadi', 'mashi', 'kayn', 'fin', 'feen', 'mnin'
        ];
        // Normaliser le texte
        const normalizedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
        const words = normalizedText.split(/\s+/);
        // Compter les mots darija
        let darijaCount = 0;
        for (const word of words) {
            if (darijaWords.includes(word)) {
                darijaCount++;
            }
        }
        // Calculer la confiance basée sur le ratio de mots darija
        const ratio = words.length > 0 ? darijaCount / words.length : 0;
        const isDarija = ratio > 0.3;
        const confidence = isDarija ? 0.7 + (ratio * 0.3) : 0.5;
        return {
            isDarija,
            confidence: Math.min(confidence, 0.98)
        };
    });
}
//# sourceMappingURL=llamaDarija.js.map