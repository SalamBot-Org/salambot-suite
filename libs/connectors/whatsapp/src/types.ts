/**
 * @file        Types et schémas Zod pour le connecteur WhatsApp de SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { z } from 'zod';

// Schéma pour la vérification du webhook
export const WebhookVerificationSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string()
});

export type WebhookVerification = z.infer<typeof WebhookVerificationSchema>;

// Schéma pour les messages texte
export const TextMessageSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  contacts: z.array(
    z.object({
      wa_id: z.string(),
      profile: z.object({
        name: z.string().optional()
      }).optional()
    })
  ),
  messages: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      timestamp: z.string(),
      type: z.literal('text'),
      text: z.object({
        body: z.string()
      })
    })
  )
});

export type TextMessage = z.infer<typeof TextMessageSchema>;

// Schéma pour les messages audio
export const AudioMessageSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  contacts: z.array(
    z.object({
      wa_id: z.string(),
      profile: z.object({
        name: z.string().optional()
      }).optional()
    })
  ),
  messages: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      timestamp: z.string(),
      type: z.literal('audio'),
      audio: z.object({
        id: z.string(),
        mime_type: z.string()
      })
    })
  )
});

export type AudioMessage = z.infer<typeof AudioMessageSchema>;

// Schéma pour la requête à l'API /chat
export const ChatRequestSchema = z.object({
  message: z.string(),
  metadata: z.object({
    channel: z.literal('whatsapp'),
    waFrom: z.string(),
    isAudio: z.boolean().default(false),
    audioId: z.string().optional()
  })
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Schéma pour la réponse de l'API /chat
export const ChatResponseSchema = z.object({
  reply: z.string(),
  lang: z.enum(['fr', 'ar', 'ar-ma', 'unknown']),
  confidence: z.number(),
  source: z.enum(['cloud', 'offline'])
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Schéma pour l'envoi de message WhatsApp
export const SendMessageRequestSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string(),
  type: z.literal('text'),
  text: z.object({
    preview_url: z.boolean().optional(),
    body: z.string()
  })
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

// Schéma pour la réponse d'envoi de message WhatsApp
export const SendMessageResponseSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  contacts: z.array(
    z.object({
      input: z.string(),
      wa_id: z.string()
    })
  ),
  messages: z.array(
    z.object({
      id: z.string()
    })
  )
});

export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
