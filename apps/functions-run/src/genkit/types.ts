/**
 * @file        Types pour le flow Genkit de génération de réponses IA.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/**
 * Langues supportées par le flow de réponse
 */
export type SupportedLanguage = 'fr' | 'ar' | 'ar-ma';

/**
 * Modèles LLM disponibles
 */
export type ModelType = 'gemini-pro' | 'llama-4-darija' | 'fallback';

/**
 * Paramètres d'entrée pour le flow de réponse
 */
export interface ReplyFlowInput {
  message: string;
  lang: SupportedLanguage;
  forceModel?: ModelType;
  metadata?: {
    conversationId?: string;
    userId?: string;
    channel?: string;
    [key: string]: any;
  };
}

/**
 * Résultat du flow de réponse
 */
export interface ReplyFlowResult {
  reply: string;
  lang: SupportedLanguage;
  modelUsed: ModelType;
  latency: number;
  cached?: boolean;
}

/**
 * Configuration d'un modèle LLM
 */
export interface ModelConfig {
  id: ModelType;
  provider: 'vertexai' | 'openai' | 'local';
  modelName: string;
  temperature: number;
  maxTokens: number;
  supportedLanguages: SupportedLanguage[];
  promptTemplate: string;
  fallback?: boolean;
}
