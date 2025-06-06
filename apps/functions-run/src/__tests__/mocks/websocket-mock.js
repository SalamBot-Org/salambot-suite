/**
 * Mock WebSocket Service
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Service mock pour simuler le service WebSocket
 *              utilisé dans les tests d'intégration
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || process.env.MOCK_WEBSOCKET_PORT || 3003;
const RESPONSE_DELAY = parseInt(process.env.MOCK_RESPONSE_DELAY_MS || '50');
const ERROR_RATE = parseInt(process.env.MOCK_ERROR_RATE_PERCENT || '5');
const TIMEOUT_RATE = parseInt(process.env.MOCK_TIMEOUT_RATE_PERCENT || '2');

// Données mock en mémoire
const mockData = {
  connections: new Map(),
  rooms: new Map(),
  messages: new Map()
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

function generateMockMessage(type, data) {
  return {
    id: uuidv4(),
    type: type,
    data: data,
    timestamp: new Date().toISOString(),
    server: 'websocket-mock'
  };
}

// Créer l'application Express
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de simulation d'erreurs pour HTTP
app.use((req, res, next) => {
  // Simuler timeout
  if (shouldSimulateTimeout()) {
    console.log(`⏱️  [WEBSOCKET-MOCK] Simulation timeout pour ${req.method} ${req.path}`);
    return; // Ne pas répondre = timeout
  }
  
  // Simuler erreur serveur
  if (shouldSimulateError()) {
    console.log(`❌ [WEBSOCKET-MOCK] Simulation erreur 500 pour ${req.method} ${req.path}`);
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
  console.log(`📝 [WEBSOCKET-MOCK] ${req.method} ${req.path}`);
  next();
});

// Routes HTTP de santé
app.get('/health', async (req, res) => {
  await simulateDelay();
  res.json({
    status: 'healthy',
    service: 'websocket-mock',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-mock',
    connections: mockData.connections.size,
    rooms: mockData.rooms.size
  });
});

app.get('/', async (req, res) => {
  await simulateDelay();
  res.json({
    message: 'SalamBot WebSocket Mock Service',
    status: 'running',
    websocketUrl: `ws://localhost:${PORT}`,
    connections: mockData.connections.size,
    rooms: mockData.rooms.size,
    endpoints: [
      'GET /health',
      'GET /stats',
      'POST /broadcast',
      'WebSocket: ws://localhost:' + PORT
    ]
  });
});

// Route pour les statistiques
app.get('/stats', async (req, res) => {
  await simulateDelay();
  res.json({
    connections: {
      total: mockData.connections.size,
      active: Array.from(mockData.connections.values()).filter(conn => conn.isAlive).length
    },
    rooms: {
      total: mockData.rooms.size,
      list: Array.from(mockData.rooms.keys())
    },
    messages: {
      total: mockData.messages.size,
      recent: Array.from(mockData.messages.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    }
  });
});

// Route pour broadcaster un message
app.post('/broadcast', async (req, res) => {
  await simulateDelay();
  const { room, message, type = 'broadcast' } = req.body;
  
  if (!message) {
    return res.status(400).json({
      error: 'Message is required',
      code: 'MISSING_MESSAGE'
    });
  }
  
  const broadcastMessage = generateMockMessage(type, {
    content: message,
    room: room || 'global',
    sender: 'system'
  });
  
  // Stocker le message
  mockData.messages.set(broadcastMessage.id, broadcastMessage);
  
  // Broadcaster aux connexions appropriées
  let sentCount = 0;
  for (const [connectionId, connection] of mockData.connections) {
    if (connection.isAlive && (!room || connection.rooms.has(room))) {
      try {
        connection.ws.send(JSON.stringify(broadcastMessage));
        sentCount++;
      } catch (error) {
        console.error(`❌ [WEBSOCKET-MOCK] Erreur envoi à ${connectionId}:`, error.message);
      }
    }
  }
  
  res.json({
    message: 'Broadcast sent successfully',
    messageId: broadcastMessage.id,
    sentTo: sentCount,
    room: room || 'global'
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
      'GET /stats',
      'POST /broadcast',
      'WebSocket: ws://localhost:' + PORT
    ]
  });
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Gestion des connexions WebSocket
wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  const clientIp = req.socket.remoteAddress;
  
  console.log(`🔌 [WEBSOCKET-MOCK] Nouvelle connexion: ${connectionId} (${clientIp})`);
  
  // Stocker la connexion
  const connection = {
    id: connectionId,
    ws: ws,
    ip: clientIp,
    connectedAt: new Date().toISOString(),
    isAlive: true,
    rooms: new Set(['global']),
    messageCount: 0
  };
  
  mockData.connections.set(connectionId, connection);
  
  // Envoyer un message de bienvenue
  const welcomeMessage = generateMockMessage('welcome', {
    connectionId: connectionId,
    message: 'Connexion établie avec le service WebSocket mock',
    availableCommands: ['join', 'leave', 'message', 'ping']
  });
  
  ws.send(JSON.stringify(welcomeMessage));
  
  // Gestion des messages reçus
  ws.on('message', async (data) => {
    try {
      await simulateDelay();
      
      // Simuler erreur ou timeout
      if (shouldSimulateTimeout()) {
        console.log(`⏱️  [WEBSOCKET-MOCK] Simulation timeout pour message de ${connectionId}`);
        return; // Ne pas répondre
      }
      
      if (shouldSimulateError()) {
        const errorMessage = generateMockMessage('error', {
          error: 'Simulated server error',
          code: 'MOCK_ERROR'
        });
        ws.send(JSON.stringify(errorMessage));
        return;
      }
      
      const message = JSON.parse(data.toString());
      connection.messageCount++;
      
      console.log(`📨 [WEBSOCKET-MOCK] Message de ${connectionId}:`, message.type || 'unknown');
      
      // Traiter le message selon son type
      let response;
      
      switch (message.type) {
        case 'ping':
          response = generateMockMessage('pong', {
            timestamp: new Date().toISOString(),
            connectionId: connectionId
          });
          break;
          
        case 'join':
          const roomToJoin = message.data?.room;
          if (roomToJoin) {
            connection.rooms.add(roomToJoin);
            if (!mockData.rooms.has(roomToJoin)) {
              mockData.rooms.set(roomToJoin, new Set());
            }
            mockData.rooms.get(roomToJoin).add(connectionId);
            
            response = generateMockMessage('joined', {
              room: roomToJoin,
              connectionId: connectionId,
              roomMembers: mockData.rooms.get(roomToJoin).size
            });
          } else {
            response = generateMockMessage('error', {
              error: 'Room name is required',
              code: 'MISSING_ROOM'
            });
          }
          break;
          
        case 'leave':
          const roomToLeave = message.data?.room;
          if (roomToLeave && connection.rooms.has(roomToLeave)) {
            connection.rooms.delete(roomToLeave);
            if (mockData.rooms.has(roomToLeave)) {
              mockData.rooms.get(roomToLeave).delete(connectionId);
              if (mockData.rooms.get(roomToLeave).size === 0) {
                mockData.rooms.delete(roomToLeave);
              }
            }
            
            response = generateMockMessage('left', {
              room: roomToLeave,
              connectionId: connectionId
            });
          } else {
            response = generateMockMessage('error', {
              error: 'Not in specified room',
              code: 'NOT_IN_ROOM'
            });
          }
          break;
          
        case 'message':
          const messageContent = message.data?.content;
          const targetRoom = message.data?.room || 'global';
          
          if (messageContent) {
            const chatMessage = generateMockMessage('message', {
              content: messageContent,
              room: targetRoom,
              sender: connectionId,
              senderIp: connection.ip
            });
            
            // Stocker le message
            mockData.messages.set(chatMessage.id, chatMessage);
            
            // Broadcaster aux autres connexions dans la room
            let sentCount = 0;
            for (const [otherId, otherConnection] of mockData.connections) {
              if (otherId !== connectionId && 
                  otherConnection.isAlive && 
                  otherConnection.rooms.has(targetRoom)) {
                try {
                  otherConnection.ws.send(JSON.stringify(chatMessage));
                  sentCount++;
                } catch (error) {
                  console.error(`❌ [WEBSOCKET-MOCK] Erreur envoi à ${otherId}:`, error.message);
                }
              }
            }
            
            response = generateMockMessage('sent', {
              messageId: chatMessage.id,
              room: targetRoom,
              sentTo: sentCount
            });
          } else {
            response = generateMockMessage('error', {
              error: 'Message content is required',
              code: 'MISSING_CONTENT'
            });
          }
          break;
          
        default:
          response = generateMockMessage('error', {
            error: 'Unknown message type',
            code: 'UNKNOWN_TYPE',
            receivedType: message.type
          });
      }
      
      if (response) {
        ws.send(JSON.stringify(response));
      }
      
    } catch (error) {
      console.error(`❌ [WEBSOCKET-MOCK] Erreur traitement message de ${connectionId}:`, error);
      const errorResponse = generateMockMessage('error', {
        error: 'Message processing error',
        code: 'PROCESSING_ERROR',
        details: error.message
      });
      ws.send(JSON.stringify(errorResponse));
    }
  });
  
  // Gestion de la fermeture de connexion
  ws.on('close', (code, reason) => {
    console.log(`🔌 [WEBSOCKET-MOCK] Connexion fermée: ${connectionId} (code: ${code})`);
    
    // Nettoyer la connexion
    mockData.connections.delete(connectionId);
    
    // Nettoyer les rooms
    for (const [roomName, roomMembers] of mockData.rooms) {
      roomMembers.delete(connectionId);
      if (roomMembers.size === 0) {
        mockData.rooms.delete(roomName);
      }
    }
  });
  
  // Gestion des erreurs
  ws.on('error', (error) => {
    console.error(`❌ [WEBSOCKET-MOCK] Erreur connexion ${connectionId}:`, error);
    connection.isAlive = false;
  });
  
  // Heartbeat
  ws.on('pong', () => {
    connection.isAlive = true;
  });
});

// Heartbeat pour détecter les connexions mortes
const heartbeatInterval = setInterval(() => {
  for (const [connectionId, connection] of mockData.connections) {
    if (!connection.isAlive) {
      console.log(`💀 [WEBSOCKET-MOCK] Connexion morte détectée: ${connectionId}`);
      connection.ws.terminate();
      mockData.connections.delete(connectionId);
      continue;
    }
    
    connection.isAlive = false;
    connection.ws.ping();
  }
}, 30000); // Toutes les 30 secondes

// Gestion des erreurs Express
app.use((error, req, res, next) => {
  console.error(`❌ [WEBSOCKET-MOCK] Erreur Express:`, error);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: error.message
  });
});

// Démarrage du serveur
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [WEBSOCKET-MOCK] Service démarré sur http://localhost:${PORT}`);
  console.log(`🔌 [WEBSOCKET-MOCK] WebSocket disponible sur ws://localhost:${PORT}`);
  console.log(`📊 [WEBSOCKET-MOCK] Configuration:`);
  console.log(`   - Délai de réponse: ${RESPONSE_DELAY}ms`);
  console.log(`   - Taux d'erreur: ${ERROR_RATE}%`);
  console.log(`   - Taux de timeout: ${TIMEOUT_RATE}%`);
  console.log(`✅ [WEBSOCKET-MOCK] Prêt pour les tests d'intégration`);
});

// Gestion de l'arrêt propre
function shutdown() {
  console.log('🛑 [WEBSOCKET-MOCK] Arrêt en cours...');
  
  // Arrêter le heartbeat
  clearInterval(heartbeatInterval);
  
  // Fermer toutes les connexions WebSocket
  for (const [connectionId, connection] of mockData.connections) {
    try {
      const goodbyeMessage = generateMockMessage('goodbye', {
        reason: 'Server shutdown',
        connectionId: connectionId
      });
      connection.ws.send(JSON.stringify(goodbyeMessage));
      connection.ws.close(1001, 'Server shutdown');
    } catch (error) {
      console.error(`❌ [WEBSOCKET-MOCK] Erreur fermeture connexion ${connectionId}:`, error);
    }
  }
  
  // Fermer le serveur
  server.close(() => {
    console.log('✅ [WEBSOCKET-MOCK] Serveur arrêté proprement');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ [WEBSOCKET-MOCK] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [WEBSOCKET-MOCK] Unhandled Rejection:', reason);
  process.exit(1);
});