/**
 * @file        Configuration du tracing OpenTelemetry pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace } from '@opentelemetry/api';
import { logger } from './logger';

/**
 * Initialise le tracing OpenTelemetry pour le service
 */
export function initTracing() {
  try {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'salambot-functions-run',
        [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
      }),
    });

    // Configurer l'exportateur OTLP si l'URL est définie
    const otlpEndpoint = process.env.OTLP_ENDPOINT;
    if (otlpEndpoint) {
      const exporter = new OTLPTraceExporter({
        url: otlpEndpoint,
      });
      provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
      logger.info(`Tracing OpenTelemetry configuré avec endpoint: ${otlpEndpoint}`);
    } else {
      logger.warn('Variable OTLP_ENDPOINT non définie, tracing configuré sans exportateur');
    }

    // Enregistrer le provider
    provider.register();
    logger.info('Tracing OpenTelemetry initialisé avec succès');
  } catch (error) {
    logger.error({ error }, 'Erreur lors de l\'initialisation du tracing OpenTelemetry');
  }
}

/**
 * Obtient un tracer pour le composant spécifié
 */
export function getTracer(component: string) {
  return trace.getTracer(`salambot-functions-run.${component}`);
}
