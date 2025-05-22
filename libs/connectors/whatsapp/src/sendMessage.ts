/**
 * @file        Envoi de messages WhatsApp pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import axios from 'axios';
import { SendMessageRequest, SendMessageResponse } from './types';
import { trace } from '@opentelemetry/api';

// Tracer pour le composant WhatsApp
const tracer = trace.getTracer('salambot.connectors.whatsapp');

/**
 * Envoie un message texte à un utilisateur WhatsApp
 * 
 * @param to - Numéro WhatsApp du destinataire (format international)
 * @param message - Contenu du message à envoyer
 * @returns Promise<SendMessageResponse> - Réponse de l'API WhatsApp
 */
export async function sendMessage(to: string, message: string): Promise<SendMessageResponse | null> {
  const span = tracer.startSpan('wa.send.message');
  
  try {
    // Récupérer les variables d'environnement nécessaires
    const phoneId = process.env.WA_PHONE_ID;
    const accessToken = process.env.WA_ACCESS_TOKEN;
    
    if (!phoneId || !accessToken) {
      throw new Error('Missing required environment variables: WA_PHONE_ID or WA_ACCESS_TOKEN');
    }
    
    // Construire l'URL de l'API WhatsApp
    const apiUrl = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    
    // Construire la requête
    const requestBody: SendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    // Ajouter des attributs au span
    span.setAttribute('wa.send.message.to', to);
    span.setAttribute('wa.send.message.length', message.length);
    
    // Envoyer la requête à l'API WhatsApp
    const response = await axios.post<SendMessageResponse>(
      apiUrl,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Ajouter des attributs de succès au span
    span.setAttribute('wa.send.message.success', true);
    span.setAttribute('wa.send.message.message_id', response.data.messages[0].id);
    span.end();
    
    return response.data;
  } catch (error) {
    // Ajouter des attributs d'erreur au span
    span.setAttribute('wa.send.message.success', false);
    span.setAttribute('wa.send.message.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    // Propager l'erreur
    throw error;
  }
}
