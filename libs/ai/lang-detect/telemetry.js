/**
 * Module d'instrumentation OpenTelemetry pour la détection de langue
 *
 * Ce module fournit des fonctions pour tracer les événements liés à la détection de langue
 * via OpenTelemetry, permettant un monitoring précis des performances et des comportements.
 */
/**
 * Implémentation simulée du logger OpenTelemetry
 * À remplacer par l'intégration réelle avec OpenTelemetry
 */
class SimulatedTelemetryLogger {
    logEvent(name, attributes) {
        console.log(`[OTel Event] ${name}`, attributes);
    }
    startSpan(name) {
        console.log(`[OTel Span Start] ${name}`);
        const startTime = performance.now();
        return {
            addAttribute(key, value) {
                console.log(`[OTel Span Attribute] ${key}=${value}`);
            },
            end(attributes) {
                const duration = performance.now() - startTime;
                console.log(`[OTel Span End] duration=${duration}ms`, attributes || {});
            }
        };
    }
}
// Instance singleton du logger
export const telemetry = new SimulatedTelemetryLogger();
/**
 * Trace un événement de détection de langue cloud
 * @param text Texte analysé
 */
export function traceCloudDetection(text) {
    telemetry.logEvent('lang.detect.cloud.called', {
        textLength: text.length,
        timestamp: new Date().toISOString()
    });
}
/**
 * Trace un événement de hit dans le cache
 * @param key Clé de cache
 * @param result Résultat de détection
 */
export function traceCacheHit(key, result) {
    telemetry.logEvent('lang.detect.cache.hit', {
        key,
        lang: result.lang,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
    });
}
/**
 * Trace un événement de fallback vers la détection offline
 * @param reason Raison du fallback (timeout, low_confidence, error)
 * @param details Détails supplémentaires
 */
export function traceFallback(reason, details) {
    telemetry.logEvent('lang.detect.fallback', {
        reason,
        details,
        timestamp: new Date().toISOString()
    });
}
/**
 * Trace un résultat de détection de langue
 * @param result Résultat de détection
 * @param source Source de la détection (cloud, offline)
 */
export function traceDetectionResult(result) {
    telemetry.logEvent('lang.detect.result', {
        lang: result.lang,
        confidence: result.confidence,
        mode: result.mode,
        latency: result.latency,
        fallback: result.fallback,
        source: result.source,
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=telemetry.js.map