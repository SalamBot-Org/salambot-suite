/**
 * @file        Tests unitaires pour le connecteur WhatsApp de SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifySignature } from '../src/verifySignature';
import { handleWebhookVerification, handleWebhookMessages } from '../src/webhookHandler';
import axios from 'axios';
import crypto from 'crypto';

// Mock des modules externes
vi.mock('axios');
vi.mock('@opentelemetry/api', () => {
  return {
    trace: {
      getTracer: () => ({
        startSpan: () => ({
          setAttribute: () => {},
          end: () => {},
        }),
      }),
    },
  };
});

describe('WhatsApp Connector - Signature Verification', () => {
  it('devrait valider une signature correcte', () => {
    const appSecret = 'test_secret';
    const body = JSON.stringify({ test: 'data' });
    
    // Calculer une signature valide
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(body);
    const validSignature = 'sha256=' + hmac.digest('hex');
    
    expect(verifySignature(validSignature, body, appSecret)).toBe(true);
  });
  
  it('devrait rejeter une signature incorrecte', () => {
    const appSecret = 'test_secret';
    const body = JSON.stringify({ test: 'data' });
    const invalidSignature = 'sha256=invalid_signature';
    
    expect(verifySignature(invalidSignature, body, appSecret)).toBe(false);
  });
  
  it('devrait rejeter une signature absente', () => {
    const appSecret = 'test_secret';
    const body = JSON.stringify({ test: 'data' });
    
    expect(verifySignature(undefined, body, appSecret)).toBe(false);
  });
  
  it('devrait rejeter une signature sans préfixe sha256=', () => {
    const appSecret = 'test_secret';
    const body = JSON.stringify({ test: 'data' });
    
    // Calculer une signature valide mais sans préfixe
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(body);
    const invalidSignature = hmac.digest('hex');
    
    expect(verifySignature(invalidSignature, body, appSecret)).toBe(false);
  });
});

describe('WhatsApp Connector - Webhook Verification', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WA_VERIFY_TOKEN = 'valid_token';
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('devrait accepter une requête de vérification valide', async () => {
    const req = {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'valid_token',
        'hub.challenge': 'challenge_code'
      }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookVerification(req as any, res as any);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('challenge_code');
  });
  
  it('devrait rejeter une requête avec un token invalide', async () => {
    const req = {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'invalid_token',
        'hub.challenge': 'challenge_code'
      }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookVerification(req as any, res as any);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Invalid verification token');
  });
  
  it('devrait rejeter une requête avec des paramètres manquants', async () => {
    const req = {
      query: {
        'hub.mode': 'subscribe'
        // Paramètres manquants
      }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookVerification(req as any, res as any);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid verification parameters');
  });
});

describe('WhatsApp Connector - Message Processing', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.APP_SECRET = 'test_secret';
    process.env.CHAT_API_URL = 'http://localhost:3010/chat';
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('devrait traiter un message texte et appeler l\'API /chat', async () => {
    // Mock de la réponse de l'API /chat
    (axios.post as any).mockResolvedValueOnce({
      status: 200,
      data: {
        reply: 'Réponse du bot',
        lang: 'fr',
        confidence: 0.95,
        source: 'cloud'
      }
    });
    
    const textMessage = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          wa_id: '33612345678',
          profile: {
            name: 'Test User'
          }
        }
      ],
      messages: [
        {
          id: 'msg123',
          from: '33612345678',
          timestamp: '1652368986',
          type: 'text',
          text: {
            body: 'Bonjour, comment ça va?'
          }
        }
      ]
    };
    
    // Calculer une signature valide
    const body = JSON.stringify(textMessage);
    const hmac = crypto.createHmac('sha256', 'test_secret');
    hmac.update(body);
    const validSignature = 'sha256=' + hmac.digest('hex');
    
    const req = {
      headers: {
        'x-hub-signature-256': validSignature
      },
      body: textMessage
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookMessages(req as any, res as any);
    
    // Vérifier que la réponse est 200 OK
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('OK');
    
    // Vérifier que l'API /chat a été appelée avec les bons paramètres
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3010/chat', {
      message: 'Bonjour, comment ça va?',
      metadata: {
        channel: 'whatsapp',
        waFrom: '33612345678',
        isAudio: false
      }
    });
  });
  
  it('devrait traiter un message audio et stocker l\'ID audio', async () => {
    // Mock de la réponse de l'API /chat
    (axios.post as any).mockResolvedValueOnce({
      status: 200,
      data: {
        reply: 'J\'ai bien reçu votre message vocal',
        lang: 'fr',
        confidence: 0.95,
        source: 'cloud'
      }
    });
    
    const audioMessage = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          wa_id: '33612345678',
          profile: {
            name: 'Test User'
          }
        }
      ],
      messages: [
        {
          id: 'msg456',
          from: '33612345678',
          timestamp: '1652368986',
          type: 'audio',
          audio: {
            id: 'audio123',
            mime_type: 'audio/ogg'
          }
        }
      ]
    };
    
    // Calculer une signature valide
    const body = JSON.stringify(audioMessage);
    const hmac = crypto.createHmac('sha256', 'test_secret');
    hmac.update(body);
    const validSignature = 'sha256=' + hmac.digest('hex');
    
    const req = {
      headers: {
        'x-hub-signature-256': validSignature
      },
      body: audioMessage
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookMessages(req as any, res as any);
    
    // Vérifier que la réponse est 200 OK
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('OK');
    
    // Vérifier que l'API /chat a été appelée avec les bons paramètres
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3010/chat', {
      message: '[Message vocal reçu]',
      metadata: {
        channel: 'whatsapp',
        waFrom: '33612345678',
        isAudio: true,
        audioId: 'audio123'
      }
    });
  });
  
  it('devrait rejeter une requête avec une signature invalide', async () => {
    const textMessage = {
      messaging_product: 'whatsapp',
      contacts: [{ wa_id: '33612345678' }],
      messages: [
        {
          id: 'msg123',
          from: '33612345678',
          timestamp: '1652368986',
          type: 'text',
          text: { body: 'Test' }
        }
      ]
    };
    
    const req = {
      headers: {
        'x-hub-signature-256': 'sha256=invalid_signature'
      },
      body: textMessage
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookMessages(req as any, res as any);
    
    // Même avec une signature invalide, on répond 200 OK pour éviter les retentatives
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('OK');
    
    // Vérifier que l'API /chat n'a pas été appelée
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('devrait gérer correctement un message d\'escalade', async () => {
    // Mock de la réponse de l'API /chat avec escalade
    (axios.post as any).mockResolvedValueOnce({
      status: 200,
      data: {
        reply: 'Je vous mets en relation avec un agent.',
        lang: 'fr',
        confidence: 0.95,
        source: 'cloud'
      }
    });
    
    const textMessage = {
      messaging_product: 'whatsapp',
      contacts: [{ wa_id: '33612345678' }],
      messages: [
        {
          id: 'msg123',
          from: '33612345678',
          timestamp: '1652368986',
          type: 'text',
          text: { body: 'Je veux parler à un agent' }
        }
      ]
    };
    
    // Calculer une signature valide
    const body = JSON.stringify(textMessage);
    const hmac = crypto.createHmac('sha256', 'test_secret');
    hmac.update(body);
    const validSignature = 'sha256=' + hmac.digest('hex');
    
    const req = {
      headers: {
        'x-hub-signature-256': validSignature
      },
      body: textMessage
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    await handleWebhookMessages(req as any, res as any);
    
    // Vérifier que la réponse est 200 OK
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('OK');
    
    // Vérifier que l'API /chat a été appelée avec les bons paramètres
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3010/chat', {
      message: 'Je veux parler à un agent',
      metadata: {
        channel: 'whatsapp',
        waFrom: '33612345678',
        isAudio: false
      }
    });
  });
});
