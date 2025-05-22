/**
 * @file        Service d'authentification Firebase pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import * as admin from 'firebase-admin';
import * as firebase from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  UserCredential
} from 'firebase/auth';
import { trace } from '@opentelemetry/api';
import { Role, AuthUser, AuthResult, AuthErrorCode } from './types';
import { generateJwt } from './jwt';

// Tracer pour le composant d'authentification
const tracer = trace.getTracer('salambot.auth');

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialiser Firebase Admin SDK (côté serveur)
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

// Initialiser Firebase Client SDK (côté client)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Service d'authentification pour SalamBot
 */
export class AuthService {
  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param email Email de l'utilisateur
   * @param password Mot de passe de l'utilisateur
   * @returns Résultat d'authentification avec token JWT
   */
  static async loginWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    const span = tracer.startSpan('auth.login.email');
    span.setAttribute('auth.method', 'email');
    span.setAttribute('auth.email', email);
    
    try {
      // Authentifier avec Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Récupérer les informations utilisateur complètes (y compris les rôles personnalisés)
      const authUser = await this.getUserWithRoles(userCredential.user.uid);
      
      // Générer un JWT
      const token = await generateJwt(authUser);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', authUser.uid);
      span.setAttribute('auth.roles', authUser.roles.join(','));
      span.end();
      
      return {
        user: authUser,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: 3600 // 1 heure
      };
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Authentifie un utilisateur avec Google OAuth
   * @returns Résultat d'authentification avec token JWT
   */
  static async loginWithGoogle(): Promise<AuthResult> {
    const span = tracer.startSpan('auth.login.google');
    span.setAttribute('auth.method', 'google');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Récupérer les informations utilisateur complètes
      const authUser = await this.getUserWithRoles(userCredential.user.uid);
      
      // Générer un JWT
      const token = await generateJwt(authUser);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', authUser.uid);
      span.setAttribute('auth.roles', authUser.roles.join(','));
      span.end();
      
      return {
        user: authUser,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: 3600 // 1 heure
      };
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Authentifie un utilisateur avec Microsoft OAuth
   * @returns Résultat d'authentification avec token JWT
   */
  static async loginWithMicrosoft(): Promise<AuthResult> {
    const span = tracer.startSpan('auth.login.microsoft');
    span.setAttribute('auth.method', 'microsoft');
    
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('user.read');
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Récupérer les informations utilisateur complètes
      const authUser = await this.getUserWithRoles(userCredential.user.uid);
      
      // Générer un JWT
      const token = await generateJwt(authUser);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', authUser.uid);
      span.setAttribute('auth.roles', authUser.roles.join(','));
      span.end();
      
      return {
        user: authUser,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: 3600 // 1 heure
      };
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Crée un nouvel utilisateur avec email et mot de passe
   * @param email Email de l'utilisateur
   * @param password Mot de passe de l'utilisateur
   * @param displayName Nom d'affichage de l'utilisateur
   * @param roles Rôles à attribuer à l'utilisateur (par défaut: client)
   * @returns Résultat d'authentification avec token JWT
   */
  static async createUser(
    email: string, 
    password: string, 
    displayName?: string, 
    roles: Role[] = [Role.CLIENT]
  ): Promise<AuthResult> {
    const span = tracer.startSpan('auth.register');
    span.setAttribute('auth.method', 'email');
    span.setAttribute('auth.email', email);
    
    try {
      // Créer l'utilisateur dans Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil avec le nom d'affichage
      if (displayName) {
        await admin.auth().updateUser(userCredential.user.uid, { displayName });
      }
      
      // Attribuer les rôles à l'utilisateur
      await this.setUserRoles(userCredential.user.uid, roles);
      
      // Récupérer les informations utilisateur complètes
      const authUser = await this.getUserWithRoles(userCredential.user.uid);
      
      // Générer un JWT
      const token = await generateJwt(authUser);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', authUser.uid);
      span.setAttribute('auth.roles', authUser.roles.join(','));
      span.end();
      
      return {
        user: authUser,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: 3600 // 1 heure
      };
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Déconnecte l'utilisateur actuel
   */
  static async logout(): Promise<void> {
    const span = tracer.startSpan('auth.logout');
    
    try {
      await auth.signOut();
      span.setAttribute('auth.success', true);
      span.end();
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw error;
    }
  }
  
  /**
   * Vérifie si un token JWT est valide
   * @param token Token JWT à vérifier
   * @returns Utilisateur authentifié
   */
  static async verifyToken(token: string): Promise<AuthUser> {
    const span = tracer.startSpan('auth.verify_token');
    
    try {
      // Vérifier le token avec Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Récupérer les informations utilisateur complètes
      const authUser = await this.getUserWithRoles(decodedToken.uid);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', authUser.uid);
      span.end();
      
      return authUser;
    } catch (error) {
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      span.end();
      
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Récupère les informations d'un utilisateur avec ses rôles
   * @param uid ID de l'utilisateur
   * @returns Utilisateur avec ses rôles
   */
  static async getUserWithRoles(uid: string): Promise<AuthUser> {
    try {
      // Récupérer l'utilisateur depuis Firebase Admin
      const userRecord = await admin.auth().getUser(uid);
      
      // Récupérer les rôles depuis les custom claims
      const customClaims = userRecord.customClaims || {};
      const roles = customClaims.roles || [Role.CLIENT];
      
      return {
        uid: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName,
        roles: roles,
        metadata: {
          createdAt: new Date(userRecord.metadata.creationTime).getTime(),
          lastLoginAt: new Date(userRecord.metadata.lastSignInTime).getTime()
        },
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Attribue des rôles à un utilisateur
   * @param uid ID de l'utilisateur
   * @param roles Rôles à attribuer
   */
  static async setUserRoles(uid: string, roles: Role[]): Promise<void> {
    try {
      // Mettre à jour les custom claims avec les rôles
      await admin.auth().setCustomUserClaims(uid, { roles });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param user Utilisateur à vérifier
   * @param role Rôle à vérifier
   * @returns true si l'utilisateur a le rôle
   */
  static hasRole(user: AuthUser, role: Role): boolean {
    return user.roles.includes(role);
  }
  
  /**
   * Vérifie si un utilisateur a au moins un des rôles spécifiés
   * @param user Utilisateur à vérifier
   * @param roles Rôles à vérifier
   * @returns true si l'utilisateur a au moins un des rôles
   */
  static hasAnyRole(user: AuthUser, roles: Role[]): boolean {
    return user.roles.some(role => roles.includes(role));
  }
  
  /**
   * Gère les erreurs d'authentification Firebase
   * @param error Erreur Firebase
   * @returns Erreur formatée
   */
  private static handleAuthError(error: any): Error {
    // Erreur Firebase
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return new Error('Email ou mot de passe incorrect', { cause: AuthErrorCode.INVALID_CREDENTIALS });
        case 'auth/email-already-in-use':
          return new Error('Cet email est déjà utilisé', { cause: AuthErrorCode.EMAIL_ALREADY_EXISTS });
        case 'auth/weak-password':
          return new Error('Le mot de passe est trop faible', { cause: AuthErrorCode.WEAK_PASSWORD });
        case 'auth/id-token-expired':
          return new Error('Session expirée, veuillez vous reconnecter', { cause: AuthErrorCode.TOKEN_EXPIRED });
        case 'auth/id-token-revoked':
        case 'auth/invalid-id-token':
          return new Error('Session invalide, veuillez vous reconnecter', { cause: AuthErrorCode.INVALID_TOKEN });
        default:
          return new Error(`Erreur d'authentification: ${error.message}`, { cause: AuthErrorCode.INTERNAL_ERROR });
      }
    }
    
    // Erreur générique
    return new Error('Erreur interne du serveur d\'authentification', { cause: AuthErrorCode.INTERNAL_ERROR });
  }
}
