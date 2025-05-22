/**
 * @file        Store Zustand pour la gestion de la langue dans l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { create } from 'zustand';
export const useLanguageStore = create((set) => ({
    // État initial
    currentLanguage: 'fr',
    lastDetection: null,
    conversationsByLang: {
        fr: 0,
        ar: 0,
        'ar-ma': 0,
        unknown: 0
    },
    // Actions
    setLanguage: (lang) => set({ currentLanguage: lang }),
    setDetectionResult: (result, conversationId) => set((state) => {
        // Incrémenter le compteur de conversations pour cette langue
        const updatedCounts = Object.assign({}, state.conversationsByLang);
        updatedCounts[result.lang] = (updatedCounts[result.lang] || 0) + (conversationId ? 1 : 0);
        return {
            lastDetection: result,
            currentLanguage: result.lang,
            conversationsByLang: updatedCounts
        };
    }),
    incrementConversationCount: (lang) => set((state) => {
        const updatedCounts = Object.assign({}, state.conversationsByLang);
        updatedCounts[lang] = (updatedCounts[lang] || 0) + 1;
        return {
            conversationsByLang: updatedCounts
        };
    }),
}));
//# sourceMappingURL=languageStore.js.map