/**
 * @file        Mise à jour de l'index pour exporter les flows Genkit
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Exporter les flows et les fonctions d'aide
export { flows, flowsConfig } from './genkit/flows.config';
export { detectLanguage } from './genkit/lang-detect-flow';
export { generateReply } from './genkit/reply-flow';

// Exporter les types
export { 
  SupportedLanguage,
  LanguageDetectionInput,
  LanguageDetectionResult,
  ReplyFlowInput,
  ReplyFlowOutput
} from './genkit/types';
