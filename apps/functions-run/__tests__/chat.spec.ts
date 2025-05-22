/**
 * @file        Tests pour la route /chat avec intégration Genkit.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { chatRouter } from '../src/routes/chat';

// Mock des modules
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../src/utils/tracing', () => ({
  getTracer: () => ({
    startSpan: () => ({
      setAttribute: vi.fn(),
      end: vi.fn()
    })
  })
}));

vi.mock('../src/utils/lang-detect-mock', () => ({
  detectLanguage: vi.fn().mockImplementation(async (text) => {
    // Simuler la détection de langue basée sur le texte
    if (text.includes('bonjour') || text.includes('merci')) {
      return {
        lang: 'fr',
        confidence: 0.95,
        mode: 'cloud',
        latency: 150,
        fallback: false,
        source: 'cloud'
      };
    } else if (text.includes('مرحبا') || text.includes('شكرا')) {
      return {
        lang: 'ar',
        confidence: 0.92,
        mode: 'cloud',
        latency: 180,
        fallback: false,
        source: 'cloud'
      };
    } else if (text.includes('labas') || text.includes('wach')) {
      return {
        lang: 'ar-ma',
        confidence: 0.85,
        mode: 'offline',
        latency: 50,
        fallback: true,
        source: 'offline'
      };
    } else {
      return {
        lang: 'fr',
        confidence: 0.7,
        mode: 'offline',
        latency: 30,
        fallback: true,
        source: 'offline'
      };
    }
  })
}));

vi.mock('../src/utils/escalation', () => ({
  shouldEscalate: vi.fn().mockImplementation((message) => {
    return {
      escalate: message.includes('agent'),
      reason: message.includes('agent') ? 'explicit_request' : null
    };
  }),
  triggerEscalation: vi.fn().mockResolvedValue(true)
}));

vi.mock('../src/genkit/reply-flow', () => ({
  runReplyFlow: vi.fn().mockImplementation(async ({ message, lang }) => {
    // Simuler des réponses en fonction de la langue
    let reply = '';
    let modelUsed = '';
    
    switch (lang) {
      case 'fr':
        reply = 'Bonjour ! Je suis SalamBot, comment puis-je t\'aider aujourd\'hui ?';
        modelUsed = 'gemini-pro';
        break;
      case 'ar':
        reply = 'مرحبًا! أنا سلام بوت، كيف يمكنني مساعدتك اليوم؟';
        modelUsed = 'gemini-pro';
        break;
      case 'ar-ma':
        reply = 'Salam! Ana SalamBot, kifach n9der n3awnek lyoum?';
        modelUsed = 'llama-4-darija';
        break;
      default:
        reply = 'Hello! I am SalamBot, how can I help you today?';
        modelUsed = 'fallback';
    }
    
    return {
      reply,
      lang,
      modelUsed,
      latency: 350,
      cached: false
    };
  })
}));

// Configurer l'application Express pour les tests
const app = express();
app.use(express.json());
app.use('/chat', chatRouter);

describe('Route /chat avec Genkit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('devrait répondre en français avec Gemini Pro', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        message: 'Bonjour, comment ça va ?',
        metadata: {
          conversationId: 'test-123',
          channel: 'web'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
    expect(response.body).toHaveProperty('lang', 'fr');
    expect(response.body).toHaveProperty('modelUsed', 'gemini-pro');
    expect(response.body.reply).toContain('Bonjour');
  });
  
  it('devrait répondre en arabe avec Gemini Pro', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        message: 'مرحبا، كيف حالك؟',
        metadata: {
          conversationId: 'test-456',
          channel: 'web'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
    expect(response.body).toHaveProperty('lang', 'ar');
    expect(response.body).toHaveProperty('modelUsed', 'gemini-pro');
    expect(response.body.reply).toContain('مرحبًا');
  });
  
  it('devrait répondre en darija avec Llama 4', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        message: 'labas 3lik, wach kayn chi jdid?',
        metadata: {
          conversationId: 'test-789',
          channel: 'whatsapp'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
    expect(response.body).toHaveProperty('lang', 'ar-ma');
    expect(response.body).toHaveProperty('modelUsed', 'llama-4-darija');
    expect(response.body.reply).toContain('Salam');
  });
  
  it('devrait déclencher une escalade si le message contient "agent"', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        message: 'Bonjour, je voudrais parler à un agent s\'il vous plaît',
        metadata: {
          conversationId: 'test-escalation',
          channel: 'web'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
    expect(response.body.reply).toContain('agent');
    expect(response.body).toHaveProperty('lang', 'fr');
  });
  
  it('devrait forcer un modèle spécifique si demandé', async () => {
    // Réinitialiser le mock pour ce test spécifique
    const runReplyFlowMock = vi.mocked(require('../src/genkit/reply-flow').runReplyFlow);
    runReplyFlowMock.mockImplementationOnce(async ({ message, lang, forceModel }) => {
      return {
        reply: 'Réponse forcée via Llama',
        lang,
        modelUsed: forceModel || 'gemini-pro',
        latency: 200,
        cached: false
      };
    });
    
    const response = await request(app)
      .post('/chat')
      .send({
        message: 'Test avec modèle forcé',
        metadata: {
          conversationId: 'test-force-model',
          channel: 'web',
          forceModel: 'llama-4-darija'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('modelUsed', 'llama-4-darija');
    expect(response.body.reply).toContain('forcée');
  });
  
  it('devrait gérer les erreurs de validation', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        // Message manquant
        metadata: {
          conversationId: 'test-error'
        }
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
