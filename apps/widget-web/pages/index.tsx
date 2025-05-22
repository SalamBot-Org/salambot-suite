/**
 * @file        Page d'accueil du widget web SalamBot avec intégration de la détection de langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useLanguageStore } from '../store/languageStore';
import ChatWidget from '../components/ChatWidget';
import LanguageIndicator from '../components/LanguageIndicator';

export default function Home() {
  const { currentLanguage } = useLanguageStore();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>SalamBot Widget</title>
        <meta name="description" content="Widget de chat multilingue pour SalamBot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col flex-1 p-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
          <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">
              {currentLanguage === 'fr' && 'SalamBot Assistant'}
              {currentLanguage === 'ar' && 'مساعد سلام بوت'}
              {currentLanguage === 'ar-ma' && 'مساعد سلام بوت'}
            </h1>
            <LanguageIndicator />
          </header>
          
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
