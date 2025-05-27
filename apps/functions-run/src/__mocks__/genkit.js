/**
 * @file        Mock pour le module genkit
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

module.exports = {
  flow: jest.fn((config) => {
    // Retourne une fonction qui exécute la logique run du flow
    return {
      run: jest.fn(async (input) => {
        const startTime = Date.now();
        const latency = () => Date.now() - startTime;

        // Logique spécifique au flow lang-detect-flow
        if (config.name === "lang-detect-flow") { 
          const text = input.text || ""; // Assurer que text est défini
          let detectedLanguage = "unknown"; // Default to unknown
          let source = "cld3";
          let confidence = 0.1;

          if (text.includes("bonjour")) {
            detectedLanguage = "fr";
            confidence = 0.9;
          } else if (text.includes("مرحبا")) {
            detectedLanguage = "ar";
            confidence = 0.9;
          } else if (text.includes("labas")) {
            detectedLanguage = "darija";
            source = "llm"; // Simule le fallback LLM pour Darija
            confidence = 0.8; // Simule une confiance LLM
          }
          // Si aucun mot-clé spécifique n'est trouvé, la valeur par défaut 'unknown' est conservée
          
          const result = { detectedLanguage, source, confidence, latency: latency() };
          // console.log(`Mock lang-detect-flow returning: ${JSON.stringify(result)} for input: ${text}`); // Log pour débogage
          return result;
        }
        
        // Logique spécifique au flow reply-flow
        // Utiliser le nom exact du flow défini dans reply-flow.ts
        if (config.name === "reply-flow") { 
          const lang = input.lang;
          const message = input.message || ""; // Assurer que message est défini
          let reply = "Réponse par défaut.";
          let modelUsed = "mock";

          // Simuler une erreur pour le test de fallback
          if (message.includes("provoque une erreur")) {
             return { reply: "Désolé, je rencontre des difficultés techniques.", lang: lang, modelUsed: "fallback", latency: latency() };
          }

          // Logique basée sur la langue
          if (lang === "fr") {
            reply = "Voici une réponse en français.";
            modelUsed = "gemini-pro";
          } else if (lang === "ar") {
            reply = "هذه إجابة باللغة العربية.";
            modelUsed = "gemini-pro";
          } else if (lang === "darija") {
            reply = "هذه إجابة باللغة العربية الفصحى لرسالة بالدارجة المغربية.";
            modelUsed = "llama-4";
          }
          
          const result = { reply, lang, modelUsed, latency: latency() };
          // console.log(`Mock reply-flow returning: ${JSON.stringify(result)} for input: ${message}, lang: ${lang}`); // Log pour débogage
          return result;
        }
        
        // Fallback si le nom du flow n'est pas reconnu
        console.warn(`Mock genkit: Flow non reconnu: ${config.name}`);
        return {};
      }),
    };
  }),
};
