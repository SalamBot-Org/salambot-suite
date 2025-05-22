/**
 * @file        Utilitaire de traçage OpenTelemetry pour l'authentification SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Tracer pour le composant d'authentification
const tracer = trace.getTracer('salambot.auth');

/**
 * Utilitaire pour créer des traces OpenTelemetry pour l'authentification
 */
export const AuthTracing = {
  /**
   * Trace une tentative de connexion
   * @param method Méthode d'authentification (email, google, microsoft)
   * @param email Email de l'utilisateur (optionnel)
   */
  loginAttempt: (method: string, email?: string) => {
    const span = tracer.startSpan('auth.login.attempt');
    span.setAttribute('auth.method', method);
    
    if (email) {
      span.setAttribute('auth.email', email);
    }
    
    span.end();
  },
  
  /**
   * Trace une connexion réussie
   * @param method Méthode d'authentification (email, google, microsoft)
   * @param userId ID de l'utilisateur
   * @param roles Rôles de l'utilisateur
   */
  loginSuccess: (method: string, userId: string, roles: string[]) => {
    const span = tracer.startSpan('auth.login.success');
    span.setAttribute('auth.method', method);
    span.setAttribute('auth.user_id', userId);
    span.setAttribute('auth.roles', roles.join(','));
    span.end();
  },
  
  /**
   * Trace un échec de connexion
   * @param method Méthode d'authentification (email, google, microsoft)
   * @param error Message d'erreur
   * @param errorCode Code d'erreur (optionnel)
   */
  loginFail: (method: string, error: string, errorCode?: string) => {
    const span = tracer.startSpan('auth.login.fail');
    span.setAttribute('auth.method', method);
    span.setAttribute('auth.error', error);
    
    if (errorCode) {
      span.setAttribute('auth.error_code', errorCode);
    }
    
    span.end();
  },
  
  /**
   * Trace une déconnexion
   * @param userId ID de l'utilisateur
   */
  logout: (userId: string) => {
    const span = tracer.startSpan('auth.logout');
    span.setAttribute('auth.user_id', userId);
    span.end();
  },
  
  /**
   * Trace une vérification de token
   * @param success Succès de la vérification
   * @param userId ID de l'utilisateur (si succès)
   * @param error Message d'erreur (si échec)
   */
  verifyToken: (success: boolean, userId?: string, error?: string) => {
    const span = tracer.startSpan('auth.verify_token');
    span.setAttribute('auth.success', success);
    
    if (success && userId) {
      span.setAttribute('auth.user_id', userId);
    }
    
    if (!success && error) {
      span.setAttribute('auth.error', error);
    }
    
    span.end();
  },
  
  /**
   * Trace un refus d'accès basé sur le rôle
   * @param userId ID de l'utilisateur
   * @param userRoles Rôles de l'utilisateur
   * @param requiredRoles Rôles requis
   * @param path Chemin de la ressource
   */
  roleDenied: (userId: string, userRoles: string[], requiredRoles: string[], path: string) => {
    const span = tracer.startSpan('auth.role.denied');
    span.setAttribute('auth.user_id', userId);
    span.setAttribute('auth.roles', userRoles.join(','));
    span.setAttribute('auth.required_roles', requiredRoles.join(','));
    span.setAttribute('auth.path', path);
    span.end();
  },
  
  /**
   * Trace un accès refusé (non authentifié)
   * @param path Chemin de la ressource
   * @param reason Raison du refus
   */
  accessDenied: (path: string, reason: string) => {
    const span = tracer.startSpan('auth.access.denied');
    span.setAttribute('auth.path', path);
    span.setAttribute('auth.reason', reason);
    span.end();
  },
  
  /**
   * Trace une action générique avec gestion d'erreur
   * @param name Nom de la trace
   * @param attributes Attributs à ajouter à la trace
   * @param fn Fonction à exécuter dans le contexte de la trace
   * @returns Le résultat de la fonction
   */
  traceAction: async <T>(
    name: string,
    attributes: Record<string, any>,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const span = tracer.startSpan(name);
    
    // Ajouter les attributs
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, String(value));
      }
    });
    
    try {
      // Exécuter la fonction dans le contexte de la trace
      const result = await context.with(
        trace.setSpan(context.active(), span),
        fn
      );
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      span.end();
      throw error;
    }
  }
};
