/**
 * @file        Flow de détection automatique de langue pour SalamBot (CLD3 + fallback LLM)
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { flow } from 'genkit';
import { LanguageDetectionInput, LanguageDetectionResult, SupportedLanguage } from './types';
import * as cld3 from 'cld3';
import { GeminiModel } from 'genkit-vertexai';

// Initialisation du détecteur CLD3
const detector = cld3.getLanguageDetector();

/**
 * Flow de détection de langue utilisant CLD3 avec fallback vers LLM
 * pour les cas ambigus ou le Darija (non supporté nativement par CLD3)
 */
export const langDetectFlow = flow<LanguageDetectionInput, LanguageDetectionResult>({
  name: 'lang-detect-flow',
  description: 'Détecte la langue d\'un texte (fr, ar, darija) avec CLD3 et fallback LLM',
  version: '0.1.0',
  run: async (input) => {
    const startTime = Date.now();
    
    // Étape 1: Tentative de détection avec CLD3 (rapide, offline)
    try {
      const result = detector.findLanguage(input.text);
      
      // Mapping des codes de langue CLD3 vers les types SalamBot
      if (result.language === 'fr' && result.probability > 0.7) {
        return {
          detectedLanguage: 'fr' as SupportedLanguage,
          confidence: result.probability,
          source: 'cld3',
          latency: Date.now() - startTime
        };
      } else if (result.language === 'ar' && result.probability > 0.7) {
        return {
          detectedLanguage: 'ar' as SupportedLanguage,
          confidence: result.probability,
          source: 'cld3',
          latency: Date.now() - startTime
        };
      }
      
      // Si CLD3 n'est pas confiant ou détecte une autre langue, on passe au LLM
      // Particulièrement important pour le Darija (dialecte marocain)
    } catch (error) {
      console.error('Erreur CLD3:', error);
      // En cas d'erreur, on continue avec le fallback LLM
    }
    
    // Étape 2: Fallback vers LLM pour une détection plus précise
    try {
      const gemini = new GeminiModel({
        model: 'gemini-pro',
        maxOutputTokens: 10
      });
      
      const prompt = `
      Détecte la langue du texte suivant et réponds uniquement par "fr", "ar" ou "darija".
      
      Texte: "${input.text}"
      
      Note: "darija" fait référence au dialecte marocain (arabe maghrébin).
      `;
      
      const llmResult = await gemini.generate(prompt);
      const llmResponse = llmResult.text.trim().toLowerCase();
      
      // Validation et mapping de la réponse LLM
      let detectedLang: SupportedLanguage;
      if (llmResponse.includes('fr')) {
        detectedLang = 'fr';
      } else if (llmResponse.includes('ar')) {
        detectedLang = 'ar';
      } else if (llmResponse.includes('darija')) {
        detectedLang = 'darija';
      } else {
        // Fallback par défaut si le LLM ne donne pas une réponse valide
        detectedLang = 'fr';
      }
      
      return {
        detectedLanguage: detectedLang,
        confidence: 0.85, // Confiance arbitraire pour le LLM
        source: 'llm',
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erreur LLM:', error);
      
      // Étape 3: Fallback ultime en cas d'échec des deux méthodes
      return {
        detectedLanguage: 'fr', // Français par défaut
        confidence: 0.5,
        source: 'fallback',
        latency: Date.now() - startTime
      };
    }
  }
});

/**
 * Fonction d'aide pour exécuter le flow de détection de langue
 */
export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  return await langDetectFlow.run({ text });
}
