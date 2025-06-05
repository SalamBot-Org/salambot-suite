/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🔐 SalamBot API Gateway - Middleware d'Authentification   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Sécurisation des endpoints avec JWT et API Keys        │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GatewayConfig } from '../config/gateway-config';

/**
 * 🌟 MIDDLEWARE D'AUTHENTIFICATION ENTERPRISE 🌟
 * 
 * 📖 Mission: Sécuriser l'accès aux services SalamBot
 * 🎭 Fonctionnalités:
 *   • 🔑 Authentification JWT (Bearer tokens)
 *   • 🗝️ Authentification API Key (X-API-Key header)
 *   • 🛡️ Validation des permissions par endpoint
 *   • 🔍 Logging des tentatives d'authentification
 * 
 * 🏆 Objectifs Sécurité:
 *   • Zero-trust architecture
 *   • Audit trail complet
 *   • Rate limiting par utilisateur
 * 
 * 👥 Équipe: SalamBot Security Team <security@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 👤 Interface utilisateur authentifié
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'admin' | 'user' | 'service' | 'guest';
  permissions: string[];
  apiKey?: string;
  tenant?: string;
}

/**
 * 📝 Extension de Request pour inclure l'utilisateur
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

/**
 * 🔐 Middleware principal d'authentification
 */
export const authMiddleware = (config?: GatewayConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Génération d'un ID de requête unique pour le tracing
      req.requestId = req.headers['x-request-id'] as string || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Skip auth en développement si configuré
      if (config?.isDevelopment && !config.security.authEnabled) {
        req.user = {
          id: 'dev-user',
          role: 'admin',
          permissions: ['*'],
          tenant: 'development'
        };
        return next();
      }

      // Endpoints publics (pas d'auth requise)
      const publicEndpoints = [
        '/health',
        '/metrics',
        '/gateway/info',
        '/api/public'
      ];

      if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        return next();
      }

      // Tentative d'authentification JWT
      const jwtUser = await authenticateJWT(req, config);
      if (jwtUser) {
        req.user = jwtUser;
        logAuthSuccess(req, 'JWT');
        return next();
      }

      // Tentative d'authentification API Key
      const apiKeyUser = await authenticateAPIKey(req, config);
      if (apiKeyUser) {
        req.user = apiKeyUser;
        logAuthSuccess(req, 'API_KEY');
        return next();
      }

      // Aucune authentification valide trouvée
      logAuthFailure(req, 'NO_VALID_AUTH');
      return res.status(401).json({
        error: 'Authentification requise',
        code: 'UNAUTHORIZED',
        message: 'Veuillez fournir un token JWT valide ou une clé API',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        documentation: 'https://docs.salambot.app/authentication'
      });

    } catch (error) {
      console.error('❌ Erreur middleware auth:', error);
      logAuthFailure(req, 'AUTH_ERROR', error);
      
      return res.status(500).json({
        error: 'Erreur interne d\'authentification',
        code: 'AUTH_INTERNAL_ERROR',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 🎫 Authentification via JWT Bearer Token
 */
async function authenticateJWT(req: Request, config?: GatewayConfig): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  
  try {
    const jwtSecret = config?.security.jwtSecret || process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Validation du payload JWT
    if (!decoded.sub || !decoded.role) {
      throw new Error('JWT payload invalide');
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      tenant: decoded.tenant
    };
  } catch (error) {
    console.warn('⚠️ JWT invalide:', error.message);
    return null;
  }
}

/**
 * 🗝️ Authentification via API Key
 */
async function authenticateAPIKey(req: Request, config?: GatewayConfig): Promise<AuthenticatedUser | null> {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return null;
  }

  // Validation de la clé API
  const validApiKeys = config?.security.apiKeys || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return null;
  }

  // Mapping des clés API vers les utilisateurs/services
  // En production, ceci devrait être dans une base de données
  const apiKeyMappings: Record<string, AuthenticatedUser> = {
    'dev-api-key-1': {
      id: 'dev-service-1',
      role: 'service',
      permissions: ['ai:detect-language', 'ai:generate-reply'],
      apiKey,
      tenant: 'development'
    },
    'dev-api-key-2': {
      id: 'dev-service-2',
      role: 'admin',
      permissions: ['*'],
      apiKey,
      tenant: 'development'
    }
  };

  return apiKeyMappings[apiKey] || {
    id: `api-key-${apiKey.substring(0, 8)}`,
    role: 'service',
    permissions: ['basic'],
    apiKey,
    tenant: 'unknown'
  };
}

/**
 * 🛡️ Middleware de vérification des permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'NOT_AUTHENTICATED',
        requestId: req.requestId
      });
    }

    // Admin a toutes les permissions
    if (req.user.role === 'admin' || req.user.permissions.includes('*')) {
      return next();
    }

    // Vérification de la permission spécifique
    if (!req.user.permissions.includes(permission)) {
      logAuthFailure(req, 'INSUFFICIENT_PERMISSIONS', { 
        required: permission, 
        user: req.user.permissions 
      });
      
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        code: 'FORBIDDEN',
        required: permission,
        userPermissions: req.user.permissions,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * 👑 Middleware pour les admins uniquement
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Accès administrateur requis',
      code: 'ADMIN_REQUIRED',
      requestId: req.requestId
    });
  }
  next();
};

/**
 * 📝 Logging des succès d'authentification
 */
function logAuthSuccess(req: Request, method: string) {
  console.log(`✅ Auth Success [${req.requestId}]:`, {
    method,
    user: req.user?.id,
    role: req.user?.role,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
}

/**
 * 🚨 Logging des échecs d'authentification
 */
function logAuthFailure(req: Request, reason: string, details?: any) {
  console.warn(`❌ Auth Failure [${req.requestId}]:`, {
    reason,
    details,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : 'missing',
      'x-api-key': req.headers['x-api-key'] ? '[REDACTED]' : 'missing'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 🔄 Export du middleware configuré
 */
export default authMiddleware;