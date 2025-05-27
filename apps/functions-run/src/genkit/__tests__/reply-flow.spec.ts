/**
 * @file        Tests unitaires pour le flow de génération de réponse
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Utilisation des globals Jest sans require/import
const { generateReply } = require('../reply-flow');
const { SupportedLanguage } = require('../types');

// Mock de GeminiModel
jest.mock('genkit-vertexai', () => {
  return {
    GeminiModel: jest.fn().mockImplementation(() => {
      return {
        generate: jest.fn(async (prompt) => {
          if (prompt.includes('français') || prompt.includes('fr')) {
            return { text: 'Voici une réponse en français.' };
          } else if (prompt.includes('arabe') || prompt.includes('ar')) {
            return { text: 'هذه إجابة باللغة العربية.' };
          } else {
            return { text: 'Réponse par défaut.' };
          }
        })
      };
    })
  };
});

// Mock de OpenAIModel
jest.mock('genkit-openai', () => {
  return {
    OpenAIModel: jest.fn().mockImplementation(() => {
      return {
        generate: jest.fn(async (prompt) => {
          if (prompt.includes('darija')) {
            return { text: 'هذه إجابة باللغة العربية الفصحى لرسالة بالدارجة المغربية.' };
          } else {
            return { text: 'Réponse par défaut.' };
          }
        })
      };
    })
  };
});

// Mock de fs pour les prompts
jest.mock('fs', () => {
  return {
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn((path) => {
      if (path.includes('fr_ar.prompt.txt')) {
        return 'Prompt pour français et arabe';
      } else if (path.includes('darija.prompt.txt')) {
        return 'Prompt pour darija';
      }
      return '';
    })
  };
});

describe('Flow de génération de réponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait générer une réponse en français', async () => {
    const result = await generateReply('Bonjour, comment ça va?', 'fr');
    expect(result.reply).toContain('français');
    expect(result.lang).toBe('fr');
    expect(result.modelUsed).toBe('gemini-pro');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('devrait générer une réponse en arabe', async () => {
    const result = await generateReply('مرحبا كيف حالك', 'ar');
    expect(result.reply).toContain('العربية');
    expect(result.lang).toBe('ar');
    expect(result.modelUsed).toBe('gemini-pro');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('devrait générer une réponse en arabe classique pour un message en darija', async () => {
    const result = await generateReply('labas, kif nta?', 'darija');
    expect(result.reply).toContain('العربية الفصحى');
    expect(result.lang).toBe('darija');
    expect(result.modelUsed).toBe('llama-4');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('devrait gérer les erreurs et fournir une réponse de secours', async () => {
    // Simuler une erreur en remplaçant temporairement l'implémentation du mock
    const mockGeminiGenerate = jest.fn().mockRejectedValue(new Error('Erreur simulée'));
    jest.mocked(require('genkit-vertexai').GeminiModel).mockImplementationOnce(() => ({
      generate: mockGeminiGenerate
    }));
    
    const result = await generateReply('Message qui provoque une erreur', 'fr');
    expect(result.reply).toContain('difficultés techniques');
    expect(result.modelUsed).toBe('fallback');
  });
});
