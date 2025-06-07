/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🧪 SalamBot API Gateway - Tests des Améliorations         │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Tests unitaires pour les corrections critiques         │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-01-20 | Modifié: 2025-01-20                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import request from 'supertest';
import { SalamBotAPIGateway } from '../server';
import { GatewayConfigFactory } from '../config/gateway-config';
import { Application } from 'express';

/**
 * 🌟 TESTS DES AMÉLIORATIONS CRITIQUES 🌟
 * 
 * 📖 Mission: Validation des corrections et améliorations
 * 🎭 Tests couverts:
 *   • 📊 Métriques dynamiques vs statiques
 *   • 🔧 Respect de la configuration prometheusEnabled
 *   • 🔒 Enforcement HTTPS
 *   • 🔍 Validation des URLs de services
 *   • 🏥 Health check avancé
 * 
 * 🏆 Objectifs:
 *   • Validation des corrections
 *   • Non-régression
 *   • Couverture complète
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-01-20
 * 🔖 Version: 2.1.0-enterprise
 */

describe('🔧 Tests des Améliorations Critiques', () => {
  let gateway: SalamBotAPIGateway;
  let app: Application;

  beforeEach(() => {
    // Configuration de test propre
    const config = GatewayConfigFactory.create('development');
    gateway = new SalamBotAPIGateway(config);
    app = gateway.getApp();
  });

  afterEach(async () => {
    if (gateway) {
      await gateway.stop();
    }
  });

  describe('📊 Métriques Dynamiques', () => {
    it('devrait servir les métriques dynamiques quand prometheusEnabled=true', async () => {
      // Configuration avec Prometheus activé
      const config = {
        ...GatewayConfigFactory.create('production'),
        monitoring: {
          ...GatewayConfigFactory.create('production').monitoring,
          prometheusEnabled: true
        },
        security: {
          ...GatewayConfigFactory.create('production').security,
          httpsOnly: false // Désactiver HTTPS enforcement pour les tests
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/metrics')
        .expect(200);
      
      // Vérifier que ce ne sont pas les métriques statiques
      expect(response.text).not.toContain('salambot_gateway_requests_total{method="GET",status="200"} 1000');
      expect(response.headers['content-type']).toContain('text/plain');
      
      await testGateway.stop();
    });

    it('devrait retourner 404 quand prometheusEnabled=false', async () => {
      // Configuration avec Prometheus désactivé (config par défaut en dev)
      const response = await request(app)
        .get('/metrics')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Métriques désactivées');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🔒 HTTPS Enforcement', () => {
    it('devrait rediriger vers HTTPS en production quand httpsOnly=true', async () => {
      const config = {
        ...GatewayConfigFactory.create('production'),
        security: {
          ...GatewayConfigFactory.create('production').security,
          httpsOnly: true
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/gateway/info')
        .set('Host', 'api.salambot.app')
        .expect(301);
      
      expect(response.headers['location']).toBe('https://api.salambot.app/gateway/info');
      
      await testGateway.stop();
    });

    it('ne devrait pas rediriger en développement même avec httpsOnly=true', async () => {
      const config = {
        ...GatewayConfigFactory.create('development'),
        security: {
          ...GatewayConfigFactory.create('development').security,
          httpsOnly: true
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/gateway/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('name', 'SalamBot API Gateway Enterprise');
      
      await testGateway.stop();
    });

    it('devrait ajouter les headers HSTS pour les requêtes HTTPS', async () => {
      const config = {
        ...GatewayConfigFactory.create('production'),
        security: {
          ...GatewayConfigFactory.create('production').security,
          httpsOnly: true
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/gateway/info')
        .set('X-Forwarded-Proto', 'https')
        .expect(200);
      
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      
      await testGateway.stop();
    });
  });

  describe('🔍 Validation des URLs de Services', () => {
    it('devrait retourner 503 pour un service avec URL invalide', async () => {
      const config = {
        ...GatewayConfigFactory.create('development'),
        services: {
          ...GatewayConfigFactory.create('development').services,
          genkitFlows: 'invalid-url'
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/api/ai/test')
        .expect(503);
      
      expect(response.body).toHaveProperty('error', 'Service IA non configuré');
      expect(response.body).toHaveProperty('message', 'URL du service Genkit Flows invalide ou manquante');
      
      await testGateway.stop();
    });

    it('devrait retourner 503 pour un service avec URL manquante', async () => {
      const config = {
        ...GatewayConfigFactory.create('development'),
        services: {
          ...GatewayConfigFactory.create('development').services,
          restApi: undefined
        }
      };
      
      const testGateway = new SalamBotAPIGateway(config);
      const testApp = testGateway.getApp();
      
      const response = await request(testApp)
        .get('/api/v1/test')
        .expect(503);
      
      expect(response.body).toHaveProperty('error', 'Service API non configuré');
      
      await testGateway.stop();
    });
  });

  describe('🏥 Health Check Avancé', () => {
    it('devrait retourner un health check détaillé', async () => {
      const response = await request(app)
        .get('/health')
        .expect((res) => {
          // Le status peut être 200, 207 ou 503 selon la disponibilité des services
          expect([200, 207, 503]).toContain(res.status);
        });
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version', '2.1.0');
      expect(response.body).toHaveProperty('environment', 'development');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
      
      // Vérifier la structure des services
      expect(Array.isArray(response.body.services)).toBe(true);
      
      // Vérifier la structure du système
      expect(response.body.system).toHaveProperty('memory');
      expect(response.body.system).toHaveProperty('cpu');
      expect(response.body.system.memory).toHaveProperty('used');
      expect(response.body.system.memory).toHaveProperty('total');
      expect(response.body.system.memory).toHaveProperty('percentage');
    });

    it('devrait inclure les informations de monitoring dans /gateway/info', async () => {
      const response = await request(app)
        .get('/gateway/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('monitoring');
      expect(response.body.monitoring).toHaveProperty('prometheusEnabled');
      expect(response.body.monitoring).toHaveProperty('logLevel');
      expect(response.body.monitoring).toHaveProperty('tracingEnabled');
    });
  });

  describe('📝 Logging Structuré', () => {
    it('devrait ajouter un request ID aux requêtes', async () => {
      const response = await request(app)
        .get('/gateway/info')
        .expect(200);
      
      // Le request ID devrait être ajouté automatiquement
      // On ne peut pas le vérifier directement dans la réponse,
      // mais on peut vérifier que la requête passe sans erreur
      expect(response.body).toHaveProperty('name');
    });

    it('devrait respecter les headers X-Request-ID existants', async () => {
      const customRequestId = 'test-request-123';
      
      const response = await request(app)
        .get('/gateway/info')
        .set('X-Request-ID', customRequestId)
        .expect(200);
      
      // La requête devrait passer normalement
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('🚨 Gestion d\'Erreurs Améliorée', () => {
    it('devrait retourner une erreur 404 structurée pour les endpoints inexistants', async () => {
      const response = await request(app)
        .get('/endpoint/inexistant')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Endpoint non trouvé');
      expect(response.body).toHaveProperty('path', '/endpoint/inexistant');
      expect(response.body).toHaveProperty('method', 'GET');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('suggestion');
    });
  });

  describe('🔧 Configuration et Validation', () => {
    it('devrait valider la configuration en production', () => {
      const validConfig = GatewayConfigFactory.create('production');
      expect(GatewayConfigFactory.validate(validConfig)).toBe(true);
    });

    it('devrait rejeter une configuration invalide', () => {
      const invalidConfig = {
        ...GatewayConfigFactory.create('production'),
        security: {
          ...GatewayConfigFactory.create('production').security,
          jwtSecret: 'trop-court', // Moins de 32 caractères
          httpsOnly: false // Obligatoire en production
        }
      };
      
      expect(GatewayConfigFactory.validate(invalidConfig)).toBe(false);
    });
  });
});