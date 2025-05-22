/**
 * @file        Gestionnaire de webhook WhatsApp pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Request, Response, Router } from 'express';
import { verifySignature } from './verifySignature';
import { WebhookVerificationSchema, TextMessageSchema, AudioMessageSchema } from './types';
import { sendMessage } from './sendMessage';
import { downloadAudioMedia, uploadToS3 } from './audioDownloader';
import { transcribeAudio, detectLanguage } from './audioTranscription';
import axios from 'axios';
import { trace } from '@opentelemetry/api';

// Tracer pour le composant WhatsApp
const tracer = trace.getTracer('salambot.connectors.whatsapp');

// Créer le router
export const whatsappRouter = Router();

/**
 * Gestionnaire pour la vérification du webhook (GET)
 */
export async function handleWebhookVerification(req: Request, res: Response) {
  const span = tracer.startSpan('wa.webhook.verify');
  
  try {
    // Valider les paramètres de requête avec le schéma Zod
    const result = WebhookVerificationSchema.safeParse(req.query);
    
    if (!result.success) {
      span.setAttribute('wa.webhook.verify.success', false);
      span.setAttribute('wa.webhook.verify.error', 'invalid_params');
      span.end();
      
      return res.status(400).send('Invalid verification parameters');
    }
    
    const { 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = result.data;
    
    // Vérifier le token avec la variable d'environnement
    const expectedToken = process.env.WA_VERIFY_TOKEN;
    
    if (!expectedToken || verifyToken !== expectedToken) {
      span.setAttribute('wa.webhook.verify.success', false);
      span.setAttribute('wa.webhook.verify.error', 'invalid_token');
      span.end();
      
      return res.status(403).send('Invalid verification token');
    }
    
    // Si le token est valide, renvoyer le challenge
    span.setAttribute('wa.webhook.verify.success', true);
    span.end();
    
    return res.status(200).send(challenge);
  } catch (error) {
    span.setAttribute('wa.webhook.verify.success', false);
    span.setAttribute('wa.webhook.verify.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    return res.status(500).send('Internal server error');
  }
}

/**
 * Gestionnaire pour la réception des messages (POST)
 */
export async function handleWebhookMessages(req: Request, res: Response) {
  const span = tracer.startSpan('wa.webhook.message');
  
  try {
    // Vérifier la signature X-Hub-Signature-256
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = req.body; // Express.json() a déjà parsé le corps
    const appSecret = process.env.APP_SECRET || '';
    
    // Reconvertir le corps en JSON string pour la vérification
    const bodyString = JSON.stringify(rawBody);
    
    const isSignatureValid = verifySignature(signature, bodyString, appSecret);
    
    if (!isSignatureValid) {
      span.setAttribute('wa.webhook.message.success', false);
      span.setAttribute('wa.webhook.message.error', 'invalid_signature');
      span.end();
      
      return res.status(403).send('Invalid signature');
    }
    
    // Répondre immédiatement avec 200 OK pour respecter les exigences de Meta
    // (traitement asynchrone en arrière-plan)
    res.status(200).send('OK');
    
    // Traiter le message en arrière-plan
    processWebhookMessage(rawBody, span);
    
    return;
  } catch (error) {
    span.setAttribute('wa.webhook.message.success', false);
    span.setAttribute('wa.webhook.message.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    // Même en cas d'erreur, on répond 200 OK pour éviter les retentatives de Meta
    return res.status(200).send('OK');
  }
}

/**
 * Traite un message WhatsApp reçu
 */
async function processWebhookMessage(body: any, parentSpan: any) {
  const span = tracer.startSpan('wa.process.message', { parent: parentSpan });
  
  try {
    // Vérifier si c'est un message texte
    const textResult = TextMessageSchema.safeParse(body);
    
    if (textResult.success) {
      await processTextMessage(textResult.data, span);
      return;
    }
    
    // Vérifier si c'est un message audio
    const audioResult = AudioMessageSchema.safeParse(body);
    
    if (audioResult.success) {
      await processAudioMessage(audioResult.data, span);
      return;
    }
    
    // Si le message n'est ni texte ni audio, on l'ignore
    span.setAttribute('wa.process.message.success', false);
    span.setAttribute('wa.process.message.error', 'unsupported_message_type');
    span.end();
    
  } catch (error) {
    span.setAttribute('wa.process.message.success', false);
    span.setAttribute('wa.process.message.error', error instanceof Error ? error.message : 'unknown');
    span.end();
  }
}

/**
 * Traite un message texte WhatsApp
 */
async function processTextMessage(message: any, parentSpan: any) {
  const span = tracer.startSpan('wa.process.text', { parent: parentSpan });
  
  try {
    // Extraire les informations du message
    const { from, text } = message.messages[0];
    const textContent = text.body;
    
    span.setAttribute('wa.message.from', from);
    span.setAttribute('wa.message.text', textContent);
    span.setAttribute('wa.message.type', 'text');
    
    // Construire la requête pour l'API /chat
    const chatRequest = {
      message: textContent,
      metadata: {
        channel: 'whatsapp',
        waFrom: from,
        isAudio: false
      }
    };
    
    // Appeler l'API /chat
    const chatResponse = await callChatAPI(chatRequest, span);
    
    // Envoyer la réponse à l'utilisateur WhatsApp
    if (chatResponse) {
      await sendMessage(from, chatResponse.reply);
      
      span.setAttribute('wa.process.text.success', true);
      span.end();
    } else {
      throw new Error('Failed to get response from chat API');
    }
  } catch (error) {
    span.setAttribute('wa.process.text.success', false);
    span.setAttribute('wa.process.text.error', error instanceof Error ? error.message : 'unknown');
    span.end();
  }
}

/**
 * Traite un message audio WhatsApp
 */
async function processAudioMessage(message: any, parentSpan: any) {
  const span = tracer.startSpan('wa.process.audio', { parent: parentSpan });
  
  try {
    // Extraire les informations du message
    const { from, audio } = message.messages[0];
    const audioId = audio.id;
    
    span.setAttribute('wa.message.from', from);
    span.setAttribute('wa.message.audio.id', audioId);
    span.setAttribute('wa.message.type', 'audio');
    
    // Télécharger le fichier audio
    span.addEvent('Downloading audio file');
    const audioFilePath = await downloadAudioMedia(audioId);
    
    // Optionnel: Simuler l'upload vers S3 (pour préparation future)
    if (process.env.ENABLE_S3_UPLOAD === 'true') {
      span.addEvent('Uploading to S3');
      await uploadToS3(audioFilePath);
    }
    
    // Transcrire l'audio en texte
    span.addEvent('Transcribing audio');
    const transcriptionResult = await transcribeAudio(audioFilePath);
    
    // Vérifier si la langue a été détectée par Whisper
    // Si non, utiliser le service de détection de langue
    let finalLang = transcriptionResult.lang;
    let finalConfidence = transcriptionResult.confidence;
    
    if (finalLang === 'unknown' || finalConfidence < 0.7) {
      span.addEvent('Detecting language from transcript');
      const langResult = await detectLanguage(transcriptionResult.transcript);
      finalLang = langResult.lang;
      finalConfidence = langResult.confidence;
    }
    
    // Construire la requête pour l'API /chat avec le transcript
    const chatRequest = {
      message: transcriptionResult.transcript,
      metadata: {
        channel: 'whatsapp',
        waFrom: from,
        isAudio: true,
        audioId: audioId,
        audioTranscript: {
          text: transcriptionResult.transcript,
          lang: finalLang,
          confidence: finalConfidence
        }
      }
    };
    
    span.setAttribute('wa.audio.transcript', transcriptionResult.transcript);
    span.setAttribute('wa.audio.lang', finalLang);
    span.setAttribute('wa.audio.confidence', finalConfidence);
    
    // Appeler l'API /chat
    span.addEvent('Calling chat API with transcript');
    const chatResponse = await callChatAPI(chatRequest, span);
    
    // Envoyer la réponse à l'utilisateur WhatsApp
    if (chatResponse) {
      span.addEvent('Sending response to user');
      await sendMessage(from, chatResponse.reply);
      
      span.setAttribute('wa.process.audio.success', true);
      span.end();
    } else {
      throw new Error('Failed to get response from chat API');
    }
  } catch (error) {
    span.setAttribute('wa.process.audio.success', false);
    span.setAttribute('wa.process.audio.error', error instanceof Error ? error.message : 'unknown');
    span.end();
  }
}

/**
 * Appelle l'API /chat avec la requête spécifiée
 */
async function callChatAPI(request: any, parentSpan: any) {
  const span = tracer.startSpan('wa.call.chat', { parent: parentSpan });
  
  try {
    // URL de l'API /chat (configurable via variable d'environnement)
    const chatApiUrl = process.env.CHAT_API_URL || 'http://localhost:3010/chat';
    
    span.setAttribute('wa.call.chat.url', chatApiUrl);
    
    // Appeler l'API /chat
    const response = await axios.post(chatApiUrl, request);
    
    span.setAttribute('wa.call.chat.success', true);
    span.setAttribute('wa.call.chat.status', response.status);
    span.end();
    
    return response.data;
  } catch (error) {
    span.setAttribute('wa.call.chat.success', false);
    span.setAttribute('wa.call.chat.error', error instanceof Error ? error.message : 'unknown');
    span.end();
    
    return null;
  }
}

// Configurer les routes
whatsappRouter.get('/webhook', handleWebhookVerification);
whatsappRouter.post('/webhook', handleWebhookMessages);
