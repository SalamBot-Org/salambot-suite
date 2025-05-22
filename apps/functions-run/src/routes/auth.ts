/**
 * @file        Routes d'authentification pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { Router, Request, Response } from 'express';
import { trace } from '@opentelemetry/api';
import { AuthService, Role, AuthErrorCode } from '../auth';

// Tracer pour le composant d'authentification
const tracer = trace.getTracer('salambot.auth');

// Créer le routeur
const router = Router();

// Durée de validité du cookie (1 heure)
const COOKIE_MAX_AGE = 60 * 60 * 1000;

// Sécurité des cookies
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

/**
 * Route de connexion avec email et mot de passe
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  const span = tracer.startSpan('auth.login.route');
  span.setAttribute('auth.method', 'email');
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', 'Missing credentials');
      span.end();
      
      return res.status(400).json({
        error: 'Email et mot de passe requis',
        code: AuthErrorCode.INVALID_CREDENTIALS
      });
    }
    
    // Authentifier l'utilisateur
    const authResult = await AuthService.loginWithEmailPassword(email, password);
    
    // Définir le cookie sécurisé
    res.cookie('token', authResult.token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      maxAge: COOKIE_MAX_AGE,
      domain: COOKIE_DOMAIN,
      sameSite: 'strict'
    });
    
    span.setAttribute('auth.success', true);
    span.setAttribute('auth.user_id', authResult.user.uid);
    span.end();
    
    // Renvoyer les informations utilisateur (sans le token pour plus de sécurité)
    res.status(200).json({
      user: {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        roles: authResult.user.roles,
        emailVerified: authResult.user.emailVerified
      },
      expiresIn: authResult.expiresIn
    });
  } catch (error) {
    span.setAttribute('auth.success', false);
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    // Tracer l'échec de connexion
    const failSpan = tracer.startSpan('auth.login.fail');
    failSpan.setAttribute('auth.method', 'email');
    failSpan.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    failSpan.end();
    
    if (error instanceof Error) {
      const statusCode = error.cause === AuthErrorCode.INVALID_CREDENTIALS ? 401 : 500;
      
      return res.status(statusCode).json({
        error: error.message,
        code: error.cause || AuthErrorCode.INTERNAL_ERROR
      });
    }
    
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: AuthErrorCode.INTERNAL_ERROR
    });
  }
});

/**
 * Route de déconnexion
 * POST /auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  const span = tracer.startSpan('auth.logout.route');
  
  try {
    // Supprimer le cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: COOKIE_SECURE,
      domain: COOKIE_DOMAIN,
      sameSite: 'strict'
    });
    
    span.setAttribute('auth.success', true);
    span.end();
    
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    span.setAttribute('auth.success', false);
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    res.status(500).json({
      error: 'Erreur lors de la déconnexion',
      code: AuthErrorCode.INTERNAL_ERROR
    });
  }
});

/**
 * Route d'inscription
 * POST /auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  const span = tracer.startSpan('auth.register.route');
  
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', 'Missing credentials');
      span.end();
      
      return res.status(400).json({
        error: 'Email et mot de passe requis',
        code: AuthErrorCode.INVALID_CREDENTIALS
      });
    }
    
    // Créer l'utilisateur (par défaut avec le rôle CLIENT)
    const authResult = await AuthService.createUser(email, password, displayName);
    
    // Définir le cookie sécurisé
    res.cookie('token', authResult.token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      maxAge: COOKIE_MAX_AGE,
      domain: COOKIE_DOMAIN,
      sameSite: 'strict'
    });
    
    span.setAttribute('auth.success', true);
    span.setAttribute('auth.user_id', authResult.user.uid);
    span.end();
    
    // Renvoyer les informations utilisateur (sans le token pour plus de sécurité)
    res.status(201).json({
      user: {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        roles: authResult.user.roles,
        emailVerified: authResult.user.emailVerified
      },
      expiresIn: authResult.expiresIn
    });
  } catch (error) {
    span.setAttribute('auth.success', false);
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    if (error instanceof Error) {
      const statusCode = error.cause === AuthErrorCode.EMAIL_ALREADY_EXISTS ? 409 : 500;
      
      return res.status(statusCode).json({
        error: error.message,
        code: error.cause || AuthErrorCode.INTERNAL_ERROR
      });
    }
    
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: AuthErrorCode.INTERNAL_ERROR
    });
  }
});

/**
 * Route de vérification du token
 * GET /auth/verify
 */
router.get('/verify', async (req: Request, res: Response) => {
  const span = tracer.startSpan('auth.verify.route');
  
  try {
    // Récupérer le token depuis les cookies
    const token = req.cookies.token;
    
    if (!token) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', 'No token provided');
      span.end();
      
      return res.status(401).json({
        error: 'Authentification requise',
        code: AuthErrorCode.INVALID_TOKEN
      });
    }
    
    // Vérifier le token
    const authUser = await AuthService.verifyToken(token);
    
    span.setAttribute('auth.success', true);
    span.setAttribute('auth.user_id', authUser.uid);
    span.end();
    
    // Renvoyer les informations utilisateur
    res.status(200).json({
      user: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        roles: authUser.roles,
        emailVerified: authUser.emailVerified
      }
    });
  } catch (error) {
    span.setAttribute('auth.success', false);
    span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    span.end();
    
    if (error instanceof Error) {
      const statusCode = 
        error.cause === AuthErrorCode.TOKEN_EXPIRED || 
        error.cause === AuthErrorCode.INVALID_TOKEN ? 401 : 500;
      
      return res.status(statusCode).json({
        error: error.message,
        code: error.cause || AuthErrorCode.INTERNAL_ERROR
      });
    }
    
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: AuthErrorCode.INTERNAL_ERROR
    });
  }
});

export const authRouter = router;
