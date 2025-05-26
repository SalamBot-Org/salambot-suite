/**
 * @file        Logique de détection de langue pour l'IA Genkit
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Fichier minimal pour permettre la validation ESLint
export const detectLanguage = (text: string, opts?: { offline?: boolean }) => {
  const languages = ['fr', 'ar', 'darija'];
  const randomIndex = Math.floor(Math.random() * languages.length);
  
  return {
    language: languages[randomIndex],
    confidence: 0.95,
    source: opts?.offline ? 'offline' : 'cloud'
  };
};
