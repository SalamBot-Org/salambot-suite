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
// Taux d'erreur réduit pour CI - plus stable en environnement Ubuntu
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || (process.env.CI ? '1' : '5'));
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || (process.env.CI ? '0' : '2'));

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

// Configuration avancée pour la détection de langue
const LANGUAGE_CONFIG = {
  patterns: {
    ary: {
      keywords: /\b(كيفاش|راك|ديال|بزاف|واخا|مزيان|هاد|داك|هادي|ديك|فين|علاش|إمتى|شنو|شكون|كيداير|كيدايرة|واش|ولا|غير|حتى|بلا|ماشي|أيوا|لا|نعم|بصح|صافي|زوين|قبيح|كبير|صغير|جديد|قديم|سخون|بارد|حلو|مر|ملح|حامض|أبيض|أسود|أحمر|أخضر|أزرق|أصفر|بني|وردي|بنفسجي|رمادي|برتقالي|دابا|غدا|البارح|اليوم|هاد|الأسبوع|هاد|الشهر|هاد|العام|الوقت|الساعة|الدقيقة|الثانية|الصباح|الظهر|العصر|المغرب|العشاء|الليل|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|الأحد)\b/gi,
      weight: 1.2,
      baseConfidence: 0.4
    },
    ar: {
      keywords: /\b(مرحبا|أهلا|كيف|حالك|شكرا|من|فضلك|نعم|لا|أين|متى|ماذا|كيف|لماذا|مع|السلامة|صباح|الخير|مساء|الله|يعطيك|العافية|تسلم|الحمد|لله|إن|شاء|الله|ما|شاء|الله|سبحان|الله|استغفر|الله|لا|إله|إلا|الله|محمد|رسول|الله|صلى|الله|عليه|وسلم|رضي|الله|عنه|رحمه|الله|بارك|الله|فيك|جزاك|الله|خيرا|أعوذ|بالله|من|الشيطان|الرجيم|بسم|الله|الرحمن|الرحيم|اليوم|غدا|أمس|الأسبوع|الشهر|السنة|الوقت|الساعة|الدقيقة|الثانية|الصباح|الظهر|العصر|المساء|الليل|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|الأحد)\b/gi,
      weight: 1.0,
      baseConfidence: 0.3
    },
    fr: {
      keywords: /\b(bonjour|salut|comment|allez|vous|merci|beaucoup|oui|non|où|quand|quoi|comment|pourquoi|avec|au|revoir|bonne|journée|bonsoir|bonne|nuit|s'il|vous|plaît|excusez|moi|pardon|désolé|ça|va|très|bien|mal|peut|être|certainement|probablement|jamais|toujours|souvent|parfois|rarement|maintenant|hier|demain|aujourd'hui|semaine|mois|année|temps|heure|minute|seconde|matin|midi|après|soir|nuit|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|alors|donc|mais|cependant|néanmoins|toutefois|pourtant|ainsi|ensuite|puis|enfin|d'abord|premièrement|deuxièmement|finalement)\b/gi,
      weight: 1.0,
      baseConfidence: 0.3
    },
    en: {
      keywords: /\b(hello|hi|how|are|you|thank|thanks|yes|no|where|when|what|how|why|with|goodbye|good|morning|afternoon|evening|night|please|excuse|me|sorry|fine|well|bad|maybe|certainly|probably|never|always|often|sometimes|rarely|now|yesterday|tomorrow|today|week|month|year|time|hour|minute|second|morning|noon|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday|then|so|but|however|nevertheless|yet|thus|next|finally|first|firstly|secondly|lastly|actually|really|basically|generally|specifically|particularly|especially|obviously|clearly|definitely|absolutely|probably|possibly|maybe|perhaps)\b/gi,
      weight: 1.0,
      baseConfidence: 0.3
    }
  },
  characterSets: {
    arabic: /[\u0600-\u06FF]/g,
    latin: /[a-zA-Z]/g,
    french: /[àâäéèêëïîôöùûüÿç]/g
  },
  minConfidence: 0.1,
  maxConfidence: 0.98
};

// Fonction améliorée pour détecter la langue
function detectLanguage(text, options = {}) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return mockResponses.langDetect.default;
  }

  const startTime = Date.now();
  const { includeDialects = true, confidenceThreshold = 0.5 } = options;
  
  const normalizedText = text.toLowerCase().trim();
  const candidates = [];

  // Analyse par mots-clés
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG.patterns)) {
    if (!includeDialects && lang === 'ary') continue;
    
    const matches = normalizedText.match(config.keywords);
    if (matches) {
      const keywordScore = Math.min(matches.length * 0.15 * config.weight, 0.7);
      const confidence = Math.min(
        LANGUAGE_CONFIG.maxConfidence,
        config.baseConfidence + keywordScore
      );
      
      candidates.push({ language: lang, confidence, method: 'keyword_analysis' });
    }
  }

  // Analyse par jeu de caractères
  const arabicChars = text.match(LANGUAGE_CONFIG.characterSets.arabic);
  const latinChars = text.match(LANGUAGE_CONFIG.characterSets.latin);
  const frenchChars = text.match(LANGUAGE_CONFIG.characterSets.french);
  
  if (arabicChars) {
    const arabicRatio = arabicChars.length / text.length;
    if (arabicRatio > 0.3) {
      const confidence = Math.min(0.85, arabicRatio * 0.8 + 0.2);
      
      // Distinguer entre arabe standard et darija
      const existingArabic = candidates.find(c => c.language === 'ar');
      const existingDarija = candidates.find(c => c.language === 'ary');
      
      if (!existingArabic || existingArabic.confidence < confidence) {
        candidates.push({ 
          language: includeDialects && (!existingDarija || existingDarija.confidence < confidence * 1.1) ? 'ar' : 'ar', 
          confidence, 
          method: 'character_analysis' 
        });
      }
    }
  }
  
  if (frenchChars && frenchChars.length > 0) {
    const frenchRatio = frenchChars.length / text.length;
    const confidence = Math.min(0.9, frenchRatio * 2 + 0.4);
    candidates.push({ language: 'fr', confidence, method: 'character_analysis' });
  }
  
  if (latinChars && latinChars.length > text.length * 0.5) {
    const latinRatio = latinChars.length / text.length;
    const confidence = Math.min(0.7, latinRatio * 0.6 + 0.2);
    
    // Favoriser le français si des caractères français sont détectés
    const language = frenchChars && frenchChars.length > 0 ? 'fr' : 'en';
    candidates.push({ language, confidence, method: 'character_analysis' });
  }

  // Trier les candidats par confiance
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  // Fusionner les scores pour la même langue
  const languageScores = {};
  candidates.forEach(candidate => {
    if (!languageScores[candidate.language]) {
      languageScores[candidate.language] = { confidence: 0, methods: [] };
    }
    languageScores[candidate.language].confidence = Math.max(
      languageScores[candidate.language].confidence,
      candidate.confidence
    );
    languageScores[candidate.language].methods.push(candidate.method);
  });

  // Sélectionner le meilleur candidat
  const finalCandidates = Object.entries(languageScores)
    .map(([lang, data]) => ({ language: lang, confidence: data.confidence, methods: data.methods }))
    .sort((a, b) => b.confidence - a.confidence);

  const bestMatch = finalCandidates[0];
  const processingTime = Date.now() - startTime;
  
  // Appliquer le seuil de confiance
  if (!bestMatch || bestMatch.confidence < confidenceThreshold) {
    return mockResponses.langDetect.default;
  }
  
  // Retourner le format attendu par le mock avec métadonnées
  const result = mockResponses.langDetect[bestMatch.language] || mockResponses.langDetect.default;
  
  // Ajouter les métadonnées de traitement si disponibles
  if (result && typeof result === 'object') {
    result.processingTime = processingTime;
    result.methods = bestMatch.methods;
  }
  
  return result;
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

// Routes de santé
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

// Routes legacy (rétrocompatibilité)
app.post('/langDetect', async (req, res) => {
  await simulateDelay();
  
  if (shouldSimulateError()) {
    return res.status(500).json({ error: 'Simulated error' });
  }
  
  const { text } = req.body;
  const result = detectLanguage(text);
  res.json(result);
});

app.post('/generateReply', async (req, res) => {
  await simulateDelay();
  
  if (shouldSimulateError()) {
    return res.status(500).json({ error: 'Simulated error' });
  }
  
  const { message, language } = req.body;
  // Utiliser le message pour enrichir la réponse
  const result = generateReply(language);
  if (result && typeof result === 'object') {
    result.originalMessage = message;
  }
  res.json(result);
});

app.get('/', async (req, res) => {
  await simulateDelay();
  
  if (shouldSimulateError()) {
    return res.status(500).json({ error: 'Simulated error' });
  }
  
  res.json({ 
    message: 'Genkit Mock Service',
    endpoints: {
      legacy: ['/langDetect', '/generateReply'],
      standardized: ['/lang-detect-flow', '/reply-flow'],
      health: ['/health']
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
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