/**
 * Mock REST API Service
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Service mock pour simuler l'API REST backend
 *              utilisé dans les tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const PORT = parseInt(process.env.PORT || process.env.MOCK_REST_API_PORT || '3002', 10);
const RESPONSE_DELAY = parseInt(process.env.MOCK_RESPONSE_DELAY_MS || '50');
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || '5');
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || '2');

// Données mock en mémoire
const mockData = {
  users: new Map(),
  conversations: new Map(),
  messages: new Map(),
  sessions: new Map()
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

function generateMockUser(id = null) {
  const userId = id || uuidv4();
  return {
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    name: `Test User ${userId.slice(0, 8)}`,
    preferredLanguage: 'darija-latin',
    location: 'Casablanca',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };
}

function generateMockConversation(userId, id = null) {
  const conversationId = id || uuidv4();
  return {
    id: conversationId,
    userId: userId,
    title: `Conversation ${conversationId.slice(0, 8)}`,
    language: 'darija-latin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0
  };
}

function generateMockMessage(conversationId, content, role = 'user') {
  const messageId = uuidv4();
  return {
    id: messageId,
    conversationId: conversationId,
    content: content,
    role: role, // 'user' | 'assistant' | 'system'
    language: 'darija-latin',
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    metadata: {
      processingTime: Math.floor(Math.random() * 100) + 50,
      model: 'mock-model-v1'
    }
  };
}

// Initialiser quelques données de test
function initializeMockData() {
  // Créer des utilisateurs de test
  const user1 = generateMockUser('test-user-1');
  const user2 = generateMockUser('test-user-2');
  mockData.users.set(user1.id, user1);
  mockData.users.set(user2.id, user2);
  
  // Créer des conversations de test
  const conv1 = generateMockConversation(user1.id, 'test-conv-1');
  const conv2 = generateMockConversation(user2.id, 'test-conv-2');
  mockData.conversations.set(conv1.id, conv1);
  mockData.conversations.set(conv2.id, conv2);
  
  // Créer des messages de test
  const msg1 = generateMockMessage(conv1.id, 'salam khouya, kifach nta?');
  const msg2 = generateMockMessage(conv1.id, 'Salam! Ana bikhir, hamdullah. Kifach nta?', 'assistant');
  mockData.messages.set(msg1.id, msg1);
  mockData.messages.set(msg2.id, msg2);
  
  conv1.messageCount = 2;
  conv2.messageCount = 0;
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
    console.log(`⏱️  [REST-API-MOCK] Simulation timeout pour ${req.method} ${req.path}`);
    setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout (simulated)',
          code: 'MOCK_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // 30 secondes
    return;
  }
  
  // Simuler erreur serveur
  if (shouldSimulateError()) {
    console.log(`❌ [REST-API-MOCK] Simulation erreur 500 pour ${req.method} ${req.path}`);
    return res.status(500).json({
      error: 'Internal Server Error (simulated)',
      code: 'MOCK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 [REST-API-MOCK] ${req.method} ${req.path}`);
  next();
});

// Routes de santé
app.get('/health', async (req, res) => {
  await simulateDelay();
  res.json({
    status: 'healthy',
    service: 'rest-api-mock',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-mock'
  });
});

app.get('/', async (req, res) => {
  await simulateDelay();
  res.json({
    message: 'SalamBot REST API Mock Service',
    status: 'running',
    endpoints: [
      'GET /health',
      'GET /api/users',
      'POST /api/users',
      'GET /api/users/:id',
      'GET /api/conversations',
      'POST /api/conversations',
      'GET /api/conversations/:id',
      'GET /api/conversations/:id/messages',
      'POST /api/conversations/:id/messages'
    ]
  });
});

// Routes API - Utilisateurs
app.get('/api/users', async (req, res) => {
  await simulateDelay();
  const users = Array.from(mockData.users.values());
  res.json({
    data: users,
    total: users.length,
    page: 1,
    limit: 50
  });
});

app.post('/api/users', async (req, res) => {
  await simulateDelay();
  const user = generateMockUser();
  Object.assign(user, req.body);
  mockData.users.set(user.id, user);
  
  res.status(201).json({
    data: user,
    message: 'User created successfully'
  });
});

app.get('/api/users/:id', async (req, res) => {
  await simulateDelay();
  const user = mockData.users.get(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }
  
  res.json({ data: user });
});

// Routes API - Conversations
app.get('/api/conversations', async (req, res) => {
  await simulateDelay();
  const { userId } = req.query;
  let conversations = Array.from(mockData.conversations.values());
  
  if (userId) {
    conversations = conversations.filter(conv => conv.userId === userId);
  }
  
  res.json({
    data: conversations,
    total: conversations.length,
    page: 1,
    limit: 50
  });
});

app.post('/api/conversations', async (req, res) => {
  await simulateDelay();
  const { userId } = req.body;
  
  if (!userId || !mockData.users.has(userId)) {
    return res.status(400).json({
      error: 'Valid userId is required',
      code: 'INVALID_USER_ID'
    });
  }
  
  const conversation = generateMockConversation(userId);
  Object.assign(conversation, req.body);
  mockData.conversations.set(conversation.id, conversation);
  
  res.status(201).json({
    data: conversation,
    message: 'Conversation created successfully'
  });
});

app.get('/api/conversations/:id', async (req, res) => {
  await simulateDelay();
  const conversation = mockData.conversations.get(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({
      error: 'Conversation not found',
      code: 'CONVERSATION_NOT_FOUND'
    });
  }
  
  res.json({ data: conversation });
});

// Routes API - Messages
app.get('/api/conversations/:id/messages', async (req, res) => {
  await simulateDelay();
  const conversationId = req.params.id;
  
  if (!mockData.conversations.has(conversationId)) {
    return res.status(404).json({
      error: 'Conversation not found',
      code: 'CONVERSATION_NOT_FOUND'
    });
  }
  
  const messages = Array.from(mockData.messages.values())
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  res.json({
    data: messages,
    total: messages.length,
    conversationId: conversationId
  });
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  await simulateDelay();
  const conversationId = req.params.id;
  const { content, role = 'user' } = req.body;
  
  if (!mockData.conversations.has(conversationId)) {
    return res.status(404).json({
      error: 'Conversation not found',
      code: 'CONVERSATION_NOT_FOUND'
    });
  }
  
  if (!content) {
    return res.status(400).json({
      error: 'Message content is required',
      code: 'MISSING_CONTENT'
    });
  }
  
  const message = generateMockMessage(conversationId, content, role);
  mockData.messages.set(message.id, message);
  
  // Mettre à jour le compteur de messages
  const conversation = mockData.conversations.get(conversationId);
  conversation.messageCount++;
  conversation.updatedAt = new Date().toISOString();
  
  res.status(201).json({
    data: message,
    message: 'Message created successfully'
  });
});

// Route catch-all pour les endpoints non implémentés
app.all('*', async (req, res) => {
  await simulateDelay();
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /api/users',
      'POST /api/users',
      'GET /api/users/:id',
      'GET /api/conversations',
      'POST /api/conversations',
      'GET /api/conversations/:id',
      'GET /api/conversations/:id/messages',
      'POST /api/conversations/:id/messages'
    ]
  });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error(`❌ [REST-API-MOCK] Erreur:`, error);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
  next();
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [REST-API-MOCK] Service démarré sur http://localhost:${PORT}`);
  console.log(`📊 [REST-API-MOCK] Configuration:`);
  console.log(`   - Délai de réponse: ${RESPONSE_DELAY}ms`);
  console.log(`   - Taux d'erreur: ${ERROR_RATE}%`);
  console.log(`   - Taux de timeout: ${TIMEOUT_RATE}%`);
  
  // Initialiser les données mock
  initializeMockData();
  console.log(`📝 [REST-API-MOCK] Données de test initialisées`);
  console.log(`   - Utilisateurs: ${mockData.users.size}`);
  console.log(`   - Conversations: ${mockData.conversations.size}`);
  console.log(`   - Messages: ${mockData.messages.size}`);
  
  console.log(`✅ [REST-API-MOCK] Prêt pour les tests d'intégration`);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 [REST-API-MOCK] Signal SIGTERM reçu, arrêt en cours...');
  server.close(() => {
    console.log('✅ [REST-API-MOCK] Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 [REST-API-MOCK] Signal SIGINT reçu, arrêt en cours...');
  server.close(() => {
    console.log('✅ [REST-API-MOCK] Serveur arrêté proprement');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ [REST-API-MOCK] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ [REST-API-MOCK] Unhandled Rejection:', reason);
  process.exit(1);
});