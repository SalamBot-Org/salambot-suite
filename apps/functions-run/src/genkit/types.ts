/**
 * @file        Types partagés pour les flows Genkit de SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

export type SupportedLanguage = 'fr' | 'ar' | 'darija';

export interface LanguageDetectionInput {
  text: string;
}

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  source: 'cld3' | 'llm' | 'fallback';
  latency: number;
}

export interface ReplyFlowInput {
  message: string;
  lang: SupportedLanguage;
}

export interface ReplyFlowOutput {
  reply: string;
  lang: SupportedLanguage;
  latency: number;
  modelUsed: string;
}
