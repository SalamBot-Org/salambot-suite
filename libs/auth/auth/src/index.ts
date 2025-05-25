/**
 * @file        Hooks et logique d'authentification Firebase pour SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Fichier minimal pour permettre la validation ESLint
export const useAuth = () => {
  return {
    user: null,
    login: async () => console.log('Login non implémenté'),
    logout: async () => console.log('Logout non implémenté'),
    isAuthenticated: false
  };
};
