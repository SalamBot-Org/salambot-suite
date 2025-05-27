/**
 * @file        Mock pour le module cld3
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

module.exports = {
  getLanguageDetector: jest.fn(() => ({
    findLanguage: jest.fn((text) => {
      // Simulation simple
      if (text.includes("bonjour")) return { language: "fr", probability: 0.9 };
      if (text.includes("مرحبا")) return { language: "ar", probability: 0.9 };
      if (text.includes("labas")) return { language: "unknown", probability: 0.3 };
      return { language: "unknown", probability: 0.1 };
    }),
  })),
};
