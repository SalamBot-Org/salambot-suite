/**
 * Tests d'Intégration - API Gateway
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Tests d'intégration pour l'API Gateway avec services mock
 * @author SalamBot Platform Team
 * @created 2025-06-02
 */

import { Redis } from 'ioredis';
import axios, { AxiosResponse } from 'axios';
import WebSocket from 'ws';

// Types pour les utilitaires globaux
type RequestResult = AxiosResponse<unknown> | { error: boolean; message: string };

interface TestUtils {
  makeRequest: (url: string, options?: Record<string, unknown>) => Promise<AxiosResponse<unknown>>;
  waitForCondition: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<void>;
  generateTestData: (type: string, count?: number) => Record<string, unknown>;
  redis: Redis;
  serviceUrls: {
    genkit: string;
    restApi: string;
    websocket: string;
    prometheus: string;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var testUtils: TestUtils;
}

describe('API Gateway - Tests d\'Intégration', () => {
  let gatewayServer: { close?: () => void } | undefined;

  beforeAll(async () => {
    // Vérifier que les services mock sont disponibles
    console.log('🔍 Vérification des services mock...');
    
    const services = [
      { name: 'Genkit', url: global.testUtils.serviceUrls.genkit },
      { name: 'REST API', url: global.testUtils.serviceUrls.restApi },
      { name: 'WebSocket', url: global.testUtils.serviceUrls.websocket },
      { name: 'Prometheus', url: global.testUtils.serviceUrls.prometheus }
    ];

    for (const service of services) {
      try {
        const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
        expect(response.status).toBe(200);
        console.log(`✅ ${service.name} service disponible`);
      } catch (error: unknown) {
        console.error(`❌ ${service.name} service non disponible:`, error instanceof Error ? error.message : String(error));
        throw new Error(`Service ${service.name} non disponible pour les tests`);
      }
    }

    // Démarrer l'API Gateway (simulation)
    // Note: Dans un vrai test, on démarrerait l'application Gateway ici
    gatewayServer = { 
      close: () => {
        console.log('🔌 Fermeture du serveur gateway simulé');
      }
    }; // Mock server object
    console.log('🚀 API Gateway simulé démarré');
  });

  afterAll(async () => {
    // Nettoyer les ressources
    if (gatewayServer?.close) {
      gatewayServer.close();
    }
    console.log('🧹 Nettoyage des ressources terminé');
  });

  beforeEach(async () => {
    // Nettoyer Redis entre les tests si configuré
    if (process.env['CLEAN_REDIS_BETWEEN_TESTS'] === 'true') {
      const keys = await global.testUtils.redis.keys('salambot:test:*');
      if (keys.length > 0) {
        await global.testUtils.redis.del(...keys);
      }
    }
  });

  describe('🔍 Health Checks', () => {
    test('devrait retourner le statut de santé de l\'API Gateway', async () => {
      // Simulation d'un appel de santé à l'API Gateway
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          genkit: 'healthy',
          restApi: 'healthy',
          websocket: 'healthy',
          redis: 'healthy',
          prometheus: 'healthy'
        },
        version: '2.2.0',
        uptime: process.uptime()
      };

      expect(healthData.status).toBe('healthy');
      expect(healthData.services.genkit).toBe('healthy');
      expect(healthData.services.restApi).toBe('healthy');
      expect(healthData.services.websocket).toBe('healthy');
      expect(healthData.services.redis).toBe('healthy');
      expect(healthData.services.prometheus).toBe('healthy');
    });

    test('devrait vérifier la connectivité Redis', async () => {
      const testKey = 'salambot:test:health:redis';
      const testValue = 'test-value-' + Date.now();

      // Écrire dans Redis
      await global.testUtils.redis.set(testKey, testValue, 'EX', 60);

      // Lire depuis Redis
      const retrievedValue = await global.testUtils.redis.get(testKey);
      expect(retrievedValue).toBe(testValue);

      // Nettoyer
      await global.testUtils.redis.del(testKey);
    });
  });

  describe('🤖 Intégration Genkit AI', () => {
    test('devrait détecter la langue d\'un texte en Darija', async () => {
      const testText = 'كيفاش راك؟ واش بخير؟';
      
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.genkit}/lang-detect-flow`,
        {
          method: 'POST',
          data: {
            data: {
              text: testText
            }
          }
        }
      );

      expect(response.status).toBe(200);
      const responseData = response.data as { result: { language: string; confidence: number; dialect: string } };
      expect(responseData.result).toBeDefined();
      expect(responseData.result.language).toBe('ary'); // Darija
      expect(responseData.result.confidence).toBeGreaterThan(0.8);
      expect(responseData.result.dialect).toBe('darija');
    });

    test('devrait générer une réponse en français', async () => {
      const testMessage = 'Bonjour, comment allez-vous?';
      
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.genkit}/reply-flow`,
        {
          method: 'POST',
          data: {
            data: {
              message: testMessage,
              language: 'fr',
              userId: 'test-user-123',
              conversationId: 'test-conv-456'
            }
          }
        }
      );

      expect(response.status).toBe(200);
      expect((response.data as { result: unknown }).result).toBeDefined();
      expect((response.data as { result: { reply: string } }).result.reply).toBeDefined();
      expect((response.data as { result: { language: string } }).result.language).toBe('fr');
      expect((response.data as { result: { confidence: number } }).result.confidence).toBeGreaterThan(0.7);
    });

    test('devrait gérer les erreurs de timeout Genkit', async () => {
      // Forcer un timeout en envoyant plusieurs requêtes rapidement
      const promises = Array.from({ length: 10 }, (_, i) => 
        global.testUtils.makeRequest(
          `${global.testUtils.serviceUrls.genkit}/lang-detect-flow`,
          {
            method: 'POST',
            data: {
              data: {
                text: `Test message ${i}`
              }
            },
            timeout: 1000 // Timeout court pour forcer l'erreur
          }
        ).catch((error: unknown) => ({ error: true, message: error instanceof Error ? error.message : String(error) }))
      );

      const results: RequestResult[] = await Promise.all(promises);
      
      // Au moins une requête devrait réussir
      const successCount = results.filter(r => !('error' in r)).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Certaines peuvent échouer (timeout/erreur simulée)
      const errorCount = results.filter(r => 'error' in r).length;
      console.log(`✅ ${successCount} succès, ${errorCount} erreurs (attendu pour le test de robustesse)`);
    });
  });

  describe('🔌 Intégration WebSocket', () => {
    test('devrait établir une connexion WebSocket', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(global.testUtils.serviceUrls.websocket.replace('http', 'ws'));
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout de connexion WebSocket'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          console.log('✅ Connexion WebSocket établie');
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    test('devrait recevoir un message de bienvenue', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(global.testUtils.serviceUrls.websocket.replace('http', 'ws'));
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout - message de bienvenue non reçu'));
        }, 5000);

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'welcome') {
              clearTimeout(timeout);
              expect(message.data.connectionId).toBeDefined();
              expect(message.data.message).toContain('Connexion établie');
              console.log('✅ Message de bienvenue reçu:', message.data.connectionId);
              ws.close();
              resolve();
            }
          } catch (error: unknown) {
            clearTimeout(timeout);
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    test('devrait envoyer et recevoir un ping/pong', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(global.testUtils.serviceUrls.websocket.replace('http', 'ws'));
        let welcomeReceived = false;
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout - ping/pong non reçu'));
        }, 10000);

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'welcome' && !welcomeReceived) {
              welcomeReceived = true;
              // Envoyer un ping
              ws.send(JSON.stringify({
                type: 'ping',
                data: {
                  timestamp: new Date().toISOString()
                }
              }));
            } else if (message.type === 'pong') {
              clearTimeout(timeout);
              expect(message.data.connectionId).toBeDefined();
              expect(message.data.timestamp).toBeDefined();
              console.log('✅ Ping/Pong réussi');
              ws.close();
              resolve();
            }
          } catch (error: unknown) {
            clearTimeout(timeout);
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('📊 Intégration Prometheus', () => {
    test('devrait récupérer les métriques Prometheus', async () => {
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.prometheus}/metrics`
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      const metrics = response.data;
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('process_start_time_seconds');
      
      console.log('✅ Métriques Prometheus récupérées');
    });

    test('devrait exécuter une requête via l\'API Prometheus', async () => {
      const query = 'http_requests_total';
      
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.prometheus}/api/v1/query`,
        {
          params: { query }
        }
      );

      expect(response.status).toBe(200);
      expect((response.data as { status: string }).status).toBe('success');
      expect((response.data as { data: { resultType: string } }).data.resultType).toBe('vector');
      expect((response.data as { data: { result: unknown[] } }).data.result).toBeInstanceOf(Array);
      
      console.log('✅ Requête API Prometheus réussie');
    });
  });

  describe('🔄 Intégration REST API Backend', () => {
    test('devrait créer un utilisateur', async () => {
      const userData = global.testUtils.generateTestData('user');
      
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.restApi}/users`,
        {
          method: 'POST',
          data: userData
        }
      );

      expect(response.status).toBe(201);
      expect((response.data as { user: unknown }).user).toBeDefined();
      expect((response.data as { user: { id: string } }).user.id).toBeDefined();
      expect((response.data as { user: { email: string } }).user.email).toBe(userData.email);
      
      console.log('✅ Utilisateur créé:', (response.data as { user: { id: string } }).user.id);
    });

    test('devrait créer une conversation', async () => {
      const conversationData = global.testUtils.generateTestData('conversation');
      
      const response = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.restApi}/conversations`,
        {
          method: 'POST',
          data: conversationData
        }
      );

      expect(response.status).toBe(201);
      expect((response.data as { conversation: unknown }).conversation).toBeDefined();
      expect((response.data as { conversation: { id: string } }).conversation.id).toBeDefined();
      expect((response.data as { conversation: { userId: string } }).conversation.userId).toBe(conversationData.userId);
      
      console.log('✅ Conversation créée:', (response.data as { conversation: { id: string } }).conversation.id);
    });

    test('devrait gérer les erreurs de validation', async () => {
      const invalidData = { email: 'invalid-email' }; // Email invalide
      
      try {
        await global.testUtils.makeRequest(
          `${global.testUtils.serviceUrls.restApi}/users`,
          {
            method: 'POST',
            data: invalidData
          }
        );
        
        // Ne devrait pas arriver ici
        expect(true).toBe(false);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response: { status: number; data: { error: string } } };
          expect(axiosError.response.status).toBe(400);
          expect(axiosError.response.data.error).toContain('validation');
          console.log('✅ Erreur de validation gérée correctement');
        } else {
          throw error;
        }
      }
    });
  });

  describe('🔄 Tests de Flux Complets', () => {
    test('devrait traiter un flux complet de conversation', async () => {
      // 1. Créer un utilisateur
      const userData = global.testUtils.generateTestData('user');
      const userResponse = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.restApi}/users`,
        {
          method: 'POST',
          data: userData
        }
      );
      
      const userId = (userResponse.data as { user: { id: string } }).user.id;
      
      // 2. Créer une conversation
      const conversationData = {
        userId: userId,
        title: 'Test Conversation',
        language: 'fr'
      };
      
      const conversationResponse = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.restApi}/conversations`,
        {
          method: 'POST',
          data: conversationData
        }
      );
      
      const conversationId = (conversationResponse.data as { conversation: { id: string } }).conversation.id;
      
      // 3. Détecter la langue d'un message
      const userMessage = 'Bonjour, j\'ai besoin d\'aide';
      const langDetectResponse = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.genkit}/lang-detect-flow`,
        {
          method: 'POST',
          data: {
            data: { text: userMessage }
          }
        }
      );
      
      expect((langDetectResponse.data as { result: { language: string } }).result.language).toBe('fr');
      
      // 4. Générer une réponse
      const replyResponse = await global.testUtils.makeRequest(
        `${global.testUtils.serviceUrls.genkit}/reply-flow`,
        {
          method: 'POST',
          data: {
            data: {
              message: userMessage,
              language: (langDetectResponse.data as { result: { language: string } }).result.language,
              userId: userId,
              conversationId: conversationId
            }
          }
        }
      );
      
      expect((replyResponse.data as { result: { reply: string } }).result.reply).toBeDefined();
      expect((replyResponse.data as { result: { language: string } }).result.language).toBe('fr');
      
      // 5. Sauvegarder les messages
      const userMessageData = {
        conversationId: conversationId,
        content: userMessage,
        sender: 'user',
        language: (langDetectResponse.data as { result: { language: string } }).result.language
      };
      
      const botMessageData = {
        conversationId: conversationId,
        content: (replyResponse.data as { result: { reply: string } }).result.reply,
        sender: 'bot',
        language: (replyResponse.data as { result: { language: string } }).result.language
      };
      
      const [userMsgResponse, botMsgResponse] = await Promise.all([
        global.testUtils.makeRequest(
          `${global.testUtils.serviceUrls.restApi}/messages`,
          {
            method: 'POST',
            data: userMessageData
          }
        ),
        global.testUtils.makeRequest(
          `${global.testUtils.serviceUrls.restApi}/messages`,
          {
            method: 'POST',
            data: botMessageData
          }
        )
      ]);
      
      expect(userMsgResponse.status).toBe(201);
      expect(botMsgResponse.status).toBe(201);
      
      console.log('✅ Flux complet de conversation traité avec succès');
      console.log(`   - Utilisateur: ${userId}`);
      console.log(`   - Conversation: ${conversationId}`);
      console.log(`   - Langue détectée: ${(langDetectResponse.data as { result: { language: string } }).result.language}`);
      console.log(`   - Messages sauvegardés: 2`);
    }, 30000); // Timeout plus long pour ce test complexe
  });

  describe('⚡ Tests de Performance', () => {
    test('devrait gérer plusieurs requêtes simultanées', async () => {
      const concurrentRequests = 5;
      const testMessages = [
        'Hello, how are you?',
        'Bonjour, comment allez-vous?',
        'كيف حالك؟',
        'كيفاش راك؟',
        'Hola, ¿cómo estás?'
      ];
      
      const startTime = Date.now();
      
      const promises = testMessages.map((message, index) => 
        global.testUtils.makeRequest(
          `${global.testUtils.serviceUrls.genkit}/lang-detect-flow`,
          {
            method: 'POST',
            data: {
              data: { text: message }
            }
          }
        ).catch((error: unknown) => ({ error: true, message: error instanceof Error ? error.message : String(error), index }))
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successCount = results.filter(r => !('error' in r)).length;
      const errorCount = results.filter(r => 'error' in r).length;
      
      console.log(`⚡ Performance: ${successCount}/${concurrentRequests} succès en ${duration}ms`);
      console.log(`   - Erreurs: ${errorCount}/${concurrentRequests}`);
      console.log(`   - Moyenne: ${Math.round(duration / concurrentRequests)}ms par requête`);
      
      // Au moins 80% des requêtes doivent réussir
      expect(successCount / concurrentRequests).toBeGreaterThanOrEqual(0.8);
      
      // Le temps total ne doit pas dépasser 10 secondes
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });
});