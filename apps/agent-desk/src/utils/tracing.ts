/**
 * @file        Utilitaire de traçage OpenTelemetry pour l'Agent Desk.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Tracer pour le composant Agent Desk
const tracer = trace.getTracer('salambot.agent-desk');

/**
 * Utilitaire pour créer des traces OpenTelemetry pour l'Agent Desk
 */
export const AgentTracing = {
  /**
   * Trace le chargement de l'historique des conversations
   * @param conversationId ID de la conversation (optionnel)
   * @param filters Filtres appliqués (optionnel)
   */
  historyLoad: (conversationId?: string, filters?: Record<string, any>) => {
    const span = tracer.startSpan('agent.history.load');
    
    if (conversationId) {
      span.setAttribute('conversation.id', conversationId);
    }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          span.setAttribute(`filter.${key}`, String(value));
        }
      });
    }
    
    span.end();
  },
  
  /**
   * Trace la visualisation d'une conversation spécifique
   * @param conversationId ID de la conversation
   * @param messageCount Nombre de messages dans la conversation
   */
  historyView: (conversationId: string, messageCount?: number) => {
    const span = tracer.startSpan('agent.history.view');
    
    span.setAttribute('conversation.id', conversationId);
    
    if (messageCount !== undefined) {
      span.setAttribute('conversation.message_count', messageCount);
    }
    
    span.end();
  },
  
  /**
   * Trace l'application de filtres sur l'historique
   * @param filters Filtres appliqués
   * @param resultCount Nombre de résultats après filtrage
   */
  historyFilter: (filters: Record<string, any>, resultCount: number) => {
    const span = tracer.startSpan('agent.history.filter');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        span.setAttribute(`filter.${key}`, String(value));
      }
    });
    
    span.setAttribute('result.count', resultCount);
    
    span.end();
  },
  
  /**
   * Trace une action générique avec gestion d'erreur
   * @param name Nom de la trace
   * @param attributes Attributs à ajouter à la trace
   * @param fn Fonction à exécuter dans le contexte de la trace
   * @returns Le résultat de la fonction
   */
  traceAction: async <T>(
    name: string,
    attributes: Record<string, any>,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const span = tracer.startSpan(name);
    
    // Ajouter les attributs
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, String(value));
      }
    });
    
    try {
      // Exécuter la fonction dans le contexte de la trace
      const result = await context.with(
        trace.setSpan(context.active(), span),
        fn
      );
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      span.end();
      throw error;
    }
  }
};
