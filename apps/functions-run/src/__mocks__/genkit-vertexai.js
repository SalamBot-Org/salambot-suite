/**
 * @file        Mock pour le module genkit-vertexai
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

module.exports = {
  GeminiModel: jest.fn().mockImplementation(() => {
    return {
      generate: jest.fn(async (prompt) => {
        // Simulation simple
        if (prompt.includes('bonjour')) return { text: 'fr' };
        if (prompt.includes('مرحبا')) return { text: 'ar' };
        if (prompt.includes('labas')) return { text: 'darija' };
        return { text: 'fr' }; // Fallback
      }),
    };
  }),
};
