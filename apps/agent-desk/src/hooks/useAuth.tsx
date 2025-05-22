/**
 * @file        Hook d'authentification et de contrôle d'accès pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trace } from '@opentelemetry/api';
import { Role } from '../types/auth';

// Tracer pour le composant Agent Desk
const tracer = trace.getTracer('salambot.agent-desk');

// URL de l'API d'authentification
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

// Interface utilisateur authentifié
interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  roles: Role[];
  emailVerified: boolean;
}

// Interface du contexte d'authentification
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType | null>(null);

// Provider du contexte d'authentification
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const verifyAuth = async () => {
      const span = tracer.startSpan('auth.verify');
      
      try {
        // Appeler l'API de vérification
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'GET',
          credentials: 'include' // Important pour les cookies
        });
        
        if (!response.ok) {
          // Si non authentifié, réinitialiser l'utilisateur
          setUser(null);
          span.setAttribute('auth.authenticated', false);
          span.end();
          return;
        }
        
        // Récupérer les données utilisateur
        const data = await response.json();
        
        // Mettre à jour l'utilisateur
        setUser(data.user);
        
        span.setAttribute('auth.authenticated', true);
        span.setAttribute('auth.user_id', data.user.uid);
        span.setAttribute('auth.roles', data.user.roles.join(','));
      } catch (error) {
        setUser(null);
        setError('Erreur de vérification d\'authentification');
        
        span.setAttribute('auth.authenticated', false);
        span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
        span.end();
      }
    };
    
    verifyAuth();
  }, []);
  
  // Fonction de connexion
  const login = async (email: string, password: string) => {
    const span = tracer.startSpan('auth.login');
    span.setAttribute('auth.method', 'email');
    
    setLoading(true);
    setError(null);
    
    try {
      // Appeler l'API d'authentification
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important pour les cookies
      });
      
      // Vérifier la réponse
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de connexion');
      }
      
      // Récupérer les données utilisateur
      const data = await response.json();
      
      // Mettre à jour l'utilisateur
      setUser(data.user);
      
      span.setAttribute('auth.success', true);
      span.setAttribute('auth.user_id', data.user.uid);
      span.setAttribute('auth.roles', data.user.roles.join(','));
      
      // Rediriger vers la page précédente ou la page d'accueil
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
      
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      
      // Tracer l'échec de connexion
      const failSpan = tracer.startSpan('auth.login.fail');
      failSpan.setAttribute('auth.method', 'email');
      failSpan.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
      failSpan.end();
    } finally {
      setLoading(false);
      span.end();
    }
  };
  
  // Fonction de déconnexion
  const logout = async () => {
    const span = tracer.startSpan('auth.logout');
    
    setLoading(true);
    
    try {
      // Appeler l'API de déconnexion
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include' // Important pour les cookies
      });
      
      // Réinitialiser l'utilisateur
      setUser(null);
      
      span.setAttribute('auth.success', true);
      
      // Rediriger vers la page de connexion
      navigate('/login');
    } catch (error) {
      setError('Erreur lors de la déconnexion');
      
      span.setAttribute('auth.success', false);
      span.setAttribute('auth.error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
      span.end();
    }
  };
  
  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: Role): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };
  
  // Vérifier si l'utilisateur a au moins un des rôles spécifiés
  const hasAnyRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return user.roles.some(role => roles.includes(role as Role));
  };
  
  // Valeur du contexte
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasAnyRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

// Composant de protection de route
interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Si le chargement est terminé et l'utilisateur n'est pas authentifié
    if (!loading && !user) {
      // Tracer l'accès refusé
      const span = tracer.startSpan('auth.access.denied');
      span.setAttribute('auth.path', location.pathname);
      span.setAttribute('auth.reason', 'not_authenticated');
      span.end();
      
      // Rediriger vers la page de connexion avec l'URL de retour
      navigate('/login', { state: { from: location } });
    }
    
    // Si l'utilisateur est authentifié mais n'a pas les rôles requis
    if (!loading && user && roles && !hasAnyRole(roles)) {
      // Tracer l'accès refusé
      const span = tracer.startSpan('auth.role.denied');
      span.setAttribute('auth.user_id', user.uid);
      span.setAttribute('auth.roles', user.roles.join(','));
      span.setAttribute('auth.required_roles', roles.join(','));
      span.setAttribute('auth.path', location.pathname);
      span.end();
      
      // Rediriger vers la page d'accès refusé
      navigate('/access-denied');
    }
  }, [user, loading, hasAnyRole, roles, navigate, location]);
  
  // Afficher un indicateur de chargement pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Si l'utilisateur est authentifié et a les rôles requis, afficher les enfants
  return <>{children}</>;
};
