/**
 * @file        Mock pour le module genkit-openai
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

module.exports = {
  OpenAIModel: jest.fn().mockImplementation(() => {
    return {
      generate: jest.fn(async (prompt) => {
        // Simulation simple
        if (prompt.includes("darija")) return { text: "هذه إجابة باللغة العربية الفصحى لرسالة بالدارجة المغربية." };
        return { text: "Réponse par défaut." };
      }),
    };
  }),
};
