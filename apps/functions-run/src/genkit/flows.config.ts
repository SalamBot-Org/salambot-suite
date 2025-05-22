/**
 * @file        Configuration des flows Genkit pour SalamBot.
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-22
 * @updated     2025-05-22
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import fs from 'fs';
import path from 'path';
import { ModelConfig, SupportedLanguage } from './types';

// Charger les templates de prompts
const promptsDir = path.join(__dirname, 'prompts');
const frArPrompt = fs.readFileSync(path.join(promptsDir, 'fr_ar.prompt.txt'), 'utf-8');
const darijaPrompt = fs.readFileSync(path.join(promptsDir, 'darija.prompt.txt'), 'utf-8');

/**
 * Configuration des modèles LLM disponibles
 */
export const modelConfigs: ModelConfig[] = [
  {
    id: 'gemini-pro',
    provider: 'vertexai',
    modelName: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1024,
    supportedLanguages: ['fr', 'ar'],
    promptTemplate: frArPrompt
  },
  {
    id: 'llama-4-darija',
    provider: 'openai',
    modelName: 'llama-4-darija',
    temperature: 0.8,
    maxTokens: 1024,
    supportedLanguages: ['ar-ma'],
    promptTemplate: darijaPrompt
  },
  {
    id: 'fallback',
    provider: 'vertexai',
    modelName: 'gemini-pro',
    temperature: 0.5,
    maxTokens: 512,
    supportedLanguages: ['fr', 'ar', 'ar-ma'],
    promptTemplate: frArPrompt,
    fallback: true
  }
];

/**
 * Sélectionne le modèle approprié en fonction de la langue
 */
export function selectModelForLanguage(lang: SupportedLanguage, forceModel?: string): ModelConfig {
  // Si un modèle est forcé, le retourner s'il existe
  if (forceModel) {
    const forcedModel = modelConfigs.find(config => config.id === forceModel);
    if (forcedModel) return forcedModel;
  }
  
  // Sinon, sélectionner le modèle en fonction de la langue
  const model = modelConfigs.find(config => 
    !config.fallback && config.supportedLanguages.includes(lang)
  );
  
  // Si aucun modèle n'est trouvé, utiliser le fallback
  return model || modelConfigs.find(config => config.fallback) || modelConfigs[0];
}

/**
 * Configuration Redis pour le cache (optionnel)
 */
export const redisConfig = {
  enabled: process.env.ENABLE_REDIS_CACHE === 'true',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ttl: parseInt(process.env.REDIS_CACHE_TTL || '3600') // 1 heure par défaut
};
