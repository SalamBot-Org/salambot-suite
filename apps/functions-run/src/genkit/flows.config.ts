/**
 * @file        Configuration des flows Genkit pour SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { langDetectFlow } from './lang-detect-flow';
import { replyFlow } from './reply-flow';

/**
 * Configuration des flows Genkit pour SalamBot
 */
export const flowsConfig = {
  // Flow de détection de langue
  langDetect: {
    flow: langDetectFlow,
    enabled: true,
    description:
      "Détecte la langue d'un texte (fr, ar, darija) avec CLD3 et fallback LLM",
  },

  // Flow de génération de réponse
  reply: {
    flow: replyFlow,
    enabled: true,
    description:
      'Génère une réponse adaptée à la langue détectée (Gemini pour fr/ar, Llama pour darija)',
  },
};

/**
 * Exporte tous les flows disponibles
 */
export const flows = {
  langDetect: langDetectFlow,
  reply: replyFlow,
};

/**
 * Exporte les fonctions d'aide pour l'exécution des flows
 */
export { detectLanguage } from './lang-detect-flow';
export { generateReply } from './reply-flow';
