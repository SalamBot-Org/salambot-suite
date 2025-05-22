/**
 * @file        Store Zustand pour la gestion de la langue dans le widget SalamBot.
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
    // Actions
    setLanguage: (lang) => set({ currentLanguage: lang }),
    setDetectionResult: (result) => set({
        lastDetection: result,
        currentLanguage: result.lang
    }),
}));
//# sourceMappingURL=languageStore.js.map