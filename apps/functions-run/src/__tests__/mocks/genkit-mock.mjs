/**
 * Mock Genkit Service
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Service mock pour simuler les flows Genkit AI
 *              utilisé dans les tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import express from 'express';
import cors from 'cors';
// import { v4 as uuidv4 } from 'uuid'; // Unused import

// Configuration
const PORT = process.env.PORT || process.env.MOCK_GENKIT_PORT || 3001;
const RESPONSE_DELAY = parseInt(process.env.MOCK_RESPONSE_DELAY_MS || '100');
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || '5');
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || '2');

// Données mock pour les réponses AI
const mockResponses = {
  langDetect: {
    'ar': { language: 'ar', confidence: 0.95, dialect: 'darija' },
    'fr': { language: 'fr', confidence: 0.92, dialect: null },
    'en': { language: 'en', confidence: 0.89, dialect: null },
    'ary': { language: 'ary', confidence: 0.97, dialect: 'darija' },
    'default': { language: 'unknown', confidence: 0.1, dialect: null }
  },
  replies: {
    'ar': [
      'مرحبا! كيف يمكنني مساعدتك اليوم؟',
      'أهلا وسهلا! ما الذي تحتاج إليه؟',
      'السلام عليكم! كيف حالك؟'
    ],
    'ary': [
      'أهلا! كيفاش نقدر نعاونك؟',
      'مرحبا بيك! شنو بغيتي؟',
      'السلام! كيف راك؟'
    ],
    'fr': [
      'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      'Salut! Que puis-je faire pour vous?',
      'Bonsoir! En quoi puis-je vous être utile?'
    ],
    'en': [
      'Hello! How can I help you today?',
      'Hi there! What can I do for you?',
      'Good day! How may I assist you?'
    ],
    'default': [
      'Hello! I\'m here to help you.',
      'Hi! How can I assist you?',
      'Greetings! What do you need?'
    ]
  }
};

// Utilitaires
function simulateDelay() {
  return new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
}

function shouldSimulateError() {
  return Math.random() * 100 < ERROR_RATE;
}

function shouldSimulateTimeout() {
  return Math.random() * 100 < TIMEOUT_RATE;
}

function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return mockResponses.langDetect.default;
  }
  
  const lowerText = text.toLowerCase();
  
  // Détection simple basée sur des mots-clés
  if (/[أ-ي]/.test(text)) {
    // Contient des caractères arabes
    if (/\b(كيفاش|شنو|بغيتي|راك|واش|ديال|فين)\b/.test(lowerText)) {
      return mockResponses.langDetect['ary']; // Darija
    }
    return mockResponses.langDetect['ar']; // Arabe standard
  }
  
  if (/\b(bonjour|salut|comment|merci|au revoir|bonsoir)\b/.test(lowerText)) {
    return mockResponses.langDetect['fr'];
  }
  
  if (/\b(hello|hi|how|thank|goodbye|good)\b/.test(lowerText)) {
    return mockResponses.langDetect['en'];
  }
  
  return mockResponses.langDetect.default;
}

function generateReply(language, context = {}) {
  const replies = mockResponses.replies[language] || mockResponses.replies.default;
  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  
  return {
    text: randomReply,
    language: language,
    confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
    context: context,
    generatedAt: new Date().toISOString(),
    model: 'mock-ai-model-v1.0'
  };
}

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de simulation d'erreurs
app.use((req, res, next) => {
  // Simuler timeout
  if (shouldSimulateTimeout()) {
    console.log(`⏱️  [GENKIT-MOCK] Simulation timeout pour ${req.method} ${req.path}`);
    return; // Ne pas répondre = timeout
  }
  
  // Simuler erreur serveur
  if (shouldSimulateError()) {
    console.log(`❌ [GENKIT-MOCK] Simulation erreur 500 pour ${req.method} ${req.path}`);
    return res.status(500).json({
      error: 'Internal Server Error (simulated)',
      code: 'MOCK_AI_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 [GENKIT-MOCK] ${req.method} ${req.path}`);
  next();
});

// Route de santé
app.get('/health', async (req, res) => {
  await simulateDelay();
  res.json({
    status: 'healthy',
    service: 'genkit-mock',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-mock',
    flows: ['lang-detect-flow', 'reply-flow'],
    models: ['mock-ai-model-v1.0']
  });
});

app.get('/', async (req, res) => {
  await simulateDelay();
  res.json({
    message: 'SalamBot Genkit Mock Service',
    status: 'running',
    flows: {
      'lang-detect-flow': {
        endpoint: '/lang-detect-flow',
        method: 'POST',
        description: 'Détection de langue avec support Darija'
      },
      'reply-flow': {
        endpoint: '/reply-flow',
        method: 'POST',
        description: 'Génération de réponses multilingues'
      }
    },
    supportedLanguages: ['ar', 'ary', 'fr', 'en'],
    endpoints: [
      'GET /health',
      'POST /lang-detect-flow',
      'POST /reply-flow'
    ]
  });
});

// Flow de détection de langue
app.post('/lang-detect-flow', async (req, res) => {
  await simulateDelay();
  
  const { data } = req.body;
  
  if (!data || !data.text) {
    return res.status(400).json({
      error: 'Missing required field: data.text',
      code: 'MISSING_TEXT',
      timestamp: new Date().toISOString()
    });
  }
  
  const detection = detectLanguage(data.text);
  
  const response = {
    result: {
      language: detection.language,
      confidence: detection.confidence,
      dialect: detection.dialect,
      originalText: data.text,
      detectedAt: new Date().toISOString(),
      processingTime: RESPONSE_DELAY
    },
    metadata: {
      flowName: 'lang-detect-flow',
      model: 'mock-language-detector-v1.0',
      version: '1.0.0'
    }
  };
  
  console.log(`🔍 [GENKIT-MOCK] Détection langue: "${data.text}" -> ${detection.language} (${detection.confidence})`);
  
  res.json(response);
});

// Flow de génération de réponse
app.post('/reply-flow', async (req, res) => {
  await simulateDelay();
  
  const { data } = req.body;
  
  if (!data || !data.message) {
    return res.status(400).json({
      error: 'Missing required field: data.message',
      code: 'MISSING_MESSAGE',
      timestamp: new Date().toISOString()
    });
  }
  
  // Détecter la langue du message d'entrée
  const detection = detectLanguage(data.message);
  const targetLanguage = data.language || detection.language;
  
  // Générer une réponse
  const reply = generateReply(targetLanguage, {
    originalMessage: data.message,
    detectedLanguage: detection.language,
    requestedLanguage: data.language,
    userId: data.userId,
    conversationId: data.conversationId
  });
  
  const response = {
    result: {
      reply: reply.text,
      language: reply.language,
      confidence: reply.confidence,
      context: reply.context,
      generatedAt: reply.generatedAt,
      processingTime: RESPONSE_DELAY
    },
    metadata: {
      flowName: 'reply-flow',
      model: reply.model,
      version: '1.0.0',
      inputDetection: {
        language: detection.language,
        confidence: detection.confidence,
        dialect: detection.dialect
      }
    }
  };
  
  console.log(`💬 [GENKIT-MOCK] Réponse générée: "${data.message}" -> "${reply.text}" (${reply.language})`);
  
  res.json(response);
});

// Route pour les statistiques
app.get('/stats', async (req, res) => {
  await simulateDelay();
  res.json({
    service: 'genkit-mock',
    uptime: process.uptime(),
    requests: {
      total: Math.floor(Math.random() * 1000) + 100,
      langDetect: Math.floor(Math.random() * 500) + 50,
      reply: Math.floor(Math.random() * 500) + 50
    },
    performance: {
      averageResponseTime: RESPONSE_DELAY + 'ms',
      errorRate: ERROR_RATE + '%',
      timeoutRate: TIMEOUT_RATE + '%'
    },
    languages: {
      supported: ['ar', 'ary', 'fr', 'en'],
      mostDetected: 'ary',
      detectionAccuracy: '94.5%'
    },
    models: {
      languageDetector: 'mock-language-detector-v1.0',
      replyGenerator: 'mock-ai-model-v1.0'
    }
  });
});

// Route catch-all pour les endpoints non implémentés
app.all('*', async (req, res) => {
  await simulateDelay();
  res.status(404).json({
    error: 'Flow not found',
    code: 'FLOW_NOT_FOUND',
    path: req.path,
    method: req.method,
    availableFlows: [
      'POST /lang-detect-flow',
      'POST /reply-flow'
    ],
    availableEndpoints: [
      'GET /health',
      'GET /stats'
    ]
  });
});

// Gestion des erreurs Express
app.use((error, req, res) => {
  console.error(`❌ [GENKIT-MOCK] Erreur Express:`, error);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [GENKIT-MOCK] Service démarré sur http://localhost:${PORT}`);
  console.log(`🤖 [GENKIT-MOCK] Flows disponibles:`);
  console.log(`   - POST /lang-detect-flow (Détection de langue)`);
  console.log(`   - POST /reply-flow (Génération de réponses)`);
  console.log(`📊 [GENKIT-MOCK] Configuration:`);
  console.log(`   - Délai de réponse: ${RESPONSE_DELAY}ms`);
  console.log(`   - Taux d'erreur: ${ERROR_RATE}%`);
  console.log(`   - Taux de timeout: ${TIMEOUT_RATE}%`);
  console.log(`🌍 [GENKIT-MOCK] Langues supportées: ar, ary (Darija), fr, en`);
  console.log(`✅ [GENKIT-MOCK] Prêt pour les tests d'intégration`);
});

// Gestion de l'arrêt propre
function shutdown() {
  console.log('🛑 [GENKIT-MOCK] Arrêt en cours...');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ [GENKIT-MOCK] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ [GENKIT-MOCK] Unhandled Rejection:', reason);
  process.exit(1);
});