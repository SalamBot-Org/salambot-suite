/**
 * @file        Types et interfaces pour l'authentification et le RBAC dans SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/**
 * Rôles disponibles dans le système SalamBot
 */
export enum Role {
  ADMIN = 'admin',     // Accès complet à toutes les fonctionnalités et configurations
  AGENT = 'agent',     // Accès à l'Agent Desk et aux conversations
  VIEWER = 'viewer',   // Accès en lecture seule aux conversations et statistiques
  CLIENT = 'client'    // Accès limité au widget et à ses propres conversations
}

/**
 * Structure d'un utilisateur authentifié
 */
export interface AuthUser {
  uid: string;         // ID unique de l'utilisateur (Firebase)
  email: string;       // Email de l'utilisateur
  displayName?: string; // Nom d'affichage
  roles: Role[];       // Rôles attribués à l'utilisateur
  metadata?: {
    createdAt: number; // Timestamp de création du compte
    lastLoginAt: number; // Timestamp de dernière connexion
  };
  photoURL?: string;   // URL de la photo de profil
  emailVerified: boolean; // Si l'email a été vérifié
}

/**
 * Structure du payload JWT
 */
export interface JwtPayload {
  sub: string;         // Subject (uid de l'utilisateur)
  email: string;       // Email de l'utilisateur
  roles: Role[];       // Rôles de l'utilisateur
  name?: string;       // Nom d'affichage
  iat: number;         // Issued at (timestamp d'émission)
  exp: number;         // Expiration (timestamp d'expiration)
  iss: string;         // Issuer (émetteur du token)
  aud: string;         // Audience (destinataire du token)
}

/**
 * Options pour le middleware authGuard
 */
export interface AuthGuardOptions {
  roles?: Role[];      // Rôles autorisés (si non spécifié, authentification simple)
  redirectUrl?: string; // URL de redirection en cas d'échec d'authentification
  failWithError?: boolean; // Si true, renvoie une erreur 401/403 au lieu de rediriger
}

/**
 * Résultat d'authentification
 */
export interface AuthResult {
  user: AuthUser;      // Utilisateur authentifié
  token: string;       // Token JWT
  refreshToken: string; // Token de rafraîchissement
  expiresIn: number;   // Durée de validité du token en secondes
}

/**
 * Erreurs d'authentification
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_EXISTS = 'auth/email-already-exists',
  WEAK_PASSWORD = 'auth/weak-password',
  INVALID_TOKEN = 'auth/invalid-token',
  TOKEN_EXPIRED = 'auth/token-expired',
  INSUFFICIENT_PERMISSIONS = 'auth/insufficient-permissions',
  INTERNAL_ERROR = 'auth/internal-error'
}
