import { __awaiter } from "tslib";
import darijaWords from './darija-ngrams.json';
/**
 * Détection de langue offline utilisant une liste de mots-clés
 *
 * @param text Texte à analyser
 * @returns Résultat de la détection
 */
export function detectLanguageOffline(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = performance.now();
        // Si le texte est vide, retourner unknown
        if (!text || text.trim() === '') {
            return {
                lang: 'unknown',
                confidence: 0,
                mode: 'offline',
                latency: 0,
                fallback: false
            };
        }
        // Normaliser le texte (minuscules, sans ponctuation)
        const normalizedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
        const words = normalizedText.split(/\s+/);
        // Détection basée sur l'alphabet arabe
        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(text)) {
            // Vérifier si c'est du darija en arabe
            const isDarija = containsDarijaWords(normalizedText);
            const endTime = performance.now();
            const latency = endTime - startTime;
            if (isDarija) {
                return {
                    lang: 'ar-ma',
                    confidence: 0.85,
                    mode: 'offline',
                    latency,
                    fallback: false
                };
            }
            else {
                return {
                    lang: 'ar',
                    confidence: 0.9,
                    mode: 'offline',
                    latency,
                    fallback: false
                };
            }
        }
        // Détection du français (présence de caractères accentués)
        const frenchPattern = /[àáâäæçèéêëîïôœùûüÿ]/i;
        if (frenchPattern.test(text)) {
            const endTime = performance.now();
            const latency = endTime - startTime;
            return {
                lang: 'fr',
                confidence: 0.9,
                mode: 'offline',
                latency,
                fallback: false
            };
        }
        // Détection du darija en alphabet latin
        const darijaLatinCount = countDarijaLatinWords(words);
        if (darijaLatinCount > 0) {
            const confidence = Math.min(0.85, 0.7 + (darijaLatinCount / words.length) * 0.3);
            const endTime = performance.now();
            const latency = endTime - startTime;
            return {
                lang: 'ar-ma',
                confidence,
                mode: 'offline',
                latency,
                fallback: false
            };
        }
        // Si aucune langue n'est détectée
        const endTime = performance.now();
        const latency = endTime - startTime;
        return {
            lang: 'unknown',
            confidence: 0.5,
            mode: 'offline',
            latency,
            fallback: false
        };
    });
}
/**
 * Vérifie si le texte contient des mots typiques du darija
 */
function containsDarijaWords(text) {
    const darijaPatterns = [
        'واش', 'غادي', 'ماشي', 'فين', 'دابا', 'بزاف',
        'مزيان', 'لابا', 'حيت', 'علاش', 'كيفاش'
    ];
    return darijaPatterns.some(pattern => text.includes(pattern));
}
/**
 * Compte le nombre de mots darija en alphabet latin dans le texte
 */
function countDarijaLatinWords(words) {
    const darijaLatinWords = darijaWords;
    let count = 0;
    for (const word of words) {
        if (darijaLatinWords.includes(word)) {
            count++;
        }
    }
    return count;
}
//# sourceMappingURL=index.js.map