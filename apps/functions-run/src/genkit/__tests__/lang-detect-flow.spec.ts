/**
 * @file        Tests unitaires pour le flow de détection de langue
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Import du module à tester
import { detectLanguage } from '../lang-detect-flow';

// Mock de CLD3
jest.mock('cld3', () => {
  return {
    getLanguageDetector: jest.fn(() => ({
      findLanguage: jest.fn((text) => {
        // Simulation de détection basée sur des mots-clés simples
        if (text.includes('bonjour') || text.includes('merci')) {
          return { language: 'fr', probability: 0.9 };
        } else if (text.includes('شكرا') || text.includes('مرحبا')) {
          return { language: 'ar', probability: 0.9 };
        } else if (text.includes('labas') || text.includes('mezyan')) {
          // CLD3 ne reconnaît pas le Darija, donc on simule une faible confiance
          return { language: 'unknown', probability: 0.3 };
        } else {
          return { language: 'unknown', probability: 0.1 };
        }
      })
    }))
  };
});

// Mock de GeminiModel
jest.mock('genkit-vertexai', () => {
  return {
    GeminiModel: jest.fn().mockImplementation(() => {
      return {
        generate: jest.fn(async (prompt) => {
          if (prompt.includes('bonjour') || prompt.includes('merci')) {
            return { text: 'fr' };
          } else if (prompt.includes('شكرا') || prompt.includes('مرحبا')) {
            return { text: 'ar' };
          } else if (prompt.includes('labas') || prompt.includes('mezyan')) {
            return { text: 'darija' };
          } else {
            return { text: 'fr' }; // Fallback par défaut
          }
        })
      };
    })
  };
});

describe('Flow de détection de langue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait détecter correctement le français avec CLD3', async () => {
    const result = await detectLanguage('bonjour comment allez-vous');
    expect(result.detectedLanguage).toBe('fr');
    expect(result.source).toBe('cld3');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('devrait détecter correctement l\'arabe avec CLD3', async () => {
    const result = await detectLanguage('مرحبا كيف حالك');
    expect(result.detectedLanguage).toBe('ar');
    expect(result.source).toBe('cld3');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('devrait utiliser le fallback LLM pour détecter le Darija', async () => {
    const result = await detectLanguage('labas, kif nta? mezyan');
    expect(result.detectedLanguage).toBe('darija');
    expect(result.source).toBe('llm');
  });

  it('devrait mesurer la latence correctement', async () => {
    const result = await detectLanguage('bonjour');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });
});
