import { __awaiter } from "tslib";
import { detectLanguageOffline } from './offline';
import { detectLanguageCloud } from './cloud';
import { traceFallback, traceDetectionResult } from './telemetry';
/**
 * Implémentation complète de la détection de langue avec fallback automatique
 *
 * @param text Texte à analyser
 * @param options Options de détection
 * @returns Promise avec le résultat de détection
 */
export function detectLanguageImpl(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        const { offline = false, timeout = 400 } = options;
        // Si le mode offline est explicitement demandé, utiliser uniquement la détection offline
        if (offline) {
            const offlineResult = yield detectLanguageOffline(text);
            // Ajouter le champ source
            const resultWithSource = Object.assign(Object.assign({}, offlineResult), { source: 'offline' });
            traceDetectionResult(resultWithSource);
            return resultWithSource;
        }
        // Sinon, tenter d'abord la détection cloud avec fallback vers offline
        try {
            // Utiliser Promise.race pour implémenter le timeout
            const cloudDetectionWithTimeout = Promise.race([
                detectLanguageCloud(text),
                new Promise((resolve) => {
                    setTimeout(() => resolve(undefined), timeout);
                })
            ]);
            const cloudResult = yield cloudDetectionWithTimeout;
            // Si le timeout a été atteint ou la confiance est faible, fallback vers offline
            if (!cloudResult || cloudResult.confidence < 0.85) {
                const reason = !cloudResult ? 'timeout' : 'low_confidence';
                traceFallback(reason);
                console.log(`Fallback to offline detection: ${reason}`);
                const offlineResult = yield detectLanguageOffline(text);
                const resultWithFallback = Object.assign(Object.assign({}, offlineResult), { fallback: true, source: 'offline' });
                traceDetectionResult(resultWithFallback);
                return resultWithFallback;
            }
            // Assurer que le champ source est bien défini
            const resultWithSource = Object.assign(Object.assign({}, cloudResult), { source: 'cloud' });
            traceDetectionResult(resultWithSource);
            return resultWithSource;
        }
        catch (error) {
            traceFallback('error', String(error));
            console.error('Error in cloud detection, falling back to offline', error);
            const offlineResult = yield detectLanguageOffline(text);
            const resultWithFallback = Object.assign(Object.assign({}, offlineResult), { fallback: true, source: 'offline' });
            traceDetectionResult(resultWithFallback);
            return resultWithFallback;
        }
    });
}
//# sourceMappingURL=implementation.js.map