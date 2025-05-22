/**
 * @file        Génération et vérification de JWT pour l'authentification SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import * as jwt from 'jsonwebtoken';
import { trace } from '@opentelemetry/api';
import { AuthUser, JwtPayload, Role, AuthErrorCode } from './types';

// Tracer pour le composant d'authentification
const tracer = trace.getTracer('salambot.auth');

// Clés pour la signature et la vérification des JWT
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '';

// Durée de validité du token (1 heure)
const TOKEN_EXPIRATION = 60 * 60;

// Émetteur et audience du token
const TOKEN_ISSUER = 'salambot-auth';
const TOKEN_AUDIENCE = 'salambot-api';

/**
 * Génère un JWT signé avec RS256 pour un utilisateur authentifié
 * @param user Utilisateur authentifié
 * @returns Token JWT signé
 */
export async function generateJwt(user: AuthUser): Promise<string> {
  const span = tracer.startSpan('auth.generate_jwt');
  span.setAttribute('auth.user_id', user.uid);
  
  try {
    // Vérifier que les clés sont définies
    if (!PRIVATE_KEY) {
      throw new Error('Clé privée non définie', { cause: AuthErrorCode.INTERNAL_ERROR });
    }
    
    // Créer le payload du token
    const payload: JwtPayload = {
      sub: user.uid,
      email: user.email,
      roles: user.roles,
      name: user.displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION,
      iss: TOKEN_ISSUER,
      aud: TOKEN_AUDIENCE
    };
    
    // Signer le token avec la clé privée
    const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
    
    span.setAttribute('auth.token_generated', true);
    span.end();
    
    return token;
  } catch (error) {
    span.setAttribute('auth.token_generated', false);
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    throw error;
  }
}

/**
 * Vérifie un JWT et retourne le payload
 * @param token Token JWT à vérifier
 * @returns Payload du token
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  const span = tracer.startSpan('auth.verify_jwt');
  
  try {
    // Vérifier que les clés sont définies
    if (!PUBLIC_KEY) {
      throw new Error('Clé publique non définie', { cause: AuthErrorCode.INTERNAL_ERROR });
    }
    
    // Vérifier le token avec la clé publique
    const payload = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    }) as JwtPayload;
    
    span.setAttribute('auth.token_verified', true);
    span.setAttribute('auth.user_id', payload.sub);
    span.end();
    
    return payload;
  } catch (error) {
    span.setAttribute('auth.token_verified', false);
    
    if (error instanceof jwt.TokenExpiredError) {
      span.setAttribute('auth.error', 'Token expired');
      span.end();
      throw new Error('Session expirée, veuillez vous reconnecter', { cause: AuthErrorCode.TOKEN_EXPIRED });
    } else if (error instanceof jwt.JsonWebTokenError) {
      span.setAttribute('auth.error', 'Invalid token');
      span.end();
      throw new Error('Session invalide, veuillez vous reconnecter', { cause: AuthErrorCode.INVALID_TOKEN });
    }
    
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    throw error;
  }
}

/**
 * Extrait le token JWT de la requête HTTP
 * @param req Requête HTTP
 * @returns Token JWT ou null si non trouvé
 */
export function extractJwtFromRequest(req: any): string | null {
  // Vérifier l'en-tête Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Vérifier les cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Vérifier les query params (à éviter en production)
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
}
