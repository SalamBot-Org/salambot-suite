/**
 * @file        Store Zustand pour la gestion de la langue dans le widget SalamBot.
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
  
  // Actions
  setLanguage: (lang: 'fr' | 'ar' | 'ar-ma' | 'unknown') => void;
  setDetectionResult: (result: LangResult) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
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
