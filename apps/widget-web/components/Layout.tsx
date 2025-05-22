/**
 * @file        Composant de mise en page pour le widget SalamBot avec adaptation à la langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { ReactNode } from 'react';
import { useLanguageStore } from '../store/languageStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentLanguage } = useLanguageStore();
  
  // Déterminer la direction du texte selon la langue
  const isRTL = currentLanguage === 'ar' || currentLanguage === 'ar-ma';
  
  return (
    <div 
      className={`min-h-screen transition-all duration-300 ${
        isRTL ? 'rtl-text' : ''
      } lang-${currentLanguage}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  );
}
