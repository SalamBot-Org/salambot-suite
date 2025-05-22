/**
 * @file        Route /chat avec persistance des conversations pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-21
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { detectLanguage } from '../utils/lang-detect-mock';
import { shouldEscalate, triggerEscalation } from '../utils/escalation';
import { runReplyFlow } from '../genkit/reply-flow';
import { 
  conversationRepository, 
  Conversation, 
  Message, 
  ConversationStatus, 
  Channel, 
  MessageRole, 
  MessageSource 
} from '@salambot/persistence/conversation';

// Créer le router
export const chatRouter = Router();

// Tracer pour le composant chat
const tracer = getTracer('chat');

// Schéma de validation pour la requête
const chatRequestSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide"),
  metadata: z.object({
    conversationId: z.string().optional(),
    userId: z.string().optional(),
    channel: z.enum(['web', 'whatsapp', 'voice']).optional(),
    forceModel: z.string().optional(),
  }).optional(),
});

// Schéma de validation pour la réponse
const chatResponseSchema = z.object({
  reply: z.string(),
  lang: z.enum(['fr', 'ar', 'ar-ma', 'unknown']),
  confidence: z.number(),
  source: z.enum(['cloud', 'offline']),
  modelUsed: z.string().optional(),
  conversationId: z.string(),
});

// Route POST /chat
chatRouter.post('/', async (req, res) => {
  // Créer un span pour cette requête
  const span = tracer.startSpan('chat.flow.start');
  
  try {
    // Valider la requête
    const validationResult = chatRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn({ 
        errors: validationResult.error.errors,
        body: req.body 
      }, 'Validation de la requête échouée');
      
      span.setAttribute('chat.validation.success', false);
      span.end();
      
      return res.status(400).json({ 
        error: 'Requête invalide',
        details: validationResult.error.errors 
      });
    }
    
    const { message, metadata } = validationResult.data;
    
    // Journaliser la requête entrante
    logger.info({ 
      message, 
      metadata,
      timestamp: new Date().toISOString()
    }, 'chat.incoming');
    
    span.setAttribute('chat.message', message);
    span.setAttribute('chat.metadata.conversationId', metadata?.conversationId || 'none');
    span.setAttribute('chat.metadata.channel', metadata?.channel || 'unknown');
    
    // Détecter la langue
    const langSpan = tracer.startSpan('lang.detection');
    let langResult;
    
    try {
      langResult = await detectLanguage(message);
      
      langSpan.setAttribute('lang.detected', langResult.lang);
      langSpan.setAttribute('lang.confidence', langResult.confidence);
      langSpan.setAttribute('lang.source', langResult.source);
      langSpan.setAttribute('lang.fallback', langResult.fallback);
      
      logger.info({
        lang: langResult.lang,
        confidence: langResult.confidence,
        source: langResult.source,
        fallback: langResult.fallback
      }, 'lang.detected');
    } catch (error) {
      logger.error({ error }, 'Erreur lors de la détection de langue');
      langSpan.setAttribute('error', true);
      langSpan.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      
      // Définir une valeur par défaut en cas d'échec
      langResult = {
        lang: 'unknown',
        confidence: 0,
        mode: 'offline',
        latency: 0,
        fallback: true,
        source: 'offline'
      };
    } finally {
      langSpan.end();
    }
    
    // Récupérer ou créer une conversation
    const persistSpan = tracer.startSpan('chat.persist');
    let conversation: Conversation;
    let isNewConversation = false;
    
    try {
      // Vérifier si un ID de conversation est fourni
      if (metadata?.conversationId) {
        // Récupérer la conversation existante
        const existingConversation = await conversationRepository.getConversation(metadata.conversationId);
        
        if (existingConversation) {
          conversation = existingConversation;
          persistSpan.setAttribute('conversation.found', true);
        } else {
          // Si l'ID fourni n'existe pas, créer une nouvelle conversation
          isNewConversation = true;
          persistSpan.setAttribute('conversation.found', false);
        }
      } else {
        // Aucun ID fourni, créer une nouvelle conversation
        isNewConversation = true;
      }
      
      // Créer une nouvelle conversation si nécessaire
      if (isNewConversation) {
        const newConversationSpan = tracer.startSpan('chat.persist.conversation.created');
        
        // Déterminer le canal
        const channel = metadata?.channel || 'web';
        
        // Créer la conversation
        conversation = await conversationRepository.createConversation({
          userId: metadata?.userId,
          channel: channel as Channel,
          lang: langResult.lang,
          status: ConversationStatus.ACTIVE,
          startedAt: new Date(),
          lastMessageAt: new Date(),
          metadata: {
            userInfo: {},
            tags: [],
            priority: 'medium'
          }
        });
        
        newConversationSpan.setAttribute('conversation.id', conversation.id);
        newConversationSpan.setAttribute('conversation.channel', channel);
        newConversationSpan.end();
        
        logger.info({
          conversationId: conversation.id,
          channel,
          lang: langResult.lang
        }, 'chat.conversation.created');
      }
      
      // Ajouter le message de l'utilisateur à la conversation
      const userMessageSpan = tracer.startSpan('chat.persist.message');
      userMessageSpan.setAttribute('message.role', 'user');
      
      const userMessage = await conversationRepository.addMessage({
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: message,
        lang: langResult.lang,
        timestamp: new Date(),
        source: metadata?.isAudio ? MessageSource.AUDIO : MessageSource.CHAT,
        metadata: {
          confidence: langResult.confidence,
          ...metadata
        }
      });
      
      userMessageSpan.setAttribute('message.id', userMessage.id);
      userMessageSpan.end();
      
      persistSpan.setAttribute('conversation.id', conversation.id);
    } catch (error) {
      logger.error({ error }, 'Erreur lors de la persistance de la conversation');
      persistSpan.setAttribute('chat.persist.fail', true);
      persistSpan.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      
      // Continuer le traitement même en cas d'erreur de persistance
    } finally {
      persistSpan.end();
    }
    
    // Générer une réponse via Genkit
    const replySpan = tracer.startSpan('chat.llm.reply.generated');
    
    // Appeler le flow Genkit pour générer une réponse
    const replyResult = await runReplyFlow({
      message,
      lang: langResult.lang,
      forceModel: metadata?.forceModel,
      metadata: {
        ...metadata,
        conversationId: conversation?.id
      }
    });
    
    // Récupérer la réponse générée
    let reply = replyResult.reply;
    let escalated = false;
    
    // Vérifier si une escalade est nécessaire
    const { escalate, reason } = shouldEscalate(message);
    
    if (escalate) {
      const escalationSpan = tracer.startSpan('chat.escalation.triggered');
      escalated = true;
      
      const escalationMetadata = {
        conversationId: conversation?.id,
        userId: metadata?.userId,
        channel: metadata?.channel || 'web',
        reason,
        priority: 'medium',
        language: langResult.lang
      };
      
      await triggerEscalation(message, escalationMetadata);
      
      // Mettre à jour le statut de la conversation
      if (conversation) {
        await conversationRepository.updateConversationStatus(
          conversation.id, 
          ConversationStatus.ESCALATED
        );
        
        // Mettre à jour les métadonnées de la conversation
        await conversationRepository.updateConversationMetadata(
          conversation.id,
          {
            escalation: {
              reason,
              timestamp: new Date(),
              priority: 'medium'
            }
          }
        );
      }
      
      logger.info({
        reason,
        message,
        conversationId: conversation?.id
      }, 'chat.escalation.triggered');
      
      reply += langResult.lang === 'fr' 
        ? " Je vous mets en relation avec un agent." 
        : langResult.lang === 'ar' 
          ? " سأقوم بتوصيلك بأحد وكلائنا." 
          : langResult.lang === 'ar-ma' 
            ? " غادي نوصلك مع واحد الوكيل ديالنا." 
            : " I'll connect you with an agent.";
      
      escalationSpan.end();
    }
    
    // Ajouter les attributs au span
    replySpan.setAttribute('chat.llm.reply.length', reply.length);
    replySpan.setAttribute('chat.llm.reply.model', replyResult.modelUsed);
    replySpan.setAttribute('chat.llm.reply.latency', replyResult.latency);
    replySpan.setAttribute('chat.llm.reply.cached', replyResult.cached || false);
    replySpan.end();
    
    // Persister la réponse du bot
    if (conversation) {
      const botMessageSpan = tracer.startSpan('chat.persist.message');
      botMessageSpan.setAttribute('message.role', 'bot');
      
      try {
        const botMessage = await conversationRepository.addMessage({
          conversationId: conversation.id,
          role: MessageRole.BOT,
          content: reply,
          lang: langResult.lang,
          timestamp: new Date(),
          source: MessageSource.CHAT,
          metadata: {
            modelUsed: replyResult.modelUsed,
            escalated,
            escalationReason: escalated ? reason : undefined
          }
        });
        
        botMessageSpan.setAttribute('message.id', botMessage.id);
      } catch (error) {
        logger.error({ error }, 'Erreur lors de la persistance de la réponse');
        botMessageSpan.setAttribute('chat.persist.fail', true);
        botMessageSpan.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        botMessageSpan.end();
      }
    }
    
    // Préparer la réponse
    const response = {
      reply,
      lang: langResult.lang,
      confidence: langResult.confidence,
      source: langResult.source,
      modelUsed: replyResult.modelUsed,
      conversationId: conversation?.id
    };
    
    // Journaliser la réponse
    logger.info({ 
      response,
      processingTime: Date.now() - new Date(req.headers['x-request-time'] as string || Date.now()).getTime()
    }, 'chat.response.sent');
    
    // Terminer le span principal
    span.setAttribute('chat.flow.success', true);
    span.end();
    
    // Envoyer la réponse
    return res.status(200).json(response);
    
  } catch (error) {
    // Journaliser l'erreur
    logger.error({ error }, 'Erreur lors du traitement de la requête chat');
    
    // Mettre à jour le span avec l'erreur
    span.setAttribute('error', true);
    span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    // Envoyer une réponse d'erreur
    return res.status(500).json({ 
      error: 'Erreur lors du traitement de la requête',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});
