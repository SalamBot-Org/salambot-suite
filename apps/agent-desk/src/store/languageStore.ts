/**
 * @file        Store Zustand pour la gestion de la langue dans l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { create } from 'zustand';
import { LangResult } from '../utils/lang-detect-mock';

interface LanguageState {
  // État actuel
  currentLanguage: 'fr' | 'ar' | 'ar-ma' | 'unknown';
  lastDetection: LangResult | null;
  
  // Conversations par langue
  conversationsByLang: {
    fr: number;
    ar: number;
    'ar-ma': number;
    unknown: number;
  };
  
  // Actions
  setLanguage: (lang: 'fr' | 'ar' | 'ar-ma' | 'unknown') => void;
  setDetectionResult: (result: LangResult, conversationId?: string) => void;
  incrementConversationCount: (lang: 'fr' | 'ar' | 'ar-ma' | 'unknown') => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
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
    const updatedCounts = { ...state.conversationsByLang };
    updatedCounts[result.lang] = (updatedCounts[result.lang] || 0) + (conversationId ? 1 : 0);
    
    return {
      lastDetection: result,
      currentLanguage: result.lang,
      conversationsByLang: updatedCounts
    };
  }),
  
  incrementConversationCount: (lang) => set((state) => {
    const updatedCounts = { ...state.conversationsByLang };
    updatedCounts[lang] = (updatedCounts[lang] || 0) + 1;
    
    return {
      conversationsByLang: updatedCounts
    };
  }),
}));
