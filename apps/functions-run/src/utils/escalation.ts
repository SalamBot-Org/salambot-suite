/**
 * @file        Utilitaire d'escalade pour le service Cloud Run SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { logger } from './logger';
import { getTracer } from './tracing';

// Tracer pour le composant d'escalade
const tracer = getTracer('escalation');

/**
 * Interface pour les métadonnées d'escalade
 */
export interface EscalationMetadata {
  conversationId?: string;
  userId?: string;
  channel?: 'web' | 'whatsapp' | 'voice';
  reason: 'keyword' | 'intent' | 'confidence' | 'explicit' | 'sla';
  priority?: 'low' | 'medium' | 'high';
  language?: 'fr' | 'ar' | 'ar-ma' | 'unknown';
}

/**
 * Fonction pour déclencher une escalade vers un agent humain
 */
export async function triggerEscalation(message: string, metadata: EscalationMetadata): Promise<boolean> {
  const span = tracer.startSpan('chat.escalation.process');
  
  try {
    // Ajouter les attributs au span
    span.setAttribute('escalation.conversation_id', metadata.conversationId || 'unknown');
    span.setAttribute('escalation.user_id', metadata.userId || 'unknown');
    span.setAttribute('escalation.channel', metadata.channel || 'unknown');
    span.setAttribute('escalation.reason', metadata.reason);
    span.setAttribute('escalation.priority', metadata.priority || 'medium');
    span.setAttribute('escalation.language', metadata.language || 'unknown');
    
    // Journaliser l'escalade
    logger.info({
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      metadata
    }, 'chat.escalation.triggered');
    
    // Simuler l'envoi à la file d'attente des agents
    // Dans une implémentation réelle, cela enverrait à une file d'attente ou à un webhook
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simuler une réponse positive
    return true;
  } catch (error) {
    // Journaliser l'erreur
    logger.error({ error, metadata }, 'Erreur lors de l\'escalade');
    
    // Ajouter l'erreur au span
    span.setAttribute('error', true);
    span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
    
    return false;
  } finally {
    span.end();
  }
}

/**
 * Fonction pour détecter si un message nécessite une escalade
 */
export function shouldEscalate(message: string): { escalate: boolean; reason: EscalationMetadata['reason'] } {
  // Mots-clés qui déclenchent une escalade
  const escalationKeywords = ['agent', 'humain', 'personne', 'وكيل', 'إنسان', 'شخص'];
  
  // Vérifier si le message contient un mot-clé d'escalade
  const lowerMessage = message.toLowerCase();
  for (const keyword of escalationKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { escalate: true, reason: 'keyword' };
    }
  }
  
  // Vérifier si le message contient une demande explicite d'escalade
  if (
    lowerMessage.includes('parler à un') || 
    lowerMessage.includes('contacter un') || 
    lowerMessage.includes('أريد التحدث') ||
    lowerMessage.includes('بغيت نهضر')
  ) {
    return { escalate: true, reason: 'explicit' };
  }
  
  // Par défaut, pas d'escalade
  return { escalate: false, reason: 'keyword' };
}
