/**
 * @file        Tests pour l'authentification et le RBAC dans SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthService, Role, authGuard, roleGuard, agentGuard, adminGuard } from '../auth';
import { AuthTracing } from '../utils/auth-tracing';

// Mock de Firebase Auth
vi.mock('../auth/firebase', () => {
  const mockAuthService = {
    loginWithEmailPassword: vi.fn(),
    createUser: vi.fn(),
    verifyToken: vi.fn(),
    logout: vi.fn(),
    getUserWithRoles: vi.fn(),
    setUserRoles: vi.fn(),
    hasRole: vi.fn(),
    hasAnyRole: vi.fn()
  };
  
  return {
    AuthService: mockAuthService
  };
});

// Mock de JWT
vi.mock('../auth/jwt', () => ({
  generateJwt: vi.fn(),
  verifyJwt: vi.fn(),
  extractJwtFromRequest: vi.fn()
}));

// Mock de OpenTelemetry
vi.mock('../utils/auth-tracing', () => ({
  AuthTracing: {
    loginAttempt: vi.fn(),
    loginSuccess: vi.fn(),
    loginFail: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn(),
    roleDenied: vi.fn(),
    accessDenied: vi.fn(),
    traceAction: vi.fn((name, attributes, fn) => fn())
  }
}));

// Données de test
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  roles: [Role.AGENT],
  emailVerified: true,
  metadata: {
    createdAt: Date.now(),
    lastLoginAt: Date.now()
  }
};

const mockAdmin = {
  uid: 'test-admin-id',
  email: 'admin@example.com',
  displayName: 'Admin User',
  roles: [Role.ADMIN],
  emailVerified: true,
  metadata: {
    createdAt: Date.now(),
    lastLoginAt: Date.now()
  }
};

const mockClient = {
  uid: 'test-client-id',
  email: 'client@example.com',
  displayName: 'Client User',
  roles: [Role.CLIENT],
  emailVerified: true,
  metadata: {
    createdAt: Date.now(),
    lastLoginAt: Date.now()
  }
};

const mockToken = 'mock-jwt-token';

describe('Authentification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('AuthService', () => {
    it('doit authentifier un utilisateur avec email et mot de passe', async () => {
      // Configurer le mock
      const mockAuthResult = {
        user: mockUser,
        token: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };
      
      AuthService.loginWithEmailPassword.mockResolvedValue(mockAuthResult);
      
      // Appeler la fonction
      const result = await AuthService.loginWithEmailPassword('test@example.com', 'password');
      
      // Vérifier les résultats
      expect(result).toEqual(mockAuthResult);
      expect(AuthService.loginWithEmailPassword).toHaveBeenCalledWith('test@example.com', 'password');
    });
    
    it('doit créer un nouvel utilisateur', async () => {
      // Configurer le mock
      const mockAuthResult = {
        user: mockClient,
        token: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };
      
      AuthService.createUser.mockResolvedValue(mockAuthResult);
      
      // Appeler la fonction
      const result = await AuthService.createUser('client@example.com', 'password', 'Client User');
      
      // Vérifier les résultats
      expect(result).toEqual(mockAuthResult);
      expect(AuthService.createUser).toHaveBeenCalledWith('client@example.com', 'password', 'Client User', [Role.CLIENT]);
    });
    
    it('doit vérifier un token JWT', async () => {
      // Configurer le mock
      AuthService.verifyToken.mockResolvedValue(mockUser);
      
      // Appeler la fonction
      const result = await AuthService.verifyToken(mockToken);
      
      // Vérifier les résultats
      expect(result).toEqual(mockUser);
      expect(AuthService.verifyToken).toHaveBeenCalledWith(mockToken);
    });
    
    it('doit vérifier si un utilisateur a un rôle spécifique', () => {
      // Configurer le mock
      AuthService.hasRole.mockImplementation((user, role) => user.roles.includes(role));
      
      // Vérifier les résultats
      expect(AuthService.hasRole(mockUser, Role.AGENT)).toBe(true);
      expect(AuthService.hasRole(mockUser, Role.ADMIN)).toBe(false);
    });
    
    it('doit vérifier si un utilisateur a au moins un des rôles spécifiés', () => {
      // Configurer le mock
      AuthService.hasAnyRole.mockImplementation((user, roles) => user.roles.some(role => roles.includes(role)));
      
      // Vérifier les résultats
      expect(AuthService.hasAnyRole(mockUser, [Role.AGENT, Role.ADMIN])).toBe(true);
      expect(AuthService.hasAnyRole(mockUser, [Role.ADMIN, Role.VIEWER])).toBe(false);
    });
  });
  
  describe('Middleware authGuard', () => {
    let app;
    
    beforeEach(() => {
      // Créer une application Express pour les tests
      app = express();
      app.use(cookieParser());
      
      // Configurer les mocks
      const { verifyJwt } = require('../auth/jwt');
      const { extractJwtFromRequest } = require('../auth/jwt');
      
      extractJwtFromRequest.mockImplementation(req => req.cookies.token || null);
    });
    
    it('doit autoriser l\'accès avec un token valide', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockUser.uid,
        email: mockUser.email,
        roles: mockUser.roles,
        name: mockUser.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/protected', authGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/protected')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Accès autorisé' });
    });
    
    it('doit refuser l\'accès sans token', async () => {
      // Configurer la route protégée
      app.get('/protected', authGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès autorisé' });
      });
      
      // Faire la requête
      const response = await request(app).get('/protected');
      
      // Vérifier les résultats
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('doit refuser l\'accès avec un token invalide', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockRejectedValue(new Error('Token invalide'));
      
      // Configurer la route protégée
      app.get('/protected', authGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/protected')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Middleware roleGuard', () => {
    let app;
    
    beforeEach(() => {
      // Créer une application Express pour les tests
      app = express();
      app.use(cookieParser());
      
      // Configurer les mocks
      const { verifyJwt } = require('../auth/jwt');
      const { extractJwtFromRequest } = require('../auth/jwt');
      
      extractJwtFromRequest.mockImplementation(req => req.cookies.token || null);
    });
    
    it('doit autoriser l\'accès avec le rôle requis', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockAdmin.uid,
        email: mockAdmin.email,
        roles: mockAdmin.roles,
        name: mockAdmin.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/admin', roleGuard([Role.ADMIN]), (req, res) => {
        res.status(200).json({ message: 'Accès admin autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/admin')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Accès admin autorisé' });
    });
    
    it('doit refuser l\'accès sans le rôle requis', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockClient.uid,
        email: mockClient.email,
        roles: mockClient.roles,
        name: mockClient.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/admin', roleGuard([Role.ADMIN]), (req, res) => {
        res.status(200).json({ message: 'Accès admin autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/admin')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      
      // Vérifier que la trace de refus de rôle a été appelée
      expect(AuthTracing.roleDenied).toHaveBeenCalled();
    });
    
    it('doit autoriser l\'accès avec un des rôles requis', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockUser.uid,
        email: mockUser.email,
        roles: mockUser.roles,
        name: mockUser.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/agent', roleGuard([Role.ADMIN, Role.AGENT]), (req, res) => {
        res.status(200).json({ message: 'Accès agent autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/agent')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Accès agent autorisé' });
    });
  });
  
  describe('Middlewares spécifiques aux rôles', () => {
    let app;
    
    beforeEach(() => {
      // Créer une application Express pour les tests
      app = express();
      app.use(cookieParser());
      
      // Configurer les mocks
      const { verifyJwt } = require('../auth/jwt');
      const { extractJwtFromRequest } = require('../auth/jwt');
      
      extractJwtFromRequest.mockImplementation(req => req.cookies.token || null);
    });
    
    it('adminGuard doit autoriser l\'accès pour les administrateurs', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockAdmin.uid,
        email: mockAdmin.email,
        roles: mockAdmin.roles,
        name: mockAdmin.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/admin-only', adminGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès admin autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/admin-only')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Accès admin autorisé' });
    });
    
    it('agentGuard doit autoriser l\'accès pour les agents et administrateurs', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockUser.uid,
        email: mockUser.email,
        roles: mockUser.roles,
        name: mockUser.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/agent-only', agentGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès agent autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/agent-only')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Accès agent autorisé' });
    });
    
    it('agentGuard doit refuser l\'accès pour les clients', async () => {
      // Configurer le mock
      const { verifyJwt } = require('../auth/jwt');
      verifyJwt.mockResolvedValue({
        sub: mockClient.uid,
        email: mockClient.email,
        roles: mockClient.roles,
        name: mockClient.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/agent-only', agentGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès agent autorisé' });
      });
      
      // Faire la requête
      const response = await request(app)
        .get('/agent-only')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier les résultats
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Instrumentation OpenTelemetry', () => {
    it('doit tracer les tentatives de connexion', async () => {
      // Configurer le mock
      const mockAuthResult = {
        user: mockUser,
        token: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };
      
      AuthService.loginWithEmailPassword.mockResolvedValue(mockAuthResult);
      
      // Appeler la fonction
      await AuthService.loginWithEmailPassword('test@example.com', 'password');
      
      // Vérifier que la trace a été appelée
      expect(AuthTracing.loginAttempt).toHaveBeenCalled();
    });
    
    it('doit tracer les connexions réussies', async () => {
      // Configurer le mock
      const mockAuthResult = {
        user: mockUser,
        token: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };
      
      AuthService.loginWithEmailPassword.mockResolvedValue(mockAuthResult);
      
      // Appeler la fonction
      await AuthService.loginWithEmailPassword('test@example.com', 'password');
      
      // Vérifier que la trace a été appelée
      expect(AuthTracing.loginSuccess).toHaveBeenCalled();
    });
    
    it('doit tracer les échecs de connexion', async () => {
      // Configurer le mock
      AuthService.loginWithEmailPassword.mockRejectedValue(new Error('Identifiants invalides'));
      
      // Appeler la fonction
      try {
        await AuthService.loginWithEmailPassword('test@example.com', 'wrong-password');
      } catch (error) {
        // Ignorer l'erreur
      }
      
      // Vérifier que la trace a été appelée
      expect(AuthTracing.loginFail).toHaveBeenCalled();
    });
    
    it('doit tracer les refus d\'accès basés sur le rôle', async () => {
      // Créer une application Express pour les tests
      const app = express();
      app.use(cookieParser());
      
      // Configurer les mocks
      const { verifyJwt } = require('../auth/jwt');
      const { extractJwtFromRequest } = require('../auth/jwt');
      
      extractJwtFromRequest.mockImplementation(req => req.cookies.token || null);
      
      verifyJwt.mockResolvedValue({
        sub: mockClient.uid,
        email: mockClient.email,
        roles: mockClient.roles,
        name: mockClient.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'salambot-auth',
        aud: 'salambot-api'
      });
      
      // Configurer la route protégée
      app.get('/admin-only', adminGuard(), (req, res) => {
        res.status(200).json({ message: 'Accès admin autorisé' });
      });
      
      // Faire la requête
      await request(app)
        .get('/admin-only')
        .set('Cookie', [`token=${mockToken}`]);
      
      // Vérifier que la trace a été appelée
      expect(AuthTracing.roleDenied).toHaveBeenCalled();
    });
  });
});
