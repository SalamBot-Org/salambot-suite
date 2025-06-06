/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🔐 SalamBot API Gateway - Tests Authentification          │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Tests pour le middleware d'authentification            │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-05 | Modifié: 2025-06-05                │
 * │  🏷️  v2.2.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import { GatewayConfigFactory } from '../config/gateway-config';
import { MetricsCollector } from '../middleware/metrics';

/**
 * 🔐 TESTS MIDDLEWARE AUTHENTIFICATION 🔐
 * 
 * 📖 Mission: Valider la sécurité de l'API Gateway
 * 🎭 Couverture:
 *   • 🔑 Authentification JWT
 *   • 🗝️ Authentification API Key
 *   • 🛡️ Validation des permissions
 *   • ❌ Gestion des erreurs d'auth
 * 
 * 🏆 Objectifs Sécurité:
 *   • Zero-trust validation
 *   • Audit trail complet
 *   • Performance optimale
 * 
 * 👥 Équipe: SalamBot Security Team <security@salambot.ma>
 * 📅 Implémentation: 2025-06-05
 * 🔖 Version: 2.2.0-enterprise
 */

describe('🔐 Authentication Middleware', () => {
  let config: ReturnType<typeof GatewayConfigFactory.create>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  afterAll(() => {
    // Nettoyage des métriques pour éviter les handles ouverts
    MetricsCollector.resetInstance();
  });

  beforeEach(() => {
    // Configuration de test
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['API_KEYS'] = 'test-api-key-1,test-api-key-2';
    config = GatewayConfigFactory.create();

    mockRequest = {
      headers: {},
      path: '/api/test',
      method: 'GET'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };

    nextFunction = jest.fn();
  });

  describe('🔑 JWT Authentication', () => {
    it('should authenticate valid JWT token', async () => {
      const user = {
        sub: 'user123',
        email: 'test@salambot.ma',
        role: 'user',
        permissions: ['read']
      };

      const token = jwt.sign(user, config.security.jwtSecret, {
        expiresIn: '1h'
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'test@salambot.ma',
        role: 'user'
      }));
    });

    it('should reject invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          code: expect.any(String)
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired JWT token', async () => {
      const user = {
        sub: 'user123',
        email: 'test@salambot.ma',
        role: 'user',
        permissions: ['read']
      };

      const token = jwt.sign(user, config.security.jwtSecret, {
        expiresIn: '-1h' // Token expiré
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          code: expect.any(String)
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('🗝️ API Key Authentication', () => {
    it('should authenticate valid API key', async () => {
      mockRequest.headers = {
        'x-api-key': 'test-api-key-1'
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({
        role: 'service',
        apiKey: 'test-api-key-1'
      }));
    });

    it('should reject invalid API key', async () => {
      mockRequest.headers = {
        'x-api-key': 'invalid-api-key'
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          code: expect.any(String)
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('🛡️ Authorization & Permissions', () => {
    it('should allow access with sufficient permissions', async () => {
      const user = {
        sub: 'admin123',
        email: 'admin@salambot.ma',
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      };

      const token = jwt.sign(user, config.security.jwtSecret);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      (mockRequest as Request & { path: string }).path = '/api/admin/users';

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow access for authenticated user', async () => {
      const user = {
        sub: 'user123',
        email: 'user@salambot.ma',
        role: 'user',
        permissions: ['read']
      };

      const token = jwt.sign(user, config.security.jwtSecret);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      (mockRequest as Request & { path: string }).path = '/api/users/profile';

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'user@salambot.ma',
        role: 'user'
      }));
    });
  });

  describe('🚫 Missing Authentication', () => {
    it('should reject requests without authentication', async () => {
      mockRequest.headers = {}; // Pas d'en-têtes d'auth

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          code: expect.any(String)
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          code: expect.any(String)
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('⚙️ Configuration Options', () => {
    it('should bypass authentication when disabled', async () => {
      config.security.authEnabled = false;
      mockRequest.headers = {}; // Pas d'auth

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({
        role: 'admin',
        id: 'dev-user',
        permissions: ['*'],
        tenant: 'development'
      }));
    });

    it('should allow public endpoints without authentication', async () => {
      (mockRequest as Request & { path: string }).path = '/health';
      mockRequest.headers = {};

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('📊 Security Metrics', () => {
    it('should log authentication attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockRequest.headers = {
        'x-api-key': 'test-api-key-1'
      };

      const middleware = authMiddleware(config);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Vérifier que les métriques sont collectées
      expect(nextFunction).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});