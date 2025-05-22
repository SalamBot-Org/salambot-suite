/**
 * @file        Middleware d'authentification et de contrôle d'accès basé sur les rôles pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import { trace } from '@opentelemetry/api';
import { Role, AuthGuardOptions, JwtPayload, AuthErrorCode } from './types';
import { verifyJwt, extractJwtFromRequest } from './jwt';

// Tracer pour le composant d'authentification
const tracer = trace.getTracer('salambot.auth');

// Clé publique pour la vérification des JWT
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '';

/**
 * Middleware de vérification JWT avec express-jwt
 */
export const jwtMiddleware = expressjwt({
  secret: PUBLIC_KEY,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  getToken: (req) => extractJwtFromRequest(req) || '',
  credentialsRequired: true
});

/**
 * Middleware de garde d'authentification et de contrôle d'accès basé sur les rôles
 * @param options Options du middleware
 * @returns Middleware Express
 */
export function authGuard(options: AuthGuardOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const span = tracer.startSpan('auth.guard');
    span.setAttribute('auth.path', req.path);
    
    try {
      // Extraire le token JWT
      const token = extractJwtFromRequest(req);
      
      if (!token) {
        span.setAttribute('auth.authenticated', false);
        span.setAttribute('auth.error', 'No token provided');
        span.end();
        
        if (options.failWithError) {
          return res.status(401).json({
            error: 'Authentification requise',
            code: AuthErrorCode.INVALID_TOKEN
          });
        } else if (options.redirectUrl) {
          return res.redirect(options.redirectUrl);
        } else {
          return res.status(401).json({
            error: 'Authentification requise',
            code: AuthErrorCode.INVALID_TOKEN
          });
        }
      }
      
      // Vérifier le token JWT
      const payload = await verifyJwt(token);
      
      // Stocker les informations d'authentification dans la requête
      (req as any).auth = payload;
      
      span.setAttribute('auth.authenticated', true);
      span.setAttribute('auth.user_id', payload.sub);
      span.setAttribute('auth.roles', payload.roles.join(','));
      
      // Vérifier les rôles si nécessaire
      if (options.roles && options.roles.length > 0) {
        const hasRequiredRole = payload.roles.some(role => options.roles?.includes(role as Role));
        
        if (!hasRequiredRole) {
          span.setAttribute('auth.authorized', false);
          span.setAttribute('auth.error', 'Insufficient permissions');
          span.end();
          
          // Tracer l'accès refusé
          const deniedSpan = tracer.startSpan('auth.role.denied');
          deniedSpan.setAttribute('auth.user_id', payload.sub);
          deniedSpan.setAttribute('auth.roles', payload.roles.join(','));
          deniedSpan.setAttribute('auth.required_roles', options.roles.join(','));
          deniedSpan.setAttribute('auth.path', req.path);
          deniedSpan.end();
          
          if (options.failWithError) {
            return res.status(403).json({
              error: 'Accès refusé: permissions insuffisantes',
              code: AuthErrorCode.INSUFFICIENT_PERMISSIONS
            });
          } else if (options.redirectUrl) {
            return res.redirect(options.redirectUrl);
          } else {
            return res.status(403).json({
              error: 'Accès refusé: permissions insuffisantes',
              code: AuthErrorCode.INSUFFICIENT_PERMISSIONS
            });
          }
        }
        
        span.setAttribute('auth.authorized', true);
      }
      
      span.end();
      next();
    } catch (error) {
      span.setAttribute('auth.authenticated', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      // Déterminer le type d'erreur
      let statusCode = 401;
      let errorMessage = 'Erreur d\'authentification';
      let errorCode = AuthErrorCode.INVALID_TOKEN;
      
      if (error instanceof Error) {
        if (error.cause === AuthErrorCode.TOKEN_EXPIRED) {
          errorMessage = 'Session expirée, veuillez vous reconnecter';
          errorCode = AuthErrorCode.TOKEN_EXPIRED;
        } else if (error.cause === AuthErrorCode.INSUFFICIENT_PERMISSIONS) {
          statusCode = 403;
          errorMessage = 'Accès refusé: permissions insuffisantes';
          errorCode = AuthErrorCode.INSUFFICIENT_PERMISSIONS;
        }
      }
      
      if (options.failWithError) {
        return res.status(statusCode).json({
          error: errorMessage,
          code: errorCode
        });
      } else if (options.redirectUrl) {
        return res.redirect(options.redirectUrl);
      } else {
        return res.status(statusCode).json({
          error: errorMessage,
          code: errorCode
        });
      }
    }
  };
}

/**
 * Middleware de vérification de rôle
 * @param roles Rôles autorisés
 * @param redirectUrl URL de redirection en cas d'échec (optionnel)
 * @returns Middleware Express
 */
export function roleGuard(roles: Role[], redirectUrl?: string) {
  return authGuard({
    roles,
    redirectUrl,
    failWithError: !redirectUrl
  });
}

/**
 * Middleware pour les routes d'administration
 * @param redirectUrl URL de redirection en cas d'échec (optionnel)
 * @returns Middleware Express
 */
export function adminGuard(redirectUrl?: string) {
  return roleGuard([Role.ADMIN], redirectUrl);
}

/**
 * Middleware pour les routes d'agent
 * @param redirectUrl URL de redirection en cas d'échec (optionnel)
 * @returns Middleware Express
 */
export function agentGuard(redirectUrl?: string) {
  return roleGuard([Role.ADMIN, Role.AGENT], redirectUrl);
}

/**
 * Middleware pour les routes de visualisation
 * @param redirectUrl URL de redirection en cas d'échec (optionnel)
 * @returns Middleware Express
 */
export function viewerGuard(redirectUrl?: string) {
  return roleGuard([Role.ADMIN, Role.AGENT, Role.VIEWER], redirectUrl);
}
