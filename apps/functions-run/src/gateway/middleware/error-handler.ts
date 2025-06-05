/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🚨 SalamBot API Gateway - Gestionnaire d'Erreurs         │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Gestion centralisée et structurée des erreurs          │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logging';

/**
 * 🌟 GESTIONNAIRE D'ERREURS ENTERPRISE 🌟
 * 
 * 📖 Mission: Gestion uniforme et sécurisée des erreurs
 * 🎭 Fonctionnalités:
 *   • 🔍 Classification automatique des erreurs
 *   • 🛡️ Sanitisation des messages d'erreur
 *   • 📊 Logging structuré pour le debugging
 *   • 🚨 Alertes automatiques pour les erreurs critiques
 * 
 * 🏆 Objectifs Qualité:
 *   • Expérience utilisateur cohérente
 *   • Sécurité des informations sensibles
 *   • Debugging facilité pour les développeurs
 * 
 * 👥 Équipe: SalamBot Platform Team <platform@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 🏷️ Types d'erreurs standardisés
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  TIMEOUT = 'REQUEST_TIMEOUT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE'
}

/**
 * 📋 Interface pour les erreurs standardisées
 */
export interface StandardError {
  type: ErrorType;
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  requestId?: string;
  timestamp: string;
  documentation?: string;
  suggestion?: string;
}

/**
 * 🎯 Classe d'erreur personnalisée pour l'API Gateway
 */
export class GatewayError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    code: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'GatewayError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintenir la stack trace
    Error.captureStackTrace(this, GatewayError);
  }
}

/**
 * 🚨 Middleware principal de gestion d'erreurs
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Si la réponse a déjà été envoyée, déléguer à Express
  if (res.headersSent) {
    return next(error);
  }

  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Classification et traitement de l'erreur
  const standardError = classifyError(error, requestId, timestamp);

  // Logging de l'erreur
  logError(error, req, standardError);

  // Envoi de la réponse d'erreur
  res.status(standardError.statusCode).json({
    error: standardError.message,
    code: standardError.code,
    type: standardError.type,
    requestId: standardError.requestId,
    timestamp: standardError.timestamp,
    ...(standardError.details && { details: standardError.details }),
    ...(standardError.documentation && { documentation: standardError.documentation }),
    ...(standardError.suggestion && { suggestion: standardError.suggestion })
  });
};

/**
 * 🔍 Classification automatique des erreurs
 */
function classifyError(error: Error, requestId: string, timestamp: string): StandardError {
  // Erreur Gateway personnalisée
  if (error instanceof GatewayError) {
    return {
      type: error.type,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      requestId,
      timestamp,
      documentation: getDocumentationUrl(error.type),
      suggestion: getSuggestion(error.type)
    };
  }

  // Erreurs de validation (ex: Joi, Zod)
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return {
      type: ErrorType.VALIDATION,
      message: 'Données de requête invalides',
      code: 'VALIDATION_FAILED',
      statusCode: 400,
      details: extractValidationDetails(error),
      requestId,
      timestamp,
      documentation: getDocumentationUrl(ErrorType.VALIDATION),
      suggestion: 'Vérifiez le format et les types de données envoyés'
    };
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return {
      type: ErrorType.AUTHENTICATION,
      message: 'Token d\'authentification invalide ou expiré',
      code: 'INVALID_TOKEN',
      statusCode: 401,
      requestId,
      timestamp,
      documentation: getDocumentationUrl(ErrorType.AUTHENTICATION),
      suggestion: 'Renouvelez votre token d\'authentification'
    };
  }

  // Erreurs de timeout
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Délai d\'attente dépassé',
      code: 'REQUEST_TIMEOUT',
      statusCode: 408,
      requestId,
      timestamp,
      suggestion: 'Réessayez votre requête dans quelques instants'
    };
  }

  // Erreurs de connexion/proxy
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
    return {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: 'Service temporairement indisponible',
      code: 'SERVICE_DOWN',
      statusCode: 503,
      requestId,
      timestamp,
      suggestion: 'Le service est en cours de maintenance, veuillez réessayer plus tard'
    };
  }

  // Erreurs de payload trop volumineux
  if (error.message.includes('PayloadTooLargeError') || error.message.includes('entity too large')) {
    return {
      type: ErrorType.PAYLOAD_TOO_LARGE,
      message: 'Taille de requête trop importante',
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
      requestId,
      timestamp,
      suggestion: 'Réduisez la taille de votre requête (limite: 10MB)'
    };
  }

  // Erreur interne par défaut
  return {
    type: ErrorType.INTERNAL,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    requestId,
    timestamp,
    documentation: 'https://docs.salambot.app/troubleshooting',
    suggestion: 'Si le problème persiste, contactez le support technique'
  };
}

/**
 * 📝 Logging structuré des erreurs
 */
function logError(error: Error, req: Request, standardError: StandardError) {
  const errorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: standardError.type,
      code: standardError.code
    },
    request: {
      id: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    },
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : null,
    response: {
      statusCode: standardError.statusCode
    },
    timestamp: standardError.timestamp
  };

  // Niveau de log selon la gravité
  if (standardError.statusCode >= 500) {
    logger.error('Erreur serveur critique', errorContext);
    
    // Alerte pour les erreurs critiques
    if (standardError.statusCode === 500) {
      sendCriticalAlert(error, req, standardError);
    }
  } else if (standardError.statusCode >= 400) {
    logger.warn('Erreur client', errorContext);
  } else {
    logger.info('Erreur gérée', errorContext);
  }
}

/**
 * 📚 URLs de documentation par type d'erreur
 */
function getDocumentationUrl(errorType: ErrorType): string {
  const baseUrl = 'https://docs.salambot.app';
  
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return `${baseUrl}/authentication`;
    case ErrorType.AUTHORIZATION:
      return `${baseUrl}/permissions`;
    case ErrorType.VALIDATION:
      return `${baseUrl}/api-reference`;
    case ErrorType.RATE_LIMIT:
      return `${baseUrl}/rate-limiting`;
    default:
      return `${baseUrl}/troubleshooting`;
  }
}

/**
 * 💡 Suggestions par type d'erreur
 */
function getSuggestion(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return 'Vérifiez votre token JWT ou clé API';
    case ErrorType.AUTHORIZATION:
      return 'Contactez un administrateur pour obtenir les permissions nécessaires';
    case ErrorType.VALIDATION:
      return 'Consultez la documentation API pour le format attendu';
    case ErrorType.RATE_LIMIT:
      return 'Réduisez la fréquence de vos requêtes';
    case ErrorType.SERVICE_UNAVAILABLE:
      return 'Réessayez dans quelques minutes';
    default:
      return 'Contactez le support si le problème persiste';
  }
}

/**
 * 🔍 Extraction des détails de validation
 */
function extractValidationDetails(error: Error): any {
  // Tentative d'extraction des détails selon le type d'erreur de validation
  if ('details' in error) {
    return (error as any).details;
  }
  
  if ('errors' in error) {
    return (error as any).errors;
  }

  return null;
}

/**
 * 🚨 Envoi d'alertes pour les erreurs critiques
 */
function sendCriticalAlert(error: Error, req: Request, standardError: StandardError) {
  // TODO: Intégrer avec un système d'alertes (Slack, PagerDuty, etc.)
  console.error('🚨 ALERTE CRITIQUE - Erreur 500 détectée:', {
    error: error.message,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    timestamp: standardError.timestamp,
    stack: error.stack
  });
}

/**
 * 🛠️ Helpers pour créer des erreurs standardisées
 */
export const createValidationError = (message: string, details?: any) => 
  new GatewayError(ErrorType.VALIDATION, message, 400, 'VALIDATION_ERROR', details);

export const createAuthenticationError = (message: string = 'Authentification requise') => 
  new GatewayError(ErrorType.AUTHENTICATION, message, 401, 'AUTHENTICATION_REQUIRED');

export const createAuthorizationError = (message: string = 'Permissions insuffisantes') => 
  new GatewayError(ErrorType.AUTHORIZATION, message, 403, 'INSUFFICIENT_PERMISSIONS');

export const createNotFoundError = (resource: string = 'Ressource') => 
  new GatewayError(ErrorType.NOT_FOUND, `${resource} non trouvé(e)`, 404, 'NOT_FOUND');

export const createRateLimitError = (message: string = 'Limite de requêtes dépassée') => 
  new GatewayError(ErrorType.RATE_LIMIT, message, 429, 'RATE_LIMIT_EXCEEDED');

export const createServiceUnavailableError = (service: string = 'Service') => 
  new GatewayError(ErrorType.SERVICE_UNAVAILABLE, `${service} temporairement indisponible`, 503, 'SERVICE_UNAVAILABLE');

export default errorHandler;